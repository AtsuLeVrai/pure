import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  blockQuote,
  type Client,
  type EmbedBuilder,
  inlineCode,
  type Message,
  type TextChannel,
  type User,
} from "discord.js";
import type { GuildQueue, Track } from "discord-player";
import { styledEmbed } from "@/utils/formatters.js";
import { Logger } from "@/utils/logger.js";

interface MusicEmbedManager {
  message: Message | null;
  lastMessageId: string | null;
  channel: TextChannel;
  guildId: string;
  progressInterval: NodeJS.Timeout | null;
}

const musicEmbedManagers = new Map<string, MusicEmbedManager>();

export class MusicEmbedController {
  #channel: TextChannel;
  #manager: MusicEmbedManager;
  readonly #guildId: string;

  constructor(guildId: string, channel: TextChannel) {
    this.#guildId = guildId;
    this.#channel = channel;

    if (!musicEmbedManagers.has(guildId)) {
      musicEmbedManagers.set(guildId, {
        message: null,
        lastMessageId: null,
        channel,
        guildId,
        progressInterval: null,
      });
    }

    this.#manager = musicEmbedManagers.get(guildId) as MusicEmbedManager;
    this.#manager.channel = channel;
  }

  static cleanup(guildId: string): void {
    const manager = musicEmbedManagers.get(guildId);
    if (manager) {
      if (manager.progressInterval) {
        clearInterval(manager.progressInterval);
      }
      musicEmbedManagers.delete(guildId);
    }
  }

  static async deleteEmbedForGuild(guildId: string): Promise<void> {
    const manager = musicEmbedManagers.get(guildId);
    if (manager?.message) {
      try {
        await manager.message.delete();
      } catch (_error) {
        // Message might already be deleted
      }
      MusicEmbedController.cleanup(guildId);
    }
  }

