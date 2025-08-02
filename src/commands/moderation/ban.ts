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
import { v7 } from "uuid";
import { ModerationType } from "@/generated/prisma/index.js";
import { prisma } from "@/index.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Define the structure for ban result
interface BanResult {
  success: boolean;
  error?: string;
  member?: GuildMember;
  user?: User;
}

// Utility function to validate ban permissions and target
async function validateBanPermissions(
  executor: GuildMember,
  target: GuildMember | null,
): Promise<{ canBan: boolean; reason?: string }> {
  // Check if target is in the guild
  if (!target) {
    // User is not in guild, can still ban by ID
    return { canBan: true };
  }

  // Check if target is bannable
  if (!target.bannable) {
    return {
      canBan: false,
      reason: "This member cannot be banned (higher role or bot owner)",
    };
  }

  // Check role hierarchy
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return {
      canBan: false,
      reason: "You cannot ban someone with equal or higher role",
    };
  }

  // Check if target is guild owner
  if (target.id === target.guild.ownerId) {
    return {
      canBan: false,
      reason: "Cannot ban the guild owner",
    };
  }

  // Check if trying to ban self
  if (target.id === executor.id) {
    return {
      canBan: false,
      reason: "You cannot ban yourself",
    };
  }

  return { canBan: true };
}

// Utility function to execute ban
async function executeBan(
  targetUser: User,
  executor: GuildMember,
  reason: string,
  deleteMessageDays: number,
): Promise<BanResult> {
  try {
    // Attempt to ban the user
    await executor.guild.members.ban(targetUser, {
      reason: `${reason} | Banned by: ${executor.user.tag} (${executor.id})`,
      deleteMessageSeconds: deleteMessageDays * 24 * 3600, // Convert days to seconds
    });

    // Add moderation log
    await prisma.moderationLog.create({
      data: {
        log_id: v7(),
        type: ModerationType.BAN,
        target_user_id: targetUser.id,
        moderator_id: executor.id,
        guild_id: executor.guild.id,
        reason,
        metadata: { deleteMessageDays },
      },
    });

    Logger.info("Member banned successfully", {
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      reason,
      deleteMessageDays,
    });

    return { success: true, user: targetUser };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to ban member", {
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

// Utility function to send ban notification to user
async function sendBanNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  reason: string,
  executor: GuildMember,
): Promise<void> {
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("🔨 You have been banned")
      .setDescription(`You have been banned from **${guild.name}**`)
      .setColor(Colors.Red)
      .addFields(
        {
          name: "Reason",
          value: reason,
          inline: false,
        },
        {
          name: "Moderator",
          value: executor.user.tag,
          inline: true,
        },
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Ban notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
    });
  } catch (error) {
    Logger.debug("Could not send ban notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default defineSlashCommand({
  data: {
    name: "ban",
    description: "Ban a member from the server",
    defaultMemberPermissions: "BanMembers",
    options: [
      {
        name: "user",
        description: "The user to ban",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the ban",
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
      {
        name: "silent",
        description: "Don't send a DM notification to the banned user",
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
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const deleteMessageDays =
      interaction.options.getInteger("delete_messages") ?? 0;
    const silent = interaction.options.getBoolean("silent") ?? false;

    // Get guild member objects
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    // Validate permissions
    const validation = await validateBanPermissions(executor, targetMember);
    if (!validation.canBan) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as ban operation might take time
    await interaction.deferReply();

    // Send notification to user before banning (if not silent and user is in guild)
    if (!silent && targetMember) {
      await sendBanNotification(
        targetUser,
        {
          name: interaction.guild.name,
          iconURL: () => interaction.guild?.iconURL() ?? null,
        },
        reason,
        executor,
      );
    }

    // Execute ban
    const result = await executeBan(
      targetUser,
      executor,
      reason,
      deleteMessageDays,
    );

    // Add moderation log if ban was successful
    if (result.success && result.user) {
      await prisma.moderationLog.create({
        data: {
          log_id: v7(),
          type: ModerationType.BAN,
          target_user_id: result.user.id,
          moderator_id: executor.id,
          guild_id: executor.guild.id,
          reason,
          metadata: { deleteMessageDays },
        },
      });
    }

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Banned by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.user) {
      embed
        .setTitle("🔨 Member Banned")
        .setDescription(
          `**${result.user.tag}** has been banned from the server`,
        )
        .setColor(Colors.Red)
        .addFields(
          {
            name: "User",
            value: `${result.user} (${result.user.tag})`,
            inline: true,
          },
          {
            name: "User ID",
            value: `\`${result.user.id}\``,
            inline: true,
          },
          {
            name: "Reason",
            value: reason,
            inline: false,
          },
          {
            name: "Messages Deleted",
            value: `${deleteMessageDays} day${deleteMessageDays !== 1 ? "s" : ""}`,
            inline: true,
          },
          {
            name: "Moderator",
            value: `${executor.user} (${executor.user.tag})`,
            inline: true,
          },
        )
        .setThumbnail(result.user.displayAvatarURL());
    } else {
      embed
        .setTitle("❌ Ban Failed")
        .setDescription("Failed to ban the specified user")
        .setColor(Colors.Red)
        .addFields({
          name: "Error",
          value: result.error || "Unknown error occurred",
          inline: false,
        });
    }

    await interaction.editReply({
      embeds: [embed],
    });

    // Log the command usage
    Logger.info("Ban command executed", {
      success: result.success,
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      reason,
      deleteMessageDays,
      silent,
    });
  },
});
