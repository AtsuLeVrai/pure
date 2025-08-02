import { ModerationType } from "@pure/database";
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
import { prisma } from "@/index.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Define the structure for kick result
interface KickResult {
  success: boolean;
  error?: string;
  member?: GuildMember;
  user?: User;
}

// Utility function to validate kick permissions and target
async function validateKickPermissions(
  executor: GuildMember,
  target: GuildMember | null,
): Promise<{ canKick: boolean; reason?: string }> {
  // Check if target is in the guild
  if (!target) {
    return {
      canKick: false,
      reason: "User is not in this server",
    };
  }

  // Check if target is kickable
  if (!target.kickable) {
    return {
      canKick: false,
      reason: "This member cannot be kicked (higher role or bot owner)",
    };
  }

  // Check role hierarchy
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return {
      canKick: false,
      reason: "You cannot kick someone with equal or higher role",
    };
  }

  // Check if target is guild owner
  if (target.id === target.guild.ownerId) {
    return {
      canKick: false,
      reason: "Cannot kick the guild owner",
    };
  }

  // Check if trying to kick self
  if (target.id === executor.id) {
    return {
      canKick: false,
      reason: "You cannot kick yourself",
    };
  }

  return { canKick: true };
}

// Utility function to execute kick
async function executeKick(
  targetMember: GuildMember,
  executor: GuildMember,
  reason: string,
): Promise<KickResult> {
  try {
    // Attempt to kick the member
    await targetMember.kick(
      `${reason} | Kicked by: ${executor.user.tag} (${executor.id})`,
    );

    Logger.info("Member kicked successfully", {
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      reason,
    });

    return { success: true, member: targetMember, user: targetMember.user };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to kick member", {
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

// Utility function to send kick notification to user
async function sendKickNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  reason: string,
  executor: GuildMember,
): Promise<void> {
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("👢 You have been kicked")
      .setDescription(`You have been kicked from **${guild.name}**`)
      .setColor(Colors.Orange)
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
          value: "You can rejoin using an invite link",
          inline: false,
        },
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Kick notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
    });
  } catch (error) {
    Logger.debug("Could not send kick notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default defineSlashCommand({
  data: {
    name: "kick",
    description: "Kick a member from the server",
    defaultMemberPermissions: "KickMembers",
    options: [
      {
        name: "user",
        description: "The user to kick",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the kick",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
      {
        name: "silent",
        description: "Don't send a DM notification to the kicked user",
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
    const silent = interaction.options.getBoolean("silent") ?? false;

    // Get guild member objects
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    // Validate permissions
    const validation = await validateKickPermissions(executor, targetMember);
    if (!validation.canKick) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as kick operation might take time
    await interaction.deferReply();

    // Send notification to user before kicking (if not silent)
    if (!silent && targetMember) {
      await sendKickNotification(
        targetUser,
        {
          name: interaction.guild.name,
          iconURL: () => interaction.guild?.iconURL() ?? null,
        },
        reason,
        executor,
      );
    }

    // Execute kick (we know targetMember exists due to validation)
    const result = await executeKick(
      targetMember as GuildMember,
      executor,
      reason,
    );

    // Add moderation log if kick was successful
    if (result.success && result.user) {
      await prisma.moderationLog.create({
        data: {
          log_id: v7(),
          type: ModerationType.KICK,
          target_user_id: result.user.id,
          moderator_id: executor.id,
          guild_id: executor.guild.id,
          reason,
        },
      });
    }

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Kicked by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.user) {
      embed
        .setTitle("👢 Member Kicked")
        .setDescription(
          `**${result.user.tag}** has been kicked from the server`,
        )
        .setColor(Colors.Orange)
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
            name: "Moderator",
            value: `${executor.user} (${executor.user.tag})`,
            inline: true,
          },
          {
            name: "Note",
            value: "User can rejoin with an invite",
            inline: true,
          },
        )
        .setThumbnail(result.user.displayAvatarURL());
    } else {
      embed
        .setTitle("❌ Kick Failed")
        .setDescription("Failed to kick the specified user")
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
    Logger.info("Kick command executed", {
      success: result.success,
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      reason,
      silent,
    });
  },
});
