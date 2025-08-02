import {
  ApplicationCommandOptionType,
  blockQuote,
  bold,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  TimestampStyles,
  time,
  type User,
} from "discord.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Mock data interfaces for enterprise features
interface UserModHistory {
  totalWarnings: number;
  activeBans: number;
  totalBans: number;
  totalKicks: number;
  totalTimeouts: number;
  lastIncident?: Date;
}

interface UserActivity {
  messagesLast7Days: number;
  messagesLast30Days: number;
  voiceTimeHours: number;
  lastSeen?: Date;
}

// Mock functions - in production these would query the database
function getUserModHistory(_userId: string, _guildId: string): UserModHistory {
  // This would query the ModerationLog table from Prisma schema
  return {
    totalWarnings: Math.floor(Math.random() * 5),
    activeBans: 0,
    totalBans: 0,
    totalKicks: Math.floor(Math.random() * 2),
    totalTimeouts: Math.floor(Math.random() * 3),
    lastIncident:
      Math.random() > 0.5
        ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        : undefined,
  };
}

function getUserActivity(_userId: string, _guildId: string): UserActivity {
  // This would query user activity from database
  return {
    messagesLast7Days: Math.floor(Math.random() * 100),
    messagesLast30Days: Math.floor(Math.random() * 500),
    voiceTimeHours: Math.floor(Math.random() * 50),
    lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  };
}

// Utility function to get user account age
function getAccountAge(user: User): string {
  const createdAt = user.createdAt;
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} days`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
  const years = Math.floor(diffDays / 365);
  const remainingMonths = Math.floor((diffDays % 365) / 30);
  return `${years} year${years !== 1 ? "s" : ""}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}` : ""}`;
}

// Utility function to get member server age
function getServerAge(member: GuildMember): string {
  const joinedAt = member.joinedAt;
  if (!joinedAt) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - joinedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} days`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
  const years = Math.floor(diffDays / 365);
  const remainingMonths = Math.floor((diffDays % 365) / 30);
  return `${years} year${years !== 1 ? "s" : ""}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}` : ""}`;
}

