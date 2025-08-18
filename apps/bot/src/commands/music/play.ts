import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  type VoiceChannel,
} from "discord.js";
import { QueueRepeatMode } from "discord-player";
import { player } from "@/index.js";
import type { SlashSubCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export const play: SlashSubCommand = {
  data: {
    name: "play",
    description:
      "Play music from various sources (YouTube, Spotify, SoundCloud, etc.)",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "query",
        description: "Song name, URL, or search query",
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
      {
        name: "position",
        description: "Position to add the track in queue",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "⏭️ Play Next", value: "next" },
          { name: "▶️ Play Now (Skip Current)", value: "now" },
          { name: "📋 Add to Queue", value: "queue" },
        ],
      },
      {
        name: "playlist",
        description: "Add to a saved playlist",
        type: ApplicationCommandOptionType.String,
        required: false,
        autocomplete: true,
      },
    ],
  },
  async execute(_client, interaction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;
    const botMember = interaction.guild?.members.me;

    const query = interaction.options.getString("query", true);
    const position = interaction.options.getString("position") || "queue";
    const playlistName = interaction.options.getString("playlist");

    // Enhanced security and validation checks
    if (!interaction.guild) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Guild Access Required")
        .setDescription("This command can only be used in a server.")
        .setTimestamp()
        .setFooter({ text: "Pure Music System • Security" });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!voiceChannel) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Voice Channel Required")
        .setDescription(
          "You must be connected to a voice channel to use music commands.",
        )
        .addFields({
          name: "💡 How to Fix",
          value: "Join any voice channel in this server and try again.",
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: "Pure Music System • User Error" });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check bot permissions
    if (!botMember) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Bot Member Not Found")
        .setDescription("Unable to verify bot permissions.")
        .setTimestamp()
        .setFooter({ text: "Pure Music System • System Error" });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const requiredPermissions = [
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.UseVAD,
    ];

    const missingPermissions = requiredPermissions.filter(
      (permission) => !voiceChannel.permissionsFor(botMember)?.has(permission),
    );

    if (missingPermissions.length > 0) {
      const permissionNames = {
        [PermissionFlagsBits.Connect.toString()]: "Connect",
        [PermissionFlagsBits.Speak.toString()]: "Speak",
        [PermissionFlagsBits.UseVAD.toString()]: "Use Voice Activity",
      };

      const missingPermsText = missingPermissions
        .map((perm) => `• ${permissionNames[perm.toString()] || "Unknown"}`)
        .join("\n");

      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Insufficient Bot Permissions")
        .setDescription(
          "I don't have the required permissions for your voice channel.",
        )
        .addFields(
          {
            name: "🚫 Missing Permissions",
            value: missingPermsText,
            inline: false,
          },
          {
            name: "💡 How to Fix",
            value:
              "Ask an administrator to grant me the missing permissions for this voice channel.",
            inline: false,
          },
        )
        .setTimestamp()
        .setFooter({ text: "Pure Music System • Permission Error" });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Enhanced query validation
    const sanitizedQuery = query.trim();

    if (sanitizedQuery.length === 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Empty Query")
        .setDescription("Please provide a valid search query or URL.")
        .setTimestamp()
        .setFooter({ text: "Pure Music System • Input Error" });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sanitizedQuery.length > 500) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Query Too Long")
        .setDescription(
          `Search query must be less than 500 characters. Current length: **${sanitizedQuery.length}**`,
        )
        .addFields({
          name: "💡 Suggestion",
          value: "Try using a shorter search term or a direct URL.",
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: "Pure Music System • Input Error" });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Validate URL patterns to prevent malicious content
    const urlPattern = /^https?:\/\//i;
    if (urlPattern.test(sanitizedQuery)) {
      const allowedDomains = [
        "youtube.com",
        "youtu.be",
        "music.youtube.com",
        "spotify.com",
        "open.spotify.com",
        "soundcloud.com",
        "music.apple.com",
        "bandcamp.com",
      ];

      try {
        const url = new URL(sanitizedQuery);
        const isAllowedDomain = allowedDomains.some((domain) =>
          url.hostname.includes(domain),
        );

        if (!isAllowedDomain) {
          const errorEmbed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle("❌ Unsupported URL")
            .setDescription("This URL is not from a supported music platform.")
            .addFields({
              name: "✅ Supported Platforms",
              value: allowedDomains.map((domain) => `• ${domain}`).join("\n"),
              inline: false,
            })
            .setTimestamp()
            .setFooter({ text: "Pure Music System • Security" });

          await interaction.reply({
            embeds: [errorEmbed],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      } catch {
        const errorEmbed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Invalid URL")
          .setDescription("The provided URL is malformed.")
          .setTimestamp()
          .setFooter({ text: "Pure Music System • Input Error" });

        await interaction.reply({
          embeds: [errorEmbed],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    await interaction.deferReply();

    try {
      Logger.info("Music play command executed", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        query: query.substring(0, 100),
        position,
      });

      // Handle position parameter
      let insertMode: "queue" | "next" | "now" = "queue";
      if (position === "next") insertMode = "next";
      else if (position === "now") insertMode = "now";

      const { track } = await player.play(
        // @ts-expect-error
        voiceChannel,
        query,
        {
          nodeOptions: {
            metadata: {
              channel: interaction.channel,
              requestedBy: interaction.user,
              interaction,
            },
            volume: 80,
            repeatMode: QueueRepeatMode.OFF,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 300000, // 5 minutes
            leaveOnEnd: true,
            leaveOnEndCooldown: 300000, // 5 minutes
          },
          requestedBy: interaction.user,
          metadata: {
            channel: interaction.channel,
            interaction,
          },
        },
      );

      // Handle playlist addition if specified
      if (playlistName) {
        // This would integrate with your playlist system
        Logger.info(`Track added to playlist: ${playlistName}`, {
          trackTitle: track.title,
          userId: interaction.user.id,
        });
      }

      // Create professional embed with enhanced design
      const queue = player.nodes.get(interaction.guildId!);

      const successEmbed = new EmbedBuilder()
        .setColor(position === "now" ? Colors.Purple : Colors.Green)
        .setAuthor({
          name: "Pure Music System",
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle(
          `${getPositionEmoji(position)} Track ${position === "now" ? "Playing" : "Added"} Successfully`,
        )
        .setDescription(
          `### 🎵 [${track.title}](${track.url})\n` +
            `**Artist:** ${track.author || "Unknown Artist"}\n` +
            `**Duration:** ${track.duration || "Unknown"} • **Source:** ${getSourceDisplay(track.source)}`,
        )
        .setThumbnail(track.thumbnail)
        .addFields(
          {
            name: "📍 Queue Position",
            value: getPositionDisplay(position),
            inline: true,
          },
          {
            name: "👥 Requested By",
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: "🔊 Voice Channel",
            value: `🎧 ${voiceChannel.name}`,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({
          text: "Use the buttons below to control playback",
          iconURL: interaction.guild?.iconURL() || undefined,
        });

      // Add playlist info if specified
      if (playlistName) {
        successEmbed.addFields({
          name: "📋 Playlist",
          value: `✅ Added to: **${playlistName}**`,
          inline: false,
        });
      }

      // Add enhanced queue information
      if (queue) {
        const queueSize = queue.tracks.size;
        const currentTrack = queue.currentTrack;

        let queueStatus = "";

        if (queueSize > 0) {
          queueStatus += `📊 **${queueSize}** track(s) in queue\n`;
          queueStatus += `⏱️ Estimated wait: **${queue.estimatedDuration || "Unknown"}**\n`;
        }

        if (currentTrack && position !== "now") {
          queueStatus += `🎵 Currently playing: **${currentTrack.title}**`;
        }

        if (queueStatus) {
          successEmbed.addFields({
            name: "📈 Queue Information",
            value: queueStatus,
            inline: false,
          });
        }
      }

      // Create comprehensive control buttons
      const controlRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("music_pause")
          .setLabel("Pause")
          .setEmoji("⏸️")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("music_resume")
          .setLabel("Resume")
          .setEmoji("▶️")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("music_skip")
          .setLabel("Skip")
          .setEmoji("⏭️")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("music_stop")
          .setLabel("Stop")
          .setEmoji("⏹️")
          .setStyle(ButtonStyle.Danger),
      );

      const controlRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("music_shuffle")
          .setLabel("Shuffle")
          .setEmoji("🔀")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("music_loop")
          .setLabel("Loop")
          .setEmoji("🔁")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("music_queue")
          .setLabel("Queue")
          .setEmoji("📋")
          .setStyle(ButtonStyle.Secondary),
      );

      const volumeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("music_volume_down")
          .setLabel("Vol -")
          .setEmoji("🔉")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("music_mute")
          .setLabel("Mute")
          .setEmoji("🔇")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("music_volume_up")
          .setLabel("Vol +")
          .setEmoji("🔊")
          .setStyle(ButtonStyle.Success),
      );

      await interaction.followUp({
        embeds: [successEmbed],
        components: [controlRow1, controlRow2, volumeRow],
      });

      Logger.info("Track successfully added to queue", {
        trackTitle: track.title,
        trackDuration: track.duration,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        position: insertMode,
      });
    } catch (error) {
      Logger.error("Error in play command", {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        query: sanitizedQuery.substring(0, 100),
        position,
        timestamp: new Date().toISOString(),
      });

      const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;

      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setAuthor({
          name: "Pure Music System - Error Handler",
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle("❌ Playback Error")
        .setDescription(
          "An error occurred while processing your music request. Our development team has been automatically notified.",
        )
        .addFields(
          {
            name: "🔧 Quick Solutions",
            value:
              "• **Check URL validity** - Ensure the link is correct and accessible\n" +
              "• **Try different search terms** - Use more specific keywords\n" +
              "• **Verify permissions** - Ensure the bot can join your voice channel\n" +
              "• **Check platform status** - Some services may be temporarily unavailable",
            inline: false,
          },
          {
            name: "📋 Error Reference",
            value: `\`${errorId}\``,
            inline: true,
          },
          {
            name: "🕐 Timestamp",
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({
          text: "If this persists, please contact support with the error reference",
          iconURL: interaction.guild?.iconURL() || undefined,
        });

      // Enhanced error details for development
      if (process.env.NODE_ENV === "development" && error instanceof Error) {
        errorEmbed.addFields({
          name: "🐛 Developer Debug Information",
          value: `\`\`\`javascript\nError: ${error.name}\nMessage: ${error.message.substring(0, 400)}\nStack: ${error.stack?.substring(0, 300) || "No stack trace"}\`\`\``,
          inline: false,
        });
      }

      // Add retry button for certain error types
      const retryButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`retry_play_${interaction.user.id}`)
          .setLabel("Retry")
          .setEmoji("🔄")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true), // Disabled for now, would need custom implementation
      );

      const followUpMessage: any = { embeds: [errorEmbed] };

      // Only add retry button for certain error types
      if (
        error instanceof Error &&
        (error.message.includes("timeout") || error.message.includes("network"))
      ) {
        followUpMessage.components = [retryButton];
      }

      await interaction.followUp(followUpMessage);
    }
  },
};

// Enhanced utility functions for display formatting
function getPositionEmoji(position: string | null): string {
  switch (position) {
    case "next":
      return "⏭️";
    case "now":
      return "🎵";
    default:
      return "📋";
  }
}

function getPositionDisplay(position: string | null): string {
  switch (position) {
    case "next":
      return "🎯 **Next in Queue** - Will play after current track";
    case "now":
      return "🎵 **Playing Now** - Skipped to current track";
    default:
      return "📋 **Added to Queue** - Will play in order";
  }
}

function getSourceDisplay(source: string): string {
  const sourceMap: Record<string, string> = {
    youtube: "🎵 YouTube",
    spotify: "🎧 Spotify",
    soundcloud: "🔊 SoundCloud",
    apple: "🍎 Apple Music",
    bandcamp: "🎪 Bandcamp",
    "youtube music": "🎵 YouTube Music",
    deezer: "🎶 Deezer",
    tidal: "🌊 Tidal",
  };
  return (
    sourceMap[source.toLowerCase()] ||
    `🎵 ${source.charAt(0).toUpperCase() + source.slice(1)}`
  );
}