  async createOrUpdateEmbed(
    client: Client<true>,
    queue: GuildQueue,
    currentTrack: Track,
    user: User,
  ): Promise<void> {
    const embed = this.#buildMusicEmbed(client, queue, currentTrack, user);
    const components = this.#buildControlComponents();

    try {
      if (this.#manager.message && (await this.#shouldRepositionEmbed())) {
        await this.#deleteCurrentEmbed();
      }

      if (this.#manager.message) {
        await this.#manager.message.edit({
          embeds: [embed],
          components,
        });
        this.#startProgressUpdater(queue, currentTrack, user, client);
      } else {
        const message = await this.#channel.send({
          embeds: [embed],
          components,
        });

        this.#manager.message = message;
        this.#manager.lastMessageId = message.id;
        this.#startProgressUpdater(queue, currentTrack, user, client);
      }
    } catch (error) {
      Logger.error("Failed to create/update music embed", {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : String(error),
        guildId: this.#guildId,
      });
    }
  }

  async deleteEmbed(): Promise<void> {
    if (this.#manager.message) {
      try {
        await this.#manager.message.delete();
      } catch (_error) {
        Logger.debug(
          "Failed to delete music embed (message may already be deleted)",
          {
            guildId: this.#guildId,
          },
        );
      }

      this.#cleanup();
    }
  }

  async #shouldRepositionEmbed(): Promise<boolean> {
    if (!this.#manager.message || !this.#manager.lastMessageId) return false;

    try {
      const messages = await this.#channel.messages.fetch({ limit: 5 });
      const embedMessage = messages.get(this.#manager.lastMessageId);

      const recentMessages = Array.from(messages.values()).slice(0, 3);
      return !recentMessages.includes(embedMessage as Message<true>);
    } catch (_error) {
      return true;
    }
  }

  async #deleteCurrentEmbed(): Promise<void> {
    if (this.#manager.message) {
      try {
        await this.#manager.message.delete();
      } catch (_error) {
        // Message might already be deleted
      }
      this.#manager.message = null;
      this.#manager.lastMessageId = null;
    }
  }

  #buildMusicEmbed(
    client: Client<true>,
    queue: GuildQueue,
    track: Track,
    user: User,
  ): EmbedBuilder {
    const embed = styledEmbed(client)
      .setTitle(`🎵 Now Playing • ${track.cleanTitle}`)
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .addFields(
        {
          name: "🔗 Source",
          value: blockQuote(inlineCode(track.source)),
          inline: true,
        },
        {
          name: "⏱️ Duration",
          value: blockQuote(inlineCode(track.duration)),
          inline: true,
        },
        {
          name: "🎤 Artist",
          value: blockQuote(inlineCode(track.author)),
          inline: true,
        },
        {
          name: "🔊 Volume",
          value: blockQuote(inlineCode(`${queue.node.volume}%`)),
          inline: true,
        },
        {
          name: "🔁 Loop Mode",
          value: blockQuote(inlineCode(this.#getLoopModeDisplay(queue))),
          inline: true,
        },
        {
          name: "\u2800",
          value: "\u2800",
          inline: true,
        },
        {
          name: "👤 Requested By",
          value: blockQuote(user.toString()),
        },
      );

    if (queue.tracks.size > 0) {
      const nextTrack = queue.tracks.at(0);
      embed.addFields(
        {
          name: "📊 Queue Info",
          value: `**${queue.tracks.size}** track(s) • ⏱️ **${queue.estimatedDuration}** remaining`,
          inline: false,
        },
        {
          name: "⏭️ Up Next",
          value: nextTrack
            ? `🎵 [${nextTrack.cleanTitle || nextTrack.title}](${nextTrack.url})`
            : "No upcoming tracks",
          inline: false,
        },
      );
    }

    if (queue.node.isPlaying() && track.durationMS) {
      try {
        const progress = queue.node.getTimestamp();
        if (progress?.current && progress.total) {
          const currentMs = progress.current.value || 0;
          const totalMs = track.durationMS;

          if (totalMs > 0 && currentMs >= 0) {
            const progressBar = this.#createProgressBar(currentMs, totalMs);
            embed.addFields({
              name: "⏱️ Progress",
              value: blockQuote(
                `${progress.current.label} ${progressBar} ${progress.total.label}`,
              ),
              inline: false,
            });
          }
        }
      } catch (error) {
        Logger.debug("Could not get progress timestamp", {
          guildId: this.#guildId,
          trackTitle: track.cleanTitle || track.title,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return embed;
  }

  #buildControlComponents(): ActionRowBuilder<ButtonBuilder>[] {
    const controlRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`music_pause_${this.#guildId}`)
        .setLabel("Pause")
        .setEmoji("⏸️")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`music_resume_${this.#guildId}`)
        .setLabel("Resume")
        .setEmoji("▶️")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`music_skip_${this.#guildId}`)
        .setLabel("Skip")
        .setEmoji("⏭️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`music_stop_${this.#guildId}`)
        .setLabel("Stop")
        .setEmoji("⏹️")
        .setStyle(ButtonStyle.Danger),
    );

    const controlRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`music_shuffle_${this.#guildId}`)
        .setLabel("Shuffle")
        .setEmoji("🔀")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`music_loop_${this.#guildId}`)
        .setLabel("Loop")
        .setEmoji("🔁")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`music_queue_${this.#guildId}`)
        .setLabel("Queue")
        .setEmoji("📋")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`music_refresh_${this.#guildId}`)
        .setLabel("Refresh")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary),
    );

    const volumeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`music_volume_down_${this.#guildId}`)
        .setLabel("Vol -")
        .setEmoji("🔉")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`music_volume_mute_${this.#guildId}`)
        .setLabel("Mute")
        .setEmoji("🔇")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`music_volume_up_${this.#guildId}`)
        .setLabel("Vol +")
        .setEmoji("🔊")
        .setStyle(ButtonStyle.Success),
    );

    return [controlRow1, controlRow2, volumeRow];
  }

  #createProgressBar(current: number, total: number): string {
    const percentage = Math.min(current / total, 1);
    const progressChars = Math.round(percentage * 20);
    const emptyChars = 20 - progressChars;

    return `${"█".repeat(progressChars)}${"░".repeat(emptyChars)}`;
  }

  #getLoopModeDisplay(queue: GuildQueue): string {
    const repeatMode = queue.repeatMode;
    switch (repeatMode) {
      case 1:
        return "Track";
      case 2:
        return "Queue";
      case 3:
        return "Autoplay";
      default:
        return "Off";
    }
  }

  #startProgressUpdater(
    queue: GuildQueue,
    currentTrack: Track,
    user: User,
    client: Client<true>,
  ): void {
    if (this.#manager.progressInterval) {
      clearInterval(this.#manager.progressInterval);
    }

    this.#manager.progressInterval = setInterval(async () => {
      try {
        if (!this.#manager.message || !queue.node.isPlaying()) {
          this.#stopProgressUpdater();
          return;
        }

        const embed = this.#buildMusicEmbed(client, queue, currentTrack, user);
        const components = this.#buildControlComponents();

        await this.#manager.message.edit({
          embeds: [embed],
          components,
        });
      } catch (error) {
        Logger.debug("Failed to update progress", {
          guildId: this.#guildId,
          error: error instanceof Error ? error.message : String(error),
        });
        this.#stopProgressUpdater();
      }
    }, 1000);
  }

  #stopProgressUpdater(): void {
    if (this.#manager.progressInterval) {
      clearInterval(this.#manager.progressInterval);
      this.#manager.progressInterval = null;
    }
  }

  #cleanup(): void {
    this.#stopProgressUpdater();
    this.#manager.message = null;
    this.#manager.lastMessageId = null;
  }
}
