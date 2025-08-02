import {
  ApplicationCommandOptionType,
  blockQuote,
  bold,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
} from "discord.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Define the structure for mass ban result
interface MassBanResult {
  success: boolean;
  totalRequested: number;
  successfulBans: number;
  failedBans: number;
  bannedUsers: { id: string; tag: string }[];
  failedUsers: { id: string; reason: string }[];
  error?: string;
}

// Utility function to validate user ID format
function isValidUserId(userId: string): boolean {
  return /^\d{17,19}$/.test(userId);
}

// Utility function to parse user list from text
function parseUserList(userListText: string): string[] {
  // Split by various delimiters and filter out empty strings
  const userIds = userListText
    .split(/[\n\r\s,;|]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return userIds;
}

// Utility function to execute mass ban with rate limiting
async function executeMassBan(
  userIds: string[],
  executor: GuildMember,
  reason: string,
  deleteMessageDays: number,
): Promise<MassBanResult> {
  const bannedUsers: { id: string; tag: string }[] = [];
  const failedUsers: { id: string; reason: string }[] = [];
  let successfulBans = 0;
  let failedBans = 0;

  Logger.info("Starting mass ban operation", {
    executorId: executor.id,
    executorTag: executor.user.tag,
    guildId: executor.guild.id,
    totalUsers: userIds.length,
    reason,
  });

  // Process users in batches to avoid rate limits
  const batchSize = 5;
  const delayBetweenBatches = 2000; // 2 seconds

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    // Process batch concurrently
    const batchPromises = batch.map(async (userId) => {
      try {
        // Validate user ID format
        if (!isValidUserId(userId)) {
          failedUsers.push({ id: userId, reason: "Invalid user ID format" });
          failedBans++;
          return;
        }

        // Check if user is already banned
        const existingBans = await executor.guild.bans.fetch();
        if (existingBans.has(userId)) {
          failedUsers.push({ id: userId, reason: "User is already banned" });
          failedBans++;
          return;
        }

        // Check if user is in guild and has higher permissions
        const targetMember = await executor.guild.members
          .fetch(userId)
          .catch(() => null);

        if (targetMember) {
          // Check if target can be banned
          if (!targetMember.bannable) {
            failedUsers.push({
              id: userId,
              reason: "User cannot be banned (higher role or bot owner)",
            });
            failedBans++;
            return;
          }

          // Check role hierarchy
          if (
            targetMember.roles.highest.position >=
            executor.roles.highest.position
          ) {
            failedUsers.push({
              id: userId,
              reason: "User has equal or higher role",
            });
            failedBans++;
            return;
          }

          // Check if target is guild owner
          if (targetMember.id === executor.guild.ownerId) {
            failedUsers.push({ id: userId, reason: "Cannot ban guild owner" });
            failedBans++;
            return;
          }
        }

        // Attempt to ban the user
        await executor.guild.members.ban(userId, {
          reason: `${reason} | Mass banned by: ${executor.user.tag} (${executor.id})`,
          deleteMessageSeconds: deleteMessageDays * 24 * 3600,
        });

        // Try to get user info for logging
        let userTag = userId;
        try {
          const user = await executor.client.users.fetch(userId);
          userTag = user.tag;
        } catch {
          // User not found, use ID as tag
        }

        bannedUsers.push({ id: userId, tag: userTag });
        successfulBans++;

        Logger.debug("User banned in mass operation", {
          userId,
          userTag,
          executorId: executor.id,
          guildId: executor.guild.id,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        failedUsers.push({ id: userId, reason: errorMessage });
        failedBans++;

        Logger.debug("Failed to ban user in mass operation", {
          userId,
          error: errorMessage,
          executorId: executor.id,
          guildId: executor.guild.id,
        });
      }
    });

    // Wait for batch to complete
    await Promise.all(batchPromises);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  Logger.info("Mass ban operation completed", {
    executorId: executor.id,
    executorTag: executor.user.tag,
    guildId: executor.guild.id,
    totalRequested: userIds.length,
    successfulBans,
    failedBans,
    reason,
  });

  return {
    success: true,
    totalRequested: userIds.length,
    successfulBans,
    failedBans,
    bannedUsers,
    failedUsers,
  };
}

export default defineSlashCommand({
  data: {
    name: "massban",
    description: "Ban multiple users at once (raid protection)",
    defaultMemberPermissions: "BanMembers",
    options: [
      {
        name: "user_ids",
        description:
          "List of user IDs to ban (separated by spaces, commas, or new lines)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the mass ban",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
      {
        name: "delete_messages",
        description: "Number of days of messages to delete (0-7)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        minValue: 0,
        maxValue: 7,
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
    const userListText = interaction.options.getString("user_ids", true);
    const reason =
      interaction.options.getString("reason") ??
      "Mass ban - No reason provided";
    const deleteMessageDays =
      interaction.options.getInteger("delete_messages") ?? 0;

    // Parse user list
    const userIds = parseUserList(userListText);

    // Validate input
    if (userIds.length === 0) {
      await interaction.reply({
        content: blockQuote(bold("❌ No valid user IDs provided")),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Limit mass ban to prevent abuse
    const maxMassBan = 50;
    if (userIds.length > maxMassBan) {
      await interaction.reply({
        content: blockQuote(
          bold(`❌ Mass ban limited to ${maxMassBan} users at once`),
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    // Get guild member object
    const executor = interaction.member as GuildMember;

    // Check if executor is trying to ban themselves
    if (uniqueUserIds.includes(executor.id)) {
      await interaction.reply({
        content: blockQuote(bold("❌ You cannot ban yourself")),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as mass ban operation will take significant time
    await interaction.deferReply();

    // Send initial confirmation
    const initialEmbed = new EmbedBuilder()
      .setTitle("🔨 Mass Ban Operation Started")
      .setDescription("Processing mass ban request...")
      .setColor(Colors.Orange)
      .addFields(
        {
          name: "Total Users",
          value: uniqueUserIds.length.toString(),
          inline: true,
        },
        {
          name: "Reason",
          value: reason,
          inline: false,
        },
        {
          name: "Status",
          value: "⏳ Processing...",
          inline: true,
        },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [initialEmbed] });

    // Execute mass ban
    const result = await executeMassBan(
      uniqueUserIds,
      executor,
      reason,
      deleteMessageDays,
    );

    // Create final result embed
    const resultEmbed = new EmbedBuilder()
      .setTitle("🔨 Mass Ban Operation Complete")
      .setColor(result.successfulBans > 0 ? Colors.Green : Colors.Red)
      .addFields(
        {
          name: "📊 Summary",
          value: `**Total Requested:** ${result.totalRequested}\n**Successful:** ${result.successfulBans}\n**Failed:** ${result.failedBans}`,
          inline: false,
        },
        {
          name: "Reason",
          value: reason,
          inline: false,
        },
        {
          name: "Moderator",
          value: `${executor.user} (${executor.user.tag})`,
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({
        text: `Mass banned by ${executor.user.tag}`,
        iconURL: executor.user.displayAvatarURL(),
      });

    // Add successful bans (limited to avoid embed size issues)
    if (result.bannedUsers.length > 0) {
      const maxDisplay = 10;
      const displayedBans = result.bannedUsers.slice(0, maxDisplay);
      const banList = displayedBans
        .map((user) => `• ${user.tag} (\`${user.id}\`)`)
        .join("\n");

      let banFieldValue = banList;
      if (result.bannedUsers.length > maxDisplay) {
        banFieldValue += `\n... and ${result.bannedUsers.length - maxDisplay} more`;
      }

      resultEmbed.addFields({
        name: "✅ Successfully Banned",
        value: banFieldValue,
        inline: false,
      });
    }

    // Add failed bans (limited to avoid embed size issues)
    if (result.failedUsers.length > 0) {
      const maxDisplay = 5;
      const displayedFails = result.failedUsers.slice(0, maxDisplay);
      const failList = displayedFails
        .map((user) => `• \`${user.id}\`: ${user.reason}`)
        .join("\n");

      let failFieldValue = failList;
      if (result.failedUsers.length > maxDisplay) {
        failFieldValue += `\n... and ${result.failedUsers.length - maxDisplay} more`;
      }

      resultEmbed.addFields({
        name: "❌ Failed to Ban",
        value: failFieldValue,
        inline: false,
      });
    }

    await interaction.editReply({
      embeds: [resultEmbed],
    });

    // Log the command usage
    Logger.info("Mass ban command executed", {
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      totalRequested: result.totalRequested,
      successfulBans: result.successfulBans,
      failedBans: result.failedBans,
      reason,
      deleteMessageDays,
    });
  },
});
