import { ModerationType } from "@pure/database";
import {
  ApplicationCommandOptionType,
  blockQuote,
  bold,
  ChannelType,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  type TextChannel,
  type User,
} from "discord.js";
import { v7 } from "uuid";
import { prisma } from "@/index.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Define the structure for purge result
interface PurgeResult {
  success: boolean;
  error?: string;
  channel?: TextChannel;
  deletedCount?: number;
  requestedCount?: number;
  filters?: string[];
}

// Utility function to validate purge permissions
function validatePurgePermissions(
  executor: GuildMember,
  channel: TextChannel,
): { canPurge: boolean; reason?: string } {
  // Check if executor has manage messages permission
  if (!executor.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return {
      canPurge: false,
      reason: "You don't have permission to manage messages",
    };
  }

  // Check if bot has manage messages permission in the channel
  const botMember = channel.guild.members.me;
  if (
    !botMember?.permissionsIn(channel).has(PermissionFlagsBits.ManageMessages)
  ) {
    return {
      canPurge: false,
      reason: "Bot doesn't have permission to manage messages in this channel",
    };
  }

  return { canPurge: true };
}

// Utility function to execute message purge
async function executePurge(
  channel: TextChannel,
  executor: GuildMember,
  amount: number,
  targetUser?: User,
  containsText?: string,
  reason?: string,
): Promise<PurgeResult> {
  try {
    const filters: string[] = [];

    // Fetch messages (Discord allows bulk delete for messages up to 14 days old)
    const messages = await channel.messages.fetch({
      limit: Math.min(amount, 100),
    });

    // Filter messages based on criteria
    let messagesToDelete = Array.from(messages.values());

    // Filter by user if specified
    if (targetUser) {
      messagesToDelete = messagesToDelete.filter(
        (msg) => msg.author.id === targetUser.id,
      );
      filters.push(`User: ${targetUser.tag}`);
    }

    // Filter by text content if specified
    if (containsText) {
      messagesToDelete = messagesToDelete.filter((msg) =>
        msg.content.toLowerCase().includes(containsText.toLowerCase()),
      );
      filters.push(`Contains: "${containsText}"`);
    }

    // Filter out messages older than 14 days (Discord limitation)
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const bulkDeleteableMessages = messagesToDelete.filter(
      (msg) => msg.createdTimestamp > twoWeeksAgo,
    );
    const oldMessages = messagesToDelete.filter(
      (msg) => msg.createdTimestamp <= twoWeeksAgo,
    );

    let deletedCount = 0;

    // Bulk delete recent messages
    if (bulkDeleteableMessages.length > 0) {
      if (bulkDeleteableMessages.length === 1) {
        // Single message deletion
        await bulkDeleteableMessages[0]?.delete();
        deletedCount = 1;
      } else {
        // Bulk deletion
        const deleted = await channel.bulkDelete(bulkDeleteableMessages, true);
        deletedCount = deleted.size;
      }
    }

    // Delete old messages individually (slower, but necessary for messages > 14 days)
    for (const oldMessage of oldMessages.slice(0, 10)) {
      // Limit to 10 old messages to avoid rate limits
      try {
        await oldMessage.delete();
        deletedCount++;
        // Add small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        // Skip messages that can't be deleted
        Logger.debug("Could not delete old message", {
          messageId: oldMessage.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Add moderation log
    await prisma.moderationLog.create({
      data: {
        log_id: v7(),
        type: ModerationType.PURGE,
        target_user_id: targetUser?.id || executor.id, // Use executor if no specific target
        moderator_id: executor.id,
        guild_id: executor.guild.id,
        reason: reason || "Message purge",
        metadata: {
          deletedCount,
          requestedCount: amount,
          channelId: channel.id,
          channelName: channel.name,
          containsText,
          filters,
        },
      },
    });

    Logger.info("Messages purged successfully", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      deletedCount,
      requestedCount: amount,
      targetUserId: targetUser?.id,
      containsText,
      filters,
      reason,
    });

    return {
      success: true,
      channel,
      deletedCount,
      requestedCount: amount,
      filters,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to purge messages", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      requestedCount: amount,
      targetUserId: targetUser?.id,
      containsText,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

export default defineSlashCommand({
  data: {
    name: "purge",
    description: "Bulk delete messages in a channel",
    defaultMemberPermissions: "ManageMessages",
    options: [
      {
        name: "amount",
        description: "Number of messages to delete (1-100)",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        minValue: 1,
        maxValue: 100,
      },
      {
        name: "user",
        description: "Only delete messages from this user",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "contains",
        description: "Only delete messages containing this text",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 100,
      },
      {
        name: "channel",
        description:
          "The channel to purge messages from (defaults to current channel)",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        required: false,
      },
      {
        name: "reason",
        description: "Reason for purging messages",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
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
    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");
    const containsText = interaction.options.getString("contains");
    const targetChannel =
      (interaction.options.getChannel("channel") as TextChannel) ||
      interaction.channel;
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    // Ensure target channel is a text channel
    if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: blockQuote(
          bold("❌ This command can only be used on text channels"),
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get guild member object
    const executor = interaction.member as GuildMember;

    // Validate permissions
    const validation = validatePurgePermissions(executor, targetChannel);
    if (!validation.canPurge) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as purge operation might take time
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Create confirmation embed before purging
    const confirmEmbed = new EmbedBuilder()
      .setTitle("🗑️ Purging Messages...")
      .setDescription("Deleting messages, please wait...")
      .setColor(Colors.Orange)
      .addFields(
        {
          name: "Channel",
          value: `${targetChannel} (#${targetChannel.name})`,
          inline: true,
        },
        {
          name: "Amount",
          value: amount.toString(),
          inline: true,
        },
      )
      .setTimestamp();

    if (targetUser) {
      confirmEmbed.addFields({
        name: "Target User",
        value: `${targetUser} (${targetUser.tag})`,
        inline: true,
      });
    }

    if (containsText) {
      confirmEmbed.addFields({
        name: "Contains Text",
        value: `"${containsText}"`,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [confirmEmbed] });

    // Execute purge
    const result = await executePurge(
      targetChannel,
      executor,
      amount,
      targetUser || undefined,
      containsText || undefined,
      reason,
    );

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Purged by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.channel) {
      const deletedCount = result.deletedCount || 0;
      const requestedCount = result.requestedCount || amount;

      embed
        .setTitle("🗑️ Messages Purged")
        .setDescription(
          `Successfully deleted **${deletedCount}** message${deletedCount !== 1 ? "s" : ""} from ${targetChannel}`,
        )
        .setColor(deletedCount > 0 ? Colors.Green : Colors.Yellow)
        .addFields(
          {
            name: "Channel",
            value: `${targetChannel} (#${targetChannel.name})`,
            inline: true,
          },
          {
            name: "Channel ID",
            value: `\`${targetChannel.id}\``,
            inline: true,
          },
          {
            name: "Deleted / Requested",
            value: `${deletedCount} / ${requestedCount}`,
            inline: true,
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
        );

      // Add filters if any were applied
      if (result.filters && result.filters.length > 0) {
        embed.addFields({
          name: "Filters Applied",
          value: result.filters.join("\n"),
          inline: false,
        });
      }

      // Add warning if not all messages were deleted
      if (deletedCount < requestedCount) {
        embed.addFields({
          name: "⚠️ Note",
          value:
            "Some messages may not have been deleted due to Discord limitations (messages older than 14 days, permissions, or other restrictions)",
          inline: false,
        });
      }

      // Add information about purge effects
      if (deletedCount === 0) {
        embed.setDescription(
          "No messages were found matching the specified criteria",
        );
        embed.setColor(Colors.Yellow);
      }
    } else {
      embed
        .setTitle("❌ Purge Failed")
        .setDescription("Failed to purge messages from the specified channel")
        .setColor(Colors.Red)
        .addFields(
          {
            name: "Channel",
            value: `${targetChannel} (#${targetChannel.name})`,
            inline: true,
          },
          {
            name: "Requested Amount",
            value: amount.toString(),
            inline: true,
          },
          {
            name: "Error",
            value: result.error || "Unknown error occurred",
            inline: false,
          },
        );
    }

    await interaction.editReply({
      embeds: [embed],
    });

    // Log the command usage
    Logger.info("Purge command executed", {
      success: result.success,
      channelId: targetChannel.id,
      channelName: targetChannel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      deletedCount: result.deletedCount,
      requestedCount: amount,
      targetUserId: targetUser?.id,
      containsText,
      filters: result.filters,
      reason,
    });
  },
});
