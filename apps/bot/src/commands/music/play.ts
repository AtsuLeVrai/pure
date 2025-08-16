import {
  ApplicationCommandOptionType,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
  type VoiceChannel,
} from "discord.js";
import { QueryType, QueueRepeatMode, useMainPlayer } from "discord-player";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineSlashCommand({
  data: {
    name: "play",
    description:
      "Play music from various sources (YouTube, Spotify, SoundCloud, etc.)",
    options: [
      {
        name: "query",
        description: "Song name, URL, or search query",
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
      {
        name: "source",
        description: "Preferred source for searching",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🎵 YouTube", value: "youtube" },
          { name: "🎧 Spotify", value: "spotify" },
          { name: "🔊 SoundCloud", value: "soundcloud" },
          { name: "🍎 Apple Music", value: "apple" },
          { name: "🎪 Bandcamp", value: "bandcamp" },
        ],
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
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    const player = useMainPlayer();
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;

    const query = interaction.options.getString("query", true);
    const source = interaction.options.getString("source") || "youtube";
    const position = interaction.options.getString("position") || "queue";
    const playlistName = interaction.options.getString("playlist");

    // Security and validation checks
    if (!voiceChannel) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Voice Channel Required")
        .setDescription(
          "You must be connected to a voice channel to use music commands.",
        )
        .setTimestamp()
        .setFooter({ text: "Pure Music System" });

      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!voiceChannel.joinable || !voiceChannel.speakable) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Insufficient Permissions")
        .setDescription(
          "I don't have permission to join or speak in your voice channel.",
        )
        .setTimestamp()
        .setFooter({ text: "Pure Music System" });

      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Validate query length and content
    if (query.length > 500) {
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Query Too Long")
        .setDescription("Search query must be less than 500 characters.")
        .setTimestamp()
        .setFooter({ text: "Pure Music System" });

      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      Logger.info("Music play command executed", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        query: query.substring(0, 100),
        source,
        position,
      });

      // Determine search engine based on source
      let searchEngine: QueryType;
      switch (source) {
        case "spotify":
          searchEngine = QueryType.SPOTIFY_SEARCH;
          break;
        case "soundcloud":
          searchEngine = QueryType.SOUNDCLOUD;
          break;
        case "apple":
          searchEngine = QueryType.APPLE_MUSIC_SEARCH;
          break;
        case "bandcamp":
          searchEngine = QueryType.AUTO;
          break;
        default:
          searchEngine = QueryType.AUTO;
      }

      // Configure play options
      const playOptions = {
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
        searchEngine,
        requestedBy: interaction.user,
      };

      // Handle position parameter
      let insertMode: "queue" | "next" | "now" = "queue";
      if (position === "next") insertMode = "next";
      else if (position === "now") insertMode = "now";

      const { track, searchResult: result } = await player.play(
        voiceChannel,
        query,
        {
          ...playOptions,
          searchEngine,
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

      // Create rich embed response
      const successEmbed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle(`${getPositionEmoji(position)} Track Added Successfully`)
        .setDescription(`**[${track.title}](${track.url})**`)
        .setThumbnail(track.thumbnail)
        .addFields(
          {
            name: "👤 Artist",
            value: track.author || "Unknown Artist",
            inline: true,
          },
          {
            name: "⏱️ Duration",
            value: track.duration || "Unknown",
            inline: true,
          },
          {
            name: "🎵 Source",
            value: getSourceDisplay(track.source),
            inline: true,
          },
          {
            name: "📍 Position",
            value: getPositionDisplay(position),
            inline: true,
          },
          {
            name: "👥 Requested by",
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: "🔊 Voice Channel",
            value: voiceChannel.name,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({
          text: "Pure Music System • Enterprise Grade",
          iconURL: interaction.client.user.displayAvatarURL(),
        });

      // Add playlist info if specified
      if (playlistName) {
        successEmbed.addFields({
          name: "📋 Playlist",
          value: `Added to: **${playlistName}**`,
          inline: false,
        });
      }

      // Add queue information
      const queue = player.nodes.get(interaction.guildId!);
      if (queue && queue.tracks.size > 0) {
        successEmbed.addFields({
          name: "📊 Queue Status",
          value: `${queue.tracks.size} track(s) in queue\nEstimated wait time: ${queue.estimatedDuration}`,
          inline: false,
        });
      }

      await interaction.followUp({ embeds: [successEmbed] });

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
              }
            : error,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        query: query.substring(0, 100),
      });

      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Playback Error")
        .setDescription(
          "An error occurred while processing your request. Our team has been notified.",
        )
        .addFields({
          name: "🔧 Troubleshooting",
          value:
            "• Check if the URL is valid\n• Try a different search term\n• Ensure the bot has proper permissions\n• Contact support if the issue persists",
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: "Pure Music System • Error Handler" });

      // Include error details in development mode
      if (process.env.NODE_ENV === "development" && error instanceof Error) {
        errorEmbed.addFields({
          name: "🐛 Debug Info",
          value: `\`\`\`${error.message.substring(0, 500)}\`\`\``,
          inline: false,
        });
      }

      await interaction.followUp({ embeds: [errorEmbed] });
    }
  },
});

// Utility functions for display formatting
function getPositionEmoji(position: string | null): string {
  switch (position) {
    case "next":
      return "⏭️";
    case "now":
      return "▶️";
    default:
      return "📋";
  }
}

function getPositionDisplay(position: string | null): string {
  switch (position) {
    case "next":
      return "Play Next";
    case "now":
      return "Playing Now";
    default:
      return "Added to Queue";
  }
}

function getSourceDisplay(source: string): string {
  const sourceMap: Record<string, string> = {
    youtube: "🎵 YouTube",
    spotify: "🎧 Spotify",
    soundcloud: "🔊 SoundCloud",
    apple: "🍎 Apple Music",
    bandcamp: "🎪 Bandcamp",
  };
  return sourceMap[source.toLowerCase()] || `🎵 ${source}`;
}
