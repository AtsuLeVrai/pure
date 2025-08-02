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
import type { ModerationLog, Prisma } from "@/generated/prisma/index.js";
import { prisma } from "@/index.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Utility function to get moderation logs
async function getModerationLogs(
  guildId: string,
  targetUserId?: string,
  moderatorId?: string,
  type?: string,
  limit = 50,
): Promise<ModerationLog[]> {
  const where: Prisma.ModerationLogWhereInput = {
    guild_id: guildId,
  };

  if (targetUserId) {
    where.target_user_id = targetUserId;
  }

  if (moderatorId) {
    where.moderator_id = moderatorId;
  }

  if (type) {
    where.type = type;
  }

  return prisma.moderationLog.findMany({
    where: where,
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

// Utility function to format log entry
function formatLogEntry(log: ModerationLog, index: number): string {
  const date = log.timestamp.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const typeEmojis: Record<string, string> = {
    ban: "🔨",
    kick: "👢",
    timeout: "⏰",
    warn: "⚠️",
    unban: "🔓",
    purge: "🗑️",
    lock: "🔒",
    unlock: "🔓",
    slowmode: "⏱️",
    clear_warnings: "🗑️",
  };

  const emoji = typeEmojis[log.type] || "📝";

  return (
    `**${index + 1}.** ${emoji} **${log.type.toUpperCase()}** - <@${log.target_user_id}>\n` +
    `└ **Reason:** ${log.reason}\n` +
    `└ **Mod:** <@${log.moderator_id}> | **Date:** ${date} | **ID:** \`${log.log_id}\``
  );
}

// Utility function to create modlogs embed
async function createModLogsEmbed(
  logs: ModerationLog[],
  executor: GuildMember,
  filters: {
    targetUser?: User;
    moderator?: User;
    type?: string;
    guildName: string;
  },
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle("📋 Moderation Logs")
    .setColor(logs.length > 0 ? Colors.Blue : Colors.Grey)
    .setTimestamp()
    .setFooter({
      text: `Requested by ${executor.user.tag} | ${filters.guildName}`,
      iconURL: executor.user.displayAvatarURL(),
    });

  // Add filter information
  const filterLines: string[] = [];
  if (filters.targetUser) {
    filterLines.push(
      `**Target:** ${filters.targetUser} (${filters.targetUser.tag})`,
    );
  }
  if (filters.moderator) {
    filterLines.push(
      `**Moderator:** ${filters.moderator} (${filters.moderator.tag})`,
    );
  }
  if (filters.type) {
    filterLines.push(`**Type:** ${filters.type.toUpperCase()}`);
  }

  if (filterLines.length > 0) {
    embed.addFields({
      name: "🔍 Filters",
      value: filterLines.join("\n"),
      inline: false,
    });
  }

  if (logs.length === 0) {
    embed
      .setDescription(
        "No moderation logs found matching the specified criteria",
      )
      .setColor(Colors.Yellow);
    return embed;
  }

  embed.setDescription(
    `Found **${logs.length}** moderation log${logs.length !== 1 ? "s" : ""}`,
  );

  // Split logs into chunks if there are too many
  const maxLogsPerField = 5;
  const logChunks: ModerationLog[][] = [];

  for (let i = 0; i < logs.length; i += maxLogsPerField) {
    logChunks.push(logs.slice(i, i + maxLogsPerField));
  }

  for (let chunkIndex = 0; chunkIndex < logChunks.length; chunkIndex++) {
    const chunk = logChunks[chunkIndex] || [];
    const startIndex = chunkIndex * maxLogsPerField;

    const logsList = chunk
      .map((log, index) => formatLogEntry(log, startIndex + index))
      .join("\n\n");

    const fieldName =
      logChunks.length === 1
        ? "Recent Actions"
        : `Actions (${startIndex + 1}-${startIndex + chunk.length})`;

    embed.addFields({
      name: fieldName,
      value: logsList,
      inline: false,
    });
  }

  // Add summary if there are many logs
  if (logs.length > 10) {
    const typeCounts = logs.reduce(
      (acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ");

    embed.addFields({
      name: "📊 Summary",
      value: `**Total:** ${logs.length} actions\n**Most common:** ${topTypes}`,
      inline: false,
    });
  }

  return embed;
}

export default defineSlashCommand({
  data: {
    name: "modlogs",
    description: "View moderation logs for the server",
    defaultMemberPermissions: "ModerateMembers",
    options: [
      {
        name: "user",
        description: "Show logs for a specific user",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "moderator",
        description: "Show logs by a specific moderator",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "type",
        description: "Show logs of a specific type",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Ban", value: "ban" },
          { name: "Kick", value: "kick" },
          { name: "Timeout", value: "timeout" },
          { name: "Warn", value: "warn" },
          { name: "Unban", value: "unban" },
          { name: "Purge", value: "purge" },
          { name: "Lock", value: "lock" },
          { name: "Unlock", value: "unlock" },
          { name: "Slowmode", value: "slowmode" },
        ],
      },
      {
        name: "limit",
        description: "Number of logs to show (default: 10, max: 50)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        minValue: 1,
        maxValue: 50,
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
    const targetUser = interaction.options.getUser("user");
    const moderator = interaction.options.getUser("moderator");
    const type = interaction.options.getString("type");
    const limit = interaction.options.getInteger("limit") ?? 10;

    // Get guild member object
    const executor = interaction.member as GuildMember;

    // Defer reply as this might take time for large log sets
    await interaction.deferReply();

    try {
      // Get moderation logs
      const logs = await getModerationLogs(
        interaction.guild.id,
        targetUser?.id,
        moderator?.id,
        type || undefined,
        limit,
      );

      // Create embed
      const embed = await createModLogsEmbed(logs, executor, {
        targetUser: targetUser || undefined,
        moderator: moderator || undefined,
        type: type || undefined,
        guildName: interaction.guild.name,
      });

      await interaction.editReply({
        embeds: [embed],
      });

      // Log the command usage
      Logger.info("Modlogs command executed", {
        executorId: executor.id,
        executorTag: executor.user.tag,
        guildId: interaction.guild.id,
        targetUserId: targetUser?.id,
        moderatorId: moderator?.id,
        type,
        limit,
        foundLogs: logs.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      Logger.error("Failed to fetch moderation logs", {
        executorId: executor.id,
        guildId: interaction.guild.id,
        error: errorMessage,
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error Fetching Logs")
        .setDescription("Failed to retrieve moderation logs")
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
