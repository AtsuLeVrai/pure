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
} from "discord.js";
import { v7 } from "uuid";
import { prisma } from "@/index.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Define the structure for slowmode result
interface SlowmodeResult {
  success: boolean;
  error?: string;
  channel?: TextChannel;
  previousDelay?: number;
  newDelay?: number;
}

// Utility function to format duration for display
function formatDuration(seconds: number): string {
  if (seconds === 0) return "Disabled";
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

// Utility function to validate slowmode permissions
function validateSlowmodePermissions(
  executor: GuildMember,
  channel: TextChannel,
): { canModify: boolean; reason?: string } {
  // Check if executor has manage channels permission
  if (!executor.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return {
      canModify: false,
      reason: "You don't have permission to manage channels",
    };
  }

  // Check if bot has manage channels permission in the channel
  const botMember = channel.guild.members.me;
  if (
    !botMember?.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels)
  ) {
    return {
      canModify: false,
      reason: "Bot doesn't have permission to manage this channel",
    };
  }

  return { canModify: true };
}

// Utility function to execute slowmode change
async function executeSlowmode(
  channel: TextChannel,
  executor: GuildMember,
  newDelay: number,
  reason: string,
): Promise<SlowmodeResult> {
  try {
    const previousDelay = channel.rateLimitPerUser;

    // Set the new slowmode delay
    await channel.setRateLimitPerUser(
      newDelay,
      `${reason} | Set by: ${executor.user.tag} (${executor.id})`,
    );

    // Add moderation log
    await prisma.moderationLog.create({
      data: {
        log_id: v7(),
        type: ModerationType.SLOWMODE,
        target_user_id: executor.id, // No specific target for slowmode
        moderator_id: executor.id,
        guild_id: executor.guild.id,
        reason,
        metadata: {
          channelId: channel.id,
          channelName: channel.name,
          previousDelay,
          newDelay,
        },
      },
    });

    Logger.info("Slowmode updated successfully", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      previousDelay,
      newDelay,
      reason,
    });

    return {
      success: true,
      channel,
      previousDelay,
      newDelay,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to update slowmode", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      newDelay,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

export default defineSlashCommand({
  data: {
    name: "slowmode",
    description: "Set or remove slowmode for a channel",
    defaultMemberPermissions: "ManageChannels",
    options: [
      {
        name: "duration",
        description: "Slowmode duration (0 to disable, max 6 hours)",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        minValue: 0,
        maxValue: 21600, // 6 hours in seconds
      },
      {
        name: "channel",
        description:
          "The channel to set slowmode for (defaults to current channel)",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        required: false,
      },
      {
        name: "reason",
        description: "Reason for setting slowmode",
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
    const duration = interaction.options.getInteger("duration", true);
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
    const validation = validateSlowmodePermissions(executor, targetChannel);
    if (!validation.canModify) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as slowmode operation might take time
    await interaction.deferReply();

    // Execute slowmode change
    const result = await executeSlowmode(
      targetChannel,
      executor,
      duration,
      reason,
    );

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Set by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.channel) {
      const isDisabling = duration === 0;
      const isEnabling = result.previousDelay === 0 && duration > 0;
      const isChanging = result.previousDelay! > 0 && duration > 0;

      let title = "⏱️ Slowmode Updated";
      let description = "";
      let color: number = Colors.Blue;

      if (isDisabling) {
        title = "🔓 Slowmode Disabled";
        description = `Slowmode has been disabled in ${targetChannel}`;
        color = Colors.Green;
      } else if (isEnabling) {
        title = "⏱️ Slowmode Enabled";
        description = `Slowmode has been enabled in ${targetChannel}`;
        color = Colors.Orange;
      } else if (isChanging) {
        title = "⏱️ Slowmode Updated";
        description = `Slowmode has been updated in ${targetChannel}`;
        color = Colors.Blue;
      }

      embed
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
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
            name: isDisabling ? "Previous Duration" : "New Duration",
            value: formatDuration(
              isDisabling ? result.previousDelay! : duration,
            ),
            inline: true,
          },
        );

      if (
        !isDisabling &&
        result.previousDelay !== undefined &&
        result.previousDelay > 0
      ) {
        embed.addFields({
          name: "Previous Duration",
          value: formatDuration(result.previousDelay),
          inline: true,
        });
      }

      embed.addFields(
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

      // Add information about slowmode effects
      if (!isDisabling) {
        embed.addFields({
          name: "Effect",
          value: `Members can send 1 message every ${formatDuration(duration)}`,
          inline: false,
        });
      }
    } else {
      embed
        .setTitle("❌ Slowmode Update Failed")
        .setDescription("Failed to update slowmode for the specified channel")
        .setColor(Colors.Red)
        .addFields(
          {
            name: "Channel",
            value: `${targetChannel} (#${targetChannel.name})`,
            inline: true,
          },
          {
            name: "Attempted Duration",
            value: formatDuration(duration),
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
    Logger.info("Slowmode command executed", {
      success: result.success,
      channelId: targetChannel.id,
      channelName: targetChannel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      previousDelay: result.previousDelay,
      newDelay: duration,
      reason,
    });
  },
});
