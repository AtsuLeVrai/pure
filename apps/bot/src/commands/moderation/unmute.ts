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

// Define the structure for unmute result
interface UnmuteResult {
  success: boolean;
  error?: string;
  member?: GuildMember;
  user?: User;
  wasNotMuted?: boolean;
}

// Utility function to validate unmute permissions
function validateUnmutePermissions(
  executor: GuildMember,
  target: GuildMember | null,
): { canUnmute: boolean; reason?: string } {
  // Check if target is in the guild
  if (!target) {
    return {
      canUnmute: false,
      reason: "User is not in this server",
    };
  }

  // Check if target is voice unmutable
  if (!target.manageable) {
    return {
      canUnmute: false,
      reason: "This member cannot be voice unmuted (higher role or bot owner)",
    };
  }

  // Check role hierarchy
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return {
      canUnmute: false,
      reason: "You cannot unmute someone with equal or higher role",
    };
  }

  return { canUnmute: true };
}

// Utility function to execute voice unmute
async function executeUnmute(
  targetMember: GuildMember,
  executor: GuildMember,
  reason: string,
): Promise<UnmuteResult> {
  try {
    // Check if user is actually voice muted
    if (!targetMember.voice.mute) {
      return {
        success: false,
        wasNotMuted: true,
        error: "User is not voice muted",
      };
    }

    // Remove voice mute
    await targetMember.voice.setMute(
      false,
      `${reason} | Voice unmuted by: ${executor.user.tag} (${executor.id})`,
    );

    Logger.info("Member voice unmuted successfully", {
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

    Logger.error("Failed to voice unmute member", {
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

// Utility function to send unmute notification to user
async function sendUnmuteNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  reason: string,
  executor: GuildMember,
): Promise<void> {
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("🔊 You have been voice unmuted")
      .setDescription(`You have been voice unmuted in **${guild.name}**`)
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
          name: "Status",
          value: "You can now speak in voice channels",
          inline: false,
        },
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Voice unmute notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
    });
  } catch (error) {
    Logger.debug("Could not send voice unmute notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default defineSlashCommand({
  data: {
    name: "unmute",
    description: "Remove voice mute from a member",
    defaultMemberPermissions: "MuteMembers",
    options: [
      {
        name: "user",
        description: "The user to voice unmute",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for removing the voice mute",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
      {
        name: "silent",
        description: "Don't send a DM notification to the unmuted user",
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
    const validation = validateUnmutePermissions(executor, targetMember);
    if (!validation.canUnmute) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as unmute operation might take time
    await interaction.deferReply();

    // Execute unmute (we know targetMember exists due to validation)
    const result = await executeUnmute(
      targetMember as GuildMember,
      executor,
      reason,
    );

    // Add moderation log if unmute was successful
    if (result.success && result.user) {
      await prisma.moderationLog.create({
        data: {
          log_id: v7(),
          type: ModerationType.UNMUTE,
          target_user_id: result.user.id,
          moderator_id: executor.id,
          guild_id: executor.guild.id,
          reason,
        },
      });
    }

    // Handle special case where user was not muted
    if (result.wasNotMuted) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ User Not Muted")
        .setDescription(`**${targetUser.tag}** is not voice muted`)
        .setColor(Colors.Yellow)
        .addFields(
          {
            name: "User",
            value: `${targetUser} (${targetUser.tag})`,
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
            name: "Status",
            value: "Not voice muted",
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

    // Send notification to user (if not silent and unmute was successful)
    if (!silent && result.success && result.user) {
      await sendUnmuteNotification(
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
      text: `Voice unmuted by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.user) {
      embed
        .setTitle("🔊 Member Voice Unmuted")
        .setDescription(`**${result.user.tag}** has been voice unmuted`)
        .setColor(Colors.Green)
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
        value: "User can now speak in voice channels",
        inline: false,
      });
    } else {
      embed
        .setTitle("❌ Voice Unmute Failed")
        .setDescription("Failed to voice unmute the specified user")
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
    Logger.info("Voice unmute command executed", {
      success: result.success,
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      reason,
      silent,
      wasNotMuted: result.wasNotMuted,
      wasInVoice: !!targetMember?.voice.channel,
    });
  },
});
