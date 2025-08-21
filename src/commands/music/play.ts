import {
  ApplicationCommandOptionType,
  blockQuote,
  bold,
  Colors,
  codeBlock,
  type GuildMember,
  inlineCode,
  italic,
  MessageFlags,
  PermissionFlagsBits,
  type VoiceChannel,
} from "discord.js";
import { player } from "@/index.js";
import type { SlashSubCommand } from "@/types/index.js";
import { styledEmbed } from "@/utils/formatters.js";

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
    const query = interaction.options.getString("query", true);
    const position = interaction.options.getString("position") || "queue";

    if (!interaction.guild) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("🚫 Server Required")
        .setDescription("This command can only be used within a server.")
        .addFields({
          name: "🔧 Solution",
          value: blockQuote(
            `Please use this command in a ${bold("server")} where the bot is present.`,
          ),
          inline: false,
        });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;
    if (!voiceChannel) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("🔊 Voice Channel Required")
        .setDescription(
          `You must be connected to a ${bold("voice channel")} to use music commands.`,
        )
        .addFields({
          name: "💡 How to fix this",
          value: blockQuote(
            `${inlineCode("1.")} Join any voice channel in this server\n${inlineCode("2.")} Run the command again`,
          ),
          inline: false,
        });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("⚠️ Bot Configuration Error")
        .setDescription("Unable to verify bot permissions in this server.");

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
      const permissionNames: Record<string, string> = {
        [PermissionFlagsBits.Connect.toString()]: "Connect to Voice Channel",
        [PermissionFlagsBits.Speak.toString()]: "Speak in Voice Channel",
        [PermissionFlagsBits.UseVAD.toString()]: "Use Voice Activity Detection",
      };

      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("🔒 Insufficient Permissions")
        .setDescription(
          `I'm missing essential permissions for ${bold(voiceChannel.name)}`,
        )
        .addFields(
          {
            name: "🚫 Missing Permissions",
            value: codeBlock(
              missingPermissions
                .map(
                  (perm) =>
                    `• ${permissionNames[perm.toString()] || "Unknown Permission"}`,
                )
                .join("\n"),
            ),
            inline: false,
          },
          {
            name: "🛠️ Administrator Action Required",
            value: blockQuote(
              `Please ${bold("grant the missing permissions")} and try again.`,
            ),
            inline: false,
          },
        );

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const loadingEmbed = styledEmbed(client)
      .setColor(Colors.Yellow)
      .setTitle("🔍 Searching...")
      .setDescription(`Looking for: ${inlineCode(query)}`)
      .addFields({
        name: "📍 Status",
        value: blockQuote(italic("Processing your request...")),
        inline: true,
      });

    await interaction.reply({
      embeds: [loadingEmbed],
      flags: MessageFlags.Ephemeral,
    });

    const { track } = await player.play(voiceChannel.id, query, {
      nodeOptions: {
        volume: 100,
        metadata: {
          channel: interaction.channel,
          requestedBy: interaction.user,
          interaction,
        },
      },
      requestedBy: interaction.user.id,
    });

    const queue = player.nodes.get(interaction.guildId as string);
    if (queue && position === "now" && queue.tracks.size > 0) {
      queue.node.skip();
    } else if (queue && position === "next" && queue.tracks.size > 0) {
      const lastTrack = queue.tracks.at(-1);
      if (lastTrack) {
        queue.moveTrack(queue.tracks.size - 1, 0);
      }
    }

    const successEmbed = styledEmbed(client)
      .setColor(Colors.Green)
      .setTitle(`${getPositionEmoji(position)} ${getPositionTitle(position)}`)
      .setDescription(
        `${bold(track.cleanTitle)}\n${italic(`by ${track.author}`)}`,
      )
      .addFields(
        {
          name: "⏱️ Duration",
          value: blockQuote(inlineCode(track.duration)),
          inline: true,
        },
        {
          name: "👤 Requested by",
          value: blockQuote(interaction.user.toString()),
          inline: true,
        },
        {
          name: "🎵 Source",
          value: blockQuote(inlineCode(track.source)),
          inline: true,
        },
      );

    if (track.thumbnail) {
      successEmbed.setThumbnail(track.thumbnail);
    }

    await interaction.editReply({
      embeds: [successEmbed],
    });
  },
};

function getPositionEmoji(position: string): string {
  switch (position) {
    case "next":
      return "⏭️";
    case "now":
      return "🎵";
    default:
      return "📋";
  }
}

function getPositionTitle(position: string): string {
  switch (position) {
    case "next":
      return "Added to Play Next";
    case "now":
      return "Now Playing";
    default:
      return "Added to Queue";
  }
}