// Utility function to get risk level based on various factors
function getRiskLevel(
  user: User,
  member: GuildMember | null,
  modHistory: UserModHistory,
): {
  level: "Low" | "Medium" | "High" | "Critical";
  color: number;
  emoji: string;
  reasons: string[];
} {
  const reasons: string[] = [];
  let riskScore = 0;

  // Account age factor
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (accountAgeDays < 7) {
    riskScore += 3;
    reasons.push("Very new account (< 7 days)");
  } else if (accountAgeDays < 30) {
    riskScore += 2;
    reasons.push("New account (< 30 days)");
  }

  // Server age factor
  if (member?.joinedAt) {
    const serverAgeDays = Math.floor(
      (Date.now() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (serverAgeDays < 1) {
      riskScore += 2;
      reasons.push("Just joined server");
    }
  }

  // Moderation history
  if (modHistory.totalWarnings >= 3) {
    riskScore += 2;
    reasons.push(`${modHistory.totalWarnings} warnings`);
  }
  if (modHistory.totalTimeouts > 0) {
    riskScore += 1;
    reasons.push(`${modHistory.totalTimeouts} timeouts`);
  }
  if (modHistory.totalKicks > 0) {
    riskScore += 2;
    reasons.push(`${modHistory.totalKicks} kicks`);
  }

  // Avatar and username checks
  if (!user.avatar) {
    riskScore += 1;
    reasons.push("No custom avatar");
  }

  // Recent activity
  if (modHistory.lastIncident) {
    const daysSinceIncident = Math.floor(
      (Date.now() - modHistory.lastIncident.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceIncident < 7) {
      riskScore += 2;
      reasons.push("Recent moderation action");
    }
  }

  // Determine risk level
  if (riskScore >= 6) {
    return { level: "Critical", color: Colors.Red, emoji: "🔴", reasons };
  }
  if (riskScore >= 4) {
    return { level: "High", color: Colors.Orange, emoji: "🟠", reasons };
  }
  if (riskScore >= 2) {
    return { level: "Medium", color: Colors.Yellow, emoji: "🟡", reasons };
  }
  return { level: "Low", color: Colors.Green, emoji: "🟢", reasons };
}

// Utility function to format permissions
function formatPermissions(member: GuildMember): string {
  const keyPermissions = [
    { flag: PermissionFlagsBits.Administrator, name: "Administrator" },
    { flag: PermissionFlagsBits.ManageGuild, name: "Manage Server" },
    { flag: PermissionFlagsBits.ManageRoles, name: "Manage Roles" },
    { flag: PermissionFlagsBits.ManageChannels, name: "Manage Channels" },
    { flag: PermissionFlagsBits.BanMembers, name: "Ban Members" },
    { flag: PermissionFlagsBits.KickMembers, name: "Kick Members" },
    { flag: PermissionFlagsBits.ModerateMembers, name: "Moderate Members" },
    { flag: PermissionFlagsBits.ManageMessages, name: "Manage Messages" },
  ];

  const hasPermissions = keyPermissions
    .filter((perm) => member.permissions.has(perm.flag))
    .map((perm) => perm.name);

  if (hasPermissions.length === 0) {
    return "No key permissions";
  }

  if (hasPermissions.length > 3) {
    return `${hasPermissions.slice(0, 3).join(", ")} +${hasPermissions.length - 3} more`;
  }

  return hasPermissions.join(", ");
}

export default defineSlashCommand({
  data: {
    name: "userinfo",
    description: "Get comprehensive information about a user",
    defaultMemberPermissions: "ModerateMembers",
    options: [
      {
        name: "user",
        description: "The user to get information about",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "detailed",
        description: "Show detailed moderation history and risk analysis",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  category: "moderation",
  execute: async (client, interaction) => {
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
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    const detailed = interaction.options.getBoolean("detailed") ?? false;

    // Get guild member object
    const executor = interaction.member as GuildMember;

    // Defer reply as this might take time to gather all information
    await interaction.deferReply();

    try {
      // Fetch fresh user data
      const user = await client.users.fetch(targetUser.id, { force: true });
      const member = await interaction.guild.members
        .fetch(targetUser.id)
        .catch(() => null);

      // Get additional data
      const modHistory = getUserModHistory(user.id, interaction.guild.id);
      const activity = getUserActivity(user.id, interaction.guild.id);
      const riskAssessment = getRiskLevel(user, member, modHistory);

      // Create main embed
      const embed = new EmbedBuilder()
        .setTitle(`👤 User Information: ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .setColor(member ? Colors.Blue : Colors.Grey)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${executor.user.tag}`,
          iconURL: executor.user.displayAvatarURL(),
        });

      // Basic user information
      embed.addFields(
        {
          name: "🆔 Basic Info",
          value: [
            `**Username:** ${user.username}`,
            `**Display Name:** ${user.globalName || user.username}`,
            `**User ID:** \`${user.id}\``,
            `**Bot:** ${user.bot ? "Yes" : "No"}`,
            `**System:** ${user.system ? "Yes" : "No"}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "📅 Account Details",
          value: [
            `**Created:** ${time(user.createdAt, TimestampStyles.ShortDate)}`,
            `**Account Age:** ${getAccountAge(user)}`,
            `**Avatar:** ${user.avatar ? "Custom" : "Default"}`,
          ].join("\n"),
          inline: true,
        },
      );

      // Server-specific information
      if (member) {
        const roles = member.roles.cache
          .filter((role) => role.id !== interaction.guild?.id)
          .sort((a, b) => b.position - a.position)
          .map((role) => role.toString())
          .slice(0, 10);

        embed.addFields({
          name: "🏠 Server Information",
          value: [
            `**Joined:** ${member.joinedAt ? time(member.joinedAt, TimestampStyles.ShortDate) : "Unknown"}`,
            `**Server Age:** ${getServerAge(member)}`,
            `**Nickname:** ${member.nickname || "None"}`,
            `**Boost Since:** ${member.premiumSince ? time(member.premiumSince, TimestampStyles.ShortDate) : "Not boosting"}`,
          ].join("\n"),
          inline: false,
        });

        if (roles.length > 0) {
          embed.addFields({
            name: `🎭 Roles (${member.roles.cache.size - 1})`,
            value: roles.length > 0 ? roles.join(" ") : "No roles",
            inline: false,
          });
        }

        // Voice state if in voice
        if (member.voice.channel) {
          embed.addFields({
            name: "🔊 Voice Status",
            value: [
              `**Channel:** ${member.voice.channel}`,
              `**Muted:** ${member.voice.mute ? "Yes" : "No"}`,
              `**Deafened:** ${member.voice.deaf ? "Yes" : "No"}`,
            ].join("\n"),
            inline: true,
          });
        }

        // Key permissions
        embed.addFields({
          name: "🔐 Key Permissions",
          value: formatPermissions(member),
          inline: true,
        });
      } else {
        embed.addFields({
          name: "🏠 Server Information",
          value: "❌ User is not in this server",
          inline: false,
        });
      }

      // Detailed information for moderators
      if (detailed) {
        // Risk assessment
        embed.addFields({
          name: `${riskAssessment.emoji} Risk Assessment: ${riskAssessment.level}`,
          value:
            riskAssessment.reasons.length > 0
              ? riskAssessment.reasons.map((reason) => `• ${reason}`).join("\n")
              : "• No risk factors identified",
          inline: false,
        });

        // Moderation history
        const modHistoryValue = [
          `**Warnings:** ${modHistory.totalWarnings}`,
          `**Kicks:** ${modHistory.totalKicks}`,
          `**Timeouts:** ${modHistory.totalTimeouts}`,
          `**Bans:** ${modHistory.totalBans}`,
        ];

        if (modHistory.lastIncident) {
          modHistoryValue.push(
            `**Last Incident:** ${time(modHistory.lastIncident, TimestampStyles.RelativeTime)}`,
          );
        }

        embed.addFields({
          name: "⚖️ Moderation History",
          value: modHistoryValue.join("\n"),
          inline: true,
        });

        // Activity data
        embed.addFields({
          name: "📊 Activity Stats",
          value: [
            `**Messages (7d):** ${activity.messagesLast7Days}`,
            `**Messages (30d):** ${activity.messagesLast30Days}`,
            `**Voice Time:** ${activity.voiceTimeHours}h`,
            `**Last Seen:** ${activity.lastSeen ? time(activity.lastSeen, TimestampStyles.RelativeTime) : "Unknown"}`,
          ].join("\n"),
          inline: true,
        });

        // Set embed color based on risk level
        embed.setColor(riskAssessment.color);
      }

      // User badges/flags (if any)
      if (user.flags && user.flags.bitfield > 0) {
        const flags = user.flags.toArray();
        embed.addFields({
          name: "🏅 Badges",
          value: flags.join(", "),
          inline: false,
        });
      }

      await interaction.editReply({
        embeds: [embed],
      });

      // Log the command usage
      Logger.info("Userinfo command executed", {
        targetId: targetUser.id,
        targetTag: targetUser.tag,
        executorId: executor.id,
        executorTag: executor.user.tag,
        guildId: interaction.guild.id,
        detailed,
        targetInGuild: !!member,
        riskLevel: detailed ? riskAssessment.level : undefined,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      Logger.error("Failed to fetch user information", {
        targetId: targetUser.id,
        executorId: executor.id,
        guildId: interaction.guild.id,
        error: errorMessage,
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error Fetching User Information")
        .setDescription("Failed to retrieve information for the specified user")
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
