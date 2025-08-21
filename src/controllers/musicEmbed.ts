import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  blockQuote,
  bold,
  type Client,
  Colors,
  type EmbedBuilder,
  inlineCode,
  italic,
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
  lastUpdateTime: number;
}

const musicEmbedManagers = new Map<string, MusicEmbedManager>();
const UPDATE_THRESHOLD = 2000;

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
        lastUpdateTime: 0,
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
      } catch (error) {
        Logger.debug("Failed to delete embed message", { guildId, error });
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
    if (!this.#shouldUpdate()) return;

    const embed = this.#buildMusicEmbed(client, queue, currentTrack, user);
    const components = this.#buildControlComponents(queue);

    try {
      const shouldReposition = await this.#shouldRepositionEmbed();

      if (this.#manager.message && shouldReposition) {
        await this.#deleteCurrentEmbed();
      }

      if (this.#manager.message) {
        await this.#manager.message.edit({
          embeds: [embed],
          components,
        });
      } else {
        const message = await this.#channel.send({
          embeds: [embed],
          components,
        });

        this.#manager.message = message;
        this.#manager.lastMessageId = message.id;
      }

      this.#manager.lastUpdateTime = Date.now();
      this.#startProgressUpdater(queue, currentTrack, user, client);
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
      } catch (error) {
        Logger.debug("Failed to delete music embed", {
          guildId: this.#guildId,
          error,
        });
      }
      this.#cleanup();
    }
  }

  #shouldUpdate(): boolean {
    const now = Date.now();
    return now - this.#manager.lastUpdateTime >= UPDATE_THRESHOLD;
  }

  async #shouldRepositionEmbed(): Promise<boolean> {
    if (!this.#manager.message || !this.#manager.lastMessageId) return false;

    try {
      const messages = await this.#channel.messages.fetch({ limit: 5 });
      const embedMessage = messages.get(this.#manager.lastMessageId);
      const recentMessages = Array.from(messages.values()).slice(0, 3);

      return !recentMessages.includes(embedMessage as Message<true>);
    } catch (error) {
      Logger.debug("Failed to check embed position", {
        guildId: this.#guildId,
        error,
      });
      return true;
    }
  }

  async #deleteCurrentEmbed(): Promise<void> {
    if (this.#manager.message) {
      try {
        await this.#manager.message.delete();
      } catch (error) {
        Logger.debug("Failed to delete current embed", {
          guildId: this.#guildId,
          error,
        });
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
    const isPlaying = queue.node.isPlaying();
    const isPaused = queue.node.isPaused();

    const statusEmoji = isPlaying ? "🎵" : isPaused ? "⏸️" : "⏹️";
    const statusText = isPlaying
      ? "Now Playing"
      : isPaused
        ? "Paused"
        : "Stopped";
    const embedColor = isPlaying
      ? Colors.Green
      : isPaused
        ? Colors.Yellow
        : Colors.Red;

    const embed = styledEmbed(client)
      .setColor(embedColor)
      .setTitle(
        `${statusEmoji} ${statusText} • ${bold(track.cleanTitle || track.title || "Unknown Track")}`,
      )
      .setURL(track.url || null)
      .setDescription(italic(`by ${track.author || "Unknown Artist"}`));

    if (track.thumbnail) {
      embed.setThumbnail(track.thumbnail);
    }

    embed.addFields(
      {
        name: "🎼 Track Details",
        value: blockQuote(
          [
            `${bold("Duration:")} ${inlineCode(track.duration || "Unknown")}`,
            `${bold("Source:")} ${inlineCode(track.source || "Unknown")}`,
            `${bold("Requested by:")} ${user.toString()}`,
          ].join("\n"),
        ),
        inline: false,
      },
      {
        name: "🎚️ Player Settings",
        value: blockQuote(
          [
            `${bold("Volume:")} ${inlineCode(`${queue.node.volume || 0}%`)}`,
            `${bold("Loop Mode:")} ${inlineCode(this.#getLoopModeDisplay(queue))}`,
            `${bold("Queue Size:")} ${inlineCode(`${queue.tracks.size} track(s)`)}`,
          ].join("\n"),
        ),
        inline: false,
      },
    );

    if (queue.tracks.size > 0) {
      const nextTrack = queue.tracks.at(0);
      const queueDuration = String(queue.estimatedDuration) || "Unknown";

      embed.addFields({
        name: "📊 Queue Information",
        value: blockQuote(
          [
            `${bold("Total Duration:")} ${inlineCode(queueDuration)}`,
            `${bold("Up Next:")} ${
              nextTrack
                ? `[${nextTrack.cleanTitle || nextTrack.title || "Unknown"}](${nextTrack.url || "#"})`
                : italic("No upcoming tracks")
            }`,
          ].join("\n"),
        ),
        inline: false,
      });
    }

    if (isPlaying && track.durationMS) {
      try {
        const progress = queue.node.getTimestamp();
        if (progress?.current && progress.total) {
          const currentMs = progress.current.value || 0;
          const totalMs = track.durationMS;

          if (totalMs > 0 && currentMs >= 0) {
            const progressBar = this.#createAdvancedProgressBar(
              currentMs,
              totalMs,
            );
            embed.addFields({
              name: "⏱️ Progress",
              value: blockQuote(
                [
                  `${progress.current.label} ${progressBar} ${progress.total.label}`,
                  `${this.#getProgressPercentage(currentMs, totalMs)}% complete`,
                ].join("\n"),
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

  #buildControlComponents(
    queue: GuildQueue,
  ): ActionRowBuilder<ButtonBuilder>[] {
    const isPlaying = queue.node.isPlaying();
    const isPaused = queue.node.isPaused();
    const hasQueue = queue.tracks.size > 0;

    const mainControls = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`music_${isPaused ? "resume" : "pause"}`)
        .setLabel(isPaused ? "Resume" : "Pause")
        .setEmoji(isPaused ? "▶️" : "⏸️")
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!isPlaying && !isPaused),
      new ButtonBuilder()
        .setCustomId("music_skip")
        .setLabel("Skip")
        .setEmoji("⏭️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasQueue && !isPlaying),
      new ButtonBuilder()
        .setCustomId("music_stop")
        .setLabel("Stop")
        .setEmoji("⏹️")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!isPlaying && !isPaused),
      new ButtonBuilder()
        .setCustomId("music_shuffle")
        .setLabel("Shuffle")
        .setEmoji("🔀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(queue.tracks.size < 2),
    );

    const queueControls = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("music_loop")
        .setLabel("Loop")
        .setEmoji("🔁")
        .setStyle(
          queue.repeatMode > 0 ? ButtonStyle.Success : ButtonStyle.Secondary,
        ),
      new ButtonBuilder()
        .setCustomId("music_queue")
        .setLabel("View Queue")
        .setEmoji("📋")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(queue.tracks.size === 0),
      new ButtonBuilder()
        .setCustomId("music_clear")
        .setLabel("Clear Queue")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(queue.tracks.size === 0),
      new ButtonBuilder()
        .setCustomId("music_refresh")
        .setLabel("Refresh")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary),
    );

    const volumeControls = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("music_volume_down")
        .setLabel("Vol -10")
        .setEmoji("🔉")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(queue.node.volume <= 0),
      new ButtonBuilder()
        .setCustomId("music_volume_mute")
        .setLabel(queue.node.volume === 0 ? "Unmute" : "Mute")
        .setEmoji(queue.node.volume === 0 ? "🔊" : "🔇")
        .setStyle(
          queue.node.volume === 0 ? ButtonStyle.Success : ButtonStyle.Secondary,
        ),
      new ButtonBuilder()
        .setCustomId("music_volume_up")
        .setLabel("Vol +10")
        .setEmoji("🔊")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(queue.node.volume >= 100),
    );

    return [mainControls, queueControls, volumeControls];
  }

  #createAdvancedProgressBar(current: number, total: number): string {
    const percentage = Math.min(Math.max(current / total, 0), 1);
    const progressChars = Math.round(percentage * 25);
    const emptyChars = 25 - progressChars;

    const filledBar = "▰".repeat(progressChars);
    const emptyBar = "▱".repeat(emptyChars);

    return `${filledBar}${emptyBar}`;
  }

  #getProgressPercentage(current: number, total: number): number {
    return Math.round((current / total) * 100);
  }

  #getLoopModeDisplay(queue: GuildQueue): string {
    const repeatMode = queue.repeatMode;
    switch (repeatMode) {
      case 1:
        return "🔂 Track";
      case 2:
        return "🔁 Queue";
      case 3:
        return "📻 Autoplay";
      default:
        return "❌ Off";
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
        if (
          !this.#manager.message ||
          (!queue.node.isPlaying() && !queue.node.isPaused())
        ) {
          this.#stopProgressUpdater();
          return;
        }

        if (!this.#shouldUpdate()) return;

        const embed = this.#buildMusicEmbed(client, queue, currentTrack, user);
        const components = this.#buildControlComponents(queue);

        await this.#manager.message.edit({
          embeds: [embed],
          components,
        });

        this.#manager.lastUpdateTime = Date.now();
      } catch (error) {
        Logger.debug("Failed to update progress", {
          guildId: this.#guildId,
          error: error instanceof Error ? error.message : String(error),
        });
        this.#stopProgressUpdater();
      }
    }, 3000);
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
    this.#manager.lastUpdateTime = 0;
  }
}
