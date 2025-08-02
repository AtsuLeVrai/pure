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

// Define the structure for unban result
interface UnbanResult {
  success: boolean;
  error?: string;
  user?: User;
  wasNotBanned?: boolean;
}

// Utility function to execute unban
async function executeUnban(
  targetUserId: string,
  executor: GuildMember,
  reason: string,
): Promise<UnbanResult> {
  try {
    // Check if user is actually banned
    const bans = await executor.guild.bans.fetch();
    const bannedUser = bans.get(targetUserId);

    if (!bannedUser) {
      return {
        success: false,
        wasNotBanned: true,
        error: "User is not banned from this server",
      };
    }

    // Attempt to unban the user
    await executor.guild.members.unban(
      targetUserId,
      `${reason} | Unbanned by: ${executor.user.tag} (${executor.id})`,
    );

    Logger.info("Member unbanned successfully", {
      targetId: targetUserId,
      targetTag: bannedUser.user?.tag || "Unknown",
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      reason,
    });

    return { success: true, user: bannedUser.user };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to unban user", {
      targetId: targetUserId,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

// Utility function to send unban notification to user
async function sendUnbanNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  reason: string,
  executor: GuildMember,
): Promise<void> {
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("🔓 You have been unbanned")
      .setDescription(`You have been unbanned from **${guild.name}**`)
      .setColor(Colors.Green)
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
        {
          name: "Note",
          value: "You can now rejoin the server using an invite",
          inline: false,
        },
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Unban notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
    });
  } catch (error) {
    Logger.debug("Could not send unban notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default defineSlashCommand({
  data: {
    name: "unban",
    description: "Unban a user from the server",
    defaultMemberPermissions: "BanMembers",
    options: [
      {
        name: "user_id",
        description: "The user ID to unban",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the unban",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
      {
        name: "silent",
        description: "Don't send a DM notification to the unbanned user",
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
    const targetUserId = interaction.options.getString("user_id", true);
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const silent = interaction.options.getBoolean("silent") ?? false;

    // Validate user ID format
    if (!/^\d{17,19}$/.test(targetUserId)) {
      await interaction.reply({
        content: blockQuote(
          bold(
            "❌ Invalid user ID format. Please provide a valid Discord user ID",
          ),
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get guild member object
    const executor = interaction.member as GuildMember;

    // Defer reply as unban operation might take time
    await interaction.deferReply();

    // Execute unban
    const result = await executeUnban(targetUserId, executor, reason);

    // Add moderation log if unban was successful
    if (result.success && result.user) {
      await prisma.moderationLog.create({
        data: {
          log_id: v7(),
          type: ModerationType.UNBAN,
          target_user_id: result.user.id,
          moderator_id: executor.id,
          guild_id: executor.guild.id,
          reason,
        },
      });
    }

    // Handle special case where user wasn't banned
    if (result.wasNotBanned) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ User Not Banned")
        .setDescription("The specified user is not banned from this server")
        .setColor(Colors.Yellow)
        .addFields(
          {
            name: "User ID",
            value: `\`${targetUserId}\``,
            inline: true,
          },
          {
            name: "Status",
            value: "Not banned",
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({
          text: `Checked by ${executor.user.tag}`,
          iconURL: executor.user.displayAvatarURL(),
        });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Send notification to user (if not silent and unban was successful)
    if (!silent && result.success && result.user) {
      await sendUnbanNotification(
        result.user,
        {
          name: interaction.guild.name,
          iconURL: () => interaction.guild?.iconURL() ?? null,
        },
        reason,
        executor,
      );
    }

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Unbanned by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.user) {
      // Try to fetch user info from Discord API
      let displayUser = result.user;
      try {
        displayUser = await client.users.fetch(targetUserId);
      } catch {
        // Keep the banned user info if fetch fails
      }

      embed
        .setTitle("🔓 User Unbanned")
        .setDescription(
          `**${displayUser.tag}** has been unbanned from the server`,
        )
        .setColor(Colors.Green)
        .addFields(
          {
            name: "User",
            value: `${displayUser} (${displayUser.tag})`,
            inline: true,
          },
          {
            name: "User ID",
            value: `\`${displayUser.id}\``,
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
          {
            name: "Note",
            value: "User can now rejoin with an invite",
            inline: true,
          },
        )
        .setThumbnail(displayUser.displayAvatarURL());
    } else {
      embed
        .setTitle("❌ Unban Failed")
        .setDescription("Failed to unban the specified user")
        .setColor(Colors.Red)
        .addFields(
          {
            name: "User ID",
            value: `\`${targetUserId}\``,
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
    Logger.info("Unban command executed", {
      success: result.success,
      targetId: targetUserId,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      reason,
      silent,
      wasNotBanned: result.wasNotBanned,
    });
  },
});
