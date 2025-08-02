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
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Mock moderation log storage - in production this would use Prisma/database
interface ModerationLog {
  id: string;
  type:
    | "ban"
    | "kick"
    | "timeout"
    | "warn"
    | "unban"
    | "purge"
    | "lock"
    | "unlock"
    | "slowmode";
  targetUserId: string;
  moderatorId: string;
  guildId: string;
  reason: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// In-memory store for demo purposes - replace with database in production
const modLogsStore = new Map<string, ModerationLog[]>();

// Mock function to add moderation log (this would be called from other commands)
function addModerationLog(log: Omit<ModerationLog, "id" | "timestamp">): void {
  const fullLog: ModerationLog = {
    ...log,
    id: `modlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };

  const key = log.guildId;
  const existing = modLogsStore.get(key) || [];
  existing.push(fullLog);
  modLogsStore.set(key, existing);
}

// Utility function to get moderation logs
function getModerationLogs(
  guildId: string,
  targetUserId?: string,
  moderatorId?: string,
  type?: string,
  limit = 50,
): ModerationLog[] {
  const allLogs = modLogsStore.get(guildId) || [];

  let filteredLogs = allLogs;

  if (targetUserId) {
    filteredLogs = filteredLogs.filter(
      (log) => log.targetUserId === targetUserId,
    );
  }

  if (moderatorId) {
    filteredLogs = filteredLogs.filter(
      (log) => log.moderatorId === moderatorId,
    );
  }

  if (type) {
    filteredLogs = filteredLogs.filter((log) => log.type === type);
  }

  // Sort by timestamp (newest first) and limit results
  return filteredLogs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
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

  const typeEmojis = {
    ban: "🔨",
    kick: "👢",
    timeout: "⏰",
    warn: "⚠️",
    unban: "🔓",
    purge: "🗑️",
    lock: "🔒",
    unlock: "🔓",
    slowmode: "⏱️",
  };

  const emoji = typeEmojis[log.type] || "📝";

  return (
    `**${index + 1}.** ${emoji} **${log.type.toUpperCase()}** - <@${log.targetUserId}>\n` +
    `└ **Reason:** ${log.reason}\n` +
    `└ **Mod:** <@${log.moderatorId}> | **Date:** ${date} | **ID:** \`${log.id}\``
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
      // Generate some sample logs for demonstration
      // In production, this would come from your database
      if (
        modLogsStore.get(interaction.guild.id)?.length === 0 ||
        !modLogsStore.has(interaction.guild.id)
      ) {
        // Add some sample logs
        const sampleLogs = [
          {
            type: "ban" as const,
            targetUserId: "123456789012345678",
            moderatorId: executor.id,
            guildId: interaction.guild.id,
            reason: "Spam and inappropriate behavior",
            metadata: { deleteMessageDays: 1 },
          },
          {
            type: "warn" as const,
            targetUserId: "987654321098765432",
            moderatorId: executor.id,
            guildId: interaction.guild.id,
            reason: "Inappropriate language in #general",
            metadata: { warnCount: 2 },
          },
          {
            type: "timeout" as const,
            targetUserId: "456789012345678901",
            moderatorId: executor.id,
            guildId: interaction.guild.id,
            reason: "Disruptive behavior during events",
            metadata: { duration: "1 hour" },
          },
        ];

        sampleLogs.forEach((log) => addModerationLog(log));
      }

      // Get moderation logs
      const logs = getModerationLogs(
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
