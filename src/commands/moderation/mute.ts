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

// Define the structure for mute result
interface MuteResult {
  success: boolean;
  error?: string;
  member?: GuildMember;
  user?: User;
  wasAlreadyMuted?: boolean;
}

// Utility function to validate mute permissions
function validateMutePermissions(
  executor: GuildMember,
  target: GuildMember | null,
): { canMute: boolean; reason?: string } {
  // Check if target is in the guild
  if (!target) {
    return {
      canMute: false,
      reason: "User is not in this server",
    };
  }

  // Check if target is voice mutable
  if (!target.voice.mute && !target.manageable) {
    return {
      canMute: false,
      reason: "This member cannot be voice muted (higher role or bot owner)",
    };
  }

  // Check role hierarchy
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return {
      canMute: false,
      reason: "You cannot mute someone with equal or higher role",
    };
  }

  // Check if target is guild owner
  if (target.id === target.guild.ownerId) {
    return {
      canMute: false,
      reason: "Cannot mute the guild owner",
    };
  }

  // Check if trying to mute self
  if (target.id === executor.id) {
    return {
      canMute: false,
      reason: "You cannot mute yourself",
    };
  }

  return { canMute: true };
}

// Utility function to execute voice mute
async function executeMute(
  targetMember: GuildMember,
  executor: GuildMember,
  reason: string,
): Promise<MuteResult> {
  try {
    // Check if user is already voice muted
    if (targetMember.voice.mute) {
      return {
        success: false,
        wasAlreadyMuted: true,
        error: "User is already voice muted",
      };
    }

    // Check if user is in a voice channel
    if (!targetMember.voice.channel) {
      // User not in voice, but we can still apply server mute
      await targetMember.voice.setMute(
        true,
        `${reason} | Voice muted by: ${executor.user.tag} (${executor.id})`,
      );
    } else {
      // User is in voice, apply mute immediately
      await targetMember.voice.setMute(
        true,
        `${reason} | Voice muted by: ${executor.user.tag} (${executor.id})`,
      );
    }

    Logger.info("Member voice muted successfully", {
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      wasInVoice: !!targetMember.voice.channel,
      voiceChannelId: targetMember.voice.channelId,
      reason,
    });

    return {
      success: true,
      member: targetMember,
      user: targetMember.user,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to voice mute member", {
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

// Utility function to send mute notification to user
async function sendMuteNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  reason: string,
  executor: GuildMember,
): Promise<void> {
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("🔇 You have been voice muted")
      .setDescription(`You have been voice muted in **${guild.name}**`)
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
          name: "Effect",
          value: "You cannot speak in voice channels until unmuted",
          inline: false,
        },
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Voice mute notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
    });
  } catch (error) {
    Logger.debug("Could not send voice mute notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default defineSlashCommand({
  data: {
    name: "mute",
    description: "Voice mute a member (they cannot speak in voice channels)",
    defaultMemberPermissions: "MuteMembers",
    options: [
      {
        name: "user",
        description: "The user to voice mute",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the voice mute",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
      {
        name: "silent",
        description: "Don't send a DM notification to the muted user",
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
    const validation = validateMutePermissions(executor, targetMember);
    if (!validation.canMute) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as mute operation might take time
    await interaction.deferReply();

    // Send notification to user before muting (if not silent)
    if (!silent && targetMember) {
      await sendMuteNotification(
        targetUser,
        {
          name: interaction.guild.name,
          iconURL: () => interaction.guild?.iconURL() ?? null,
        },
        reason,
        executor,
      );
    }

    // Execute mute (we know targetMember exists due to validation)
    const result = await executeMute(targetMember!, executor, reason);

    // Add moderation log if mute was successful
    if (result.success && result.user) {
      await prisma.moderationLog.create({
        data: {
          log_id: v7(),
          type: ModerationType.MUTE,
          target_user_id: result.user.id,
          moderator_id: executor.id,
          guild_id: executor.guild.id,
          reason,
        },
      });
    }

    // Handle special case where user was already muted
    if (result.wasAlreadyMuted) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ User Already Muted")
        .setDescription(`**${targetUser.tag}** is already voice muted`)
        .setColor(Colors.Yellow)
        .addFields(
          {
            name: "User",
            value: `${targetUser} (${targetUser.tag})`,
            inline: true,
          },
          {
            name: "Status",
            value: "Already voice muted",
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

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Voice muted by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.user) {
      embed
        .setTitle("🔇 Member Voice Muted")
        .setDescription(`**${result.user.tag}** has been voice muted`)
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
            name: "Voice Status",
            value: targetMember?.voice.channel
              ? `In ${targetMember.voice.channel}`
              : "Not in voice",
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
        )
        .setThumbnail(result.user.displayAvatarURL());

      // Add effect information
      embed.addFields({
        name: "Effect",
        value: "User cannot speak in voice channels until unmuted",
        inline: false,
      });
    } else {
      embed
        .setTitle("❌ Voice Mute Failed")
        .setDescription("Failed to voice mute the specified user")
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
    Logger.info("Voice mute command executed", {
      success: result.success,
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      reason,
      silent,
      wasAlreadyMuted: result.wasAlreadyMuted,
      wasInVoice: !!targetMember?.voice.channel,
    });
  },
});
