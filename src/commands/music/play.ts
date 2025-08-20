import {
  ApplicationCommandOptionType,
  bold,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  type VoiceChannel,
} from "discord.js";
import { v7 } from "uuid";
import { player } from "@/index.js";
import type { SlashSubCommand } from "@/types/index.js";
import { styledEmbed, styledMessage } from "@/utils/formatters.js";
import { Logger } from "@/utils/logger.js";

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
    ],
  },
  async execute(client, interaction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;

    const query = interaction.options.getString("query", true);
    const position = interaction.options.getString("position") || "queue";

    // ✅ Security and validation checks
    if (!interaction.guild) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("❌ Server Required")
        .setDescription("This command can only be used in a server.");

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!voiceChannel) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("🔊 Join a Voice Channel")
        .setDescription("You need to be in a voice channel to play music!")
        .addFields({
          name: "💡 How to Fix",
          value: "Join any voice channel and try again.",
          inline: false,
        });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check bot permissions
    const botMember = interaction.guild.members.me;
    if (!botMember) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("❌ Bot Not Found")
        .setDescription("Unable to verify bot permissions.");

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
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("❌ Missing Permissions")
        .setDescription(
          "I don't have the required permissions for your voice channel.",
        )
        .addFields({
          name: "🚫 Missing Permissions",
          value: missingPermissions
            .map((perm) => {
              const names: Record<string, string> = {
                [PermissionFlagsBits.Connect.toString()]: "Connect",
                [PermissionFlagsBits.Speak.toString()]: "Speak",
                [PermissionFlagsBits.UseVAD.toString()]: "Use Voice Activity",
              };
              return `• ${names[perm.toString()] || "Unknown"}`;
            })
            .join("\n"),
          inline: false,
        });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const { track } = await player.play(voiceChannel.id, query, {
        nodeOptions: {
          metadata: {
            channel: interaction.channel,
            requestedBy: interaction.user,
            interaction,
          },
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300000, // 5 minutes
          leaveOnEnd: true,
          leaveOnEndCooldown: 300000, // 5 minutes
          selfDeaf: true,
          bufferingTimeout: 3000, // 3 second buffering timeout
          connectionTimeout: 20000, // 20 second connection timeout
          pauseOnEmpty: false, // Don't auto-pause when queue is empty
        },
        requestedBy: interaction.user.id,
      });

      // Handle position after track is added
      const queue = player.nodes.get(interaction.guildId as string);
      if (queue && position === "now" && queue.tracks.size > 0) {
        // Skip current track to play this one now
        queue.node.skip();
      } else if (queue && position === "next" && queue.tracks.size > 0) {
        // Move the last added track to position 1 (next)
        const lastTrack = queue.tracks.at(-1);
        if (lastTrack) {
          queue.moveTrack(queue.tracks.size - 1, 0);
        }
      }

      // Send confirmation message (ephemeral)
      await interaction.followUp(
        styledMessage(
          `${getPositionEmoji(position)} ${bold(track.cleanTitle)} by ${bold(track.author)} ${position === "now" ? "is now playing" : "added to queue"}`,
        ),
      );
    } catch (error) {
      Logger.error("Music play command failed", {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : String(error),
        guildId: interaction.guildId,
        userId: interaction.user.id,
        queryType: query.startsWith("http") ? "url" : "search",
      });

      const errorId = v7();
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Playback Error")
        .setDescription(
          "Failed to play the requested track. Our team has been notified.",
        )
        .addFields(
          {
            name: "🔧 Quick Solutions",
            value:
              "• **Check URL** - Ensure the link is accessible\n" +
              "• **Try different search** - Use more specific keywords\n" +
              "• **Check permissions** - Ensure I can access your voice channel",
            inline: false,
          },
          {
            name: "📋 Error ID",
            value: `\`${errorId}\``,
            inline: true,
          },
        )
        .setFooter({
          text: "Pure Music System • Error Handler",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.followUp({
        embeds: [errorEmbed],
      });
    }
  },
};

// 🎨 Utility functions for enhanced display
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
