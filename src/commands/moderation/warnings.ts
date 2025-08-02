import {
  ApplicationCommandOptionType,
  blockQuote,
  bold,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
  type User,
} from "discord.js";
import type { Warning } from "@/generated/prisma/index.js";
import { prisma } from "@/index.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Utility function to format warning for display
function formatWarning(warning: Warning, index: number): string {
  const date = warning.timestamp.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    `**${index + 1}.** ${warning.reason}\n` +
    `└ ID: \`${warning.warn_id}\` | ${date} | <@${warning.moderator_id}>`
  );
}

// Utility function to create warnings embed
async function createWarningsEmbed(
  targetUser: User,
  warnings: Warning[],
  executor: GuildMember,
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
    .setColor(warnings.length > 0 ? Colors.Yellow : Colors.Green)
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp()
    .setFooter({
      text: `Requested by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

  if (warnings.length === 0) {
    embed.setDescription("This user has no warnings").addFields({
      name: "Clean Record",
      value: "✅ No infractions found",
      inline: false,
    });
  } else {
    embed
      .setDescription(
        `Found **${warnings.length}** warning${warnings.length !== 1 ? "s" : ""}`,
      )
      .addFields({
        name: "User Information",
        value: `${targetUser} (${targetUser.tag})\nID: \`${targetUser.id}\``,
        inline: false,
      });

    // Split warnings into chunks if there are too many
    const maxWarningsPerField = 5;
    const warningChunks: any[][] = [];

    for (let i = 0; i < warnings.length; i += maxWarningsPerField) {
      warningChunks.push(warnings.slice(i, i + maxWarningsPerField));
    }

    for (let chunkIndex = 0; chunkIndex < warningChunks.length; chunkIndex++) {
      const chunk = warningChunks[chunkIndex] || [];
      const startIndex = chunkIndex * maxWarningsPerField;

      const warningsList = chunk
        .map((warning, index) => formatWarning(warning, startIndex + index))
        .join("\n\n");

      const fieldName =
        warningChunks.length === 1
          ? "Warnings"
          : `Warnings (${startIndex + 1}-${startIndex + chunk.length})`;

      embed.addFields({
        name: fieldName,
        value: warningsList,
        inline: false,
      });
    }

    // Add summary field for multiple warnings
    if (warnings.length > 3) {
      const oldestWarning = warnings[0] as Warning;
      const newestWarning = warnings[warnings.length - 1] as Warning;

      embed.addFields({
        name: "Summary",
        value:
          `📊 Total: **${warnings.length}** warnings\n` +
          `📅 First: ${oldestWarning.timestamp.toLocaleDateString()}\n` +
          `🕐 Latest: ${newestWarning.timestamp.toLocaleDateString()}`,
        inline: true,
      });
    }

    // Add warning level indicator
    let warningLevel = "Low";
    let levelEmoji = "🟢";

    if (warnings.length >= 5) {
      warningLevel = "High";
      levelEmoji = "🔴";
    } else if (warnings.length >= 3) {
      warningLevel = "Medium";
      levelEmoji = "🟡";
    }

    embed.addFields({
      name: "Warning Level",
      value: `${levelEmoji} ${warningLevel}`,
      inline: true,
    });
  }

  return embed;
}

export default defineSlashCommand({
  data: {
    name: "warnings",
    description: "View warnings for a user",
    defaultMemberPermissions: "ModerateMembers",
    options: [
      {
        name: "user",
        description: "The user to check warnings for",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "show_details",
        description: "Show detailed information for each warning",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  category: "moderation",
  execute: async (_client, interaction) => {
    // Ensure command is used in a guild
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({
        content: blockQuote(
          bold("❌ This command can only be used in a server"),
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get options
    const targetUser = interaction.options.getUser("user", true);
    const showDetails = interaction.options.getBoolean("show_details") ?? false;

    // Get guild member object
    const executor = interaction.member as GuildMember;

    // Defer reply as this might take time for users with many warnings
    await interaction.deferReply();

    try {
      // Get user warnings
      const warnings = await prisma.warning.findMany({
        where: {
          user_id: targetUser.id,
          guild_id: interaction.guild.id,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      // Sort warnings by timestamp (newest first)
      warnings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Create embed
      const embed = await createWarningsEmbed(targetUser, warnings, executor);

      await interaction.editReply({
        embeds: [embed],
      });

      // Log the command usage
      Logger.info("Warnings command executed", {
        targetId: targetUser.id,
        targetTag: targetUser.tag,
        executorId: executor.id,
        executorTag: executor.user.tag,
        guildId: interaction.guild.id,
        warningCount: warnings.length,
        showDetails,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      Logger.error("Failed to fetch warnings", {
        targetId: targetUser.id,
        executorId: executor.id,
        guildId: interaction.guild.id,
        error: errorMessage,
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error Fetching Warnings")
        .setDescription("Failed to retrieve warnings for the specified user")
        .setColor(Colors.Red)
        .addFields({
          name: "Error",
          value: errorMessage,
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed],
      });
    }
  },
});
