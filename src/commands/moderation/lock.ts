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
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Define the structure for lock result
interface LockResult {
  success: boolean;
  error?: string;
  channel?: TextChannel;
  wasAlreadyLocked?: boolean;
  affectedRoles?: string[];
}

// Utility function to validate lock permissions
function validateLockPermissions(
  executor: GuildMember,
  channel: TextChannel,
): { canLock: boolean; reason?: string } {
  // Check if executor has manage channels permission
  if (!executor.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return {
      canLock: false,
      reason: "You don't have permission to manage channels",
    };
  }

  // Check if bot has manage channels permission in the channel
  const botMember = channel.guild.members.me;
  if (
    !botMember?.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels)
  ) {
    return {
      canLock: false,
      reason: "Bot doesn't have permission to manage this channel",
    };
  }

  return { canLock: true };
}

// Utility function to check if channel is already locked
function isChannelLocked(channel: TextChannel): boolean {
  const everyoneRole = channel.guild.roles.everyone;
  const everyoneOverwrites = channel.permissionOverwrites.cache.get(
    everyoneRole.id,
  );

  if (!everyoneOverwrites) return false;

  // Check if @everyone has SendMessages permission explicitly denied
  return everyoneOverwrites.deny.has(PermissionFlagsBits.SendMessages);
}

// Utility function to execute channel lock
async function executeLock(
  channel: TextChannel,
  executor: GuildMember,
  reason: string,
  lockRole?: string,
): Promise<LockResult> {
  try {
    // Check if channel is already locked
    if (isChannelLocked(channel)) {
      return {
        success: false,
        wasAlreadyLocked: true,
        error: "Channel is already locked",
      };
    }

    const affectedRoles: string[] = [];

    if (lockRole) {
      // Lock specific role
      const role =
        channel.guild.roles.cache.get(lockRole) ||
        channel.guild.roles.cache.find(
          (r) => r.name.toLowerCase() === lockRole.toLowerCase(),
        );

      if (!role) {
        return { success: false, error: "Specified role not found" };
      }

      await channel.permissionOverwrites.edit(
        role,
        {
          SendMessages: false,
          SendMessagesInThreads: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
        },
        {
          reason: `Channel locked for role ${role.name} | Locked by: ${executor.user.tag} (${executor.id}) | Reason: ${reason}`,
        },
      );

      affectedRoles.push(role.name);
    } else {
      // Lock for @everyone (default behavior)
      const everyoneRole = channel.guild.roles.everyone;

      await channel.permissionOverwrites.edit(
        everyoneRole,
        {
          SendMessages: false,
          SendMessagesInThreads: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
        },
        {
          reason: `Channel locked | Locked by: ${executor.user.tag} (${executor.id}) | Reason: ${reason}`,
        },
      );

      affectedRoles.push("@everyone");
    }

    Logger.info("Channel locked successfully", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      lockRole,
      affectedRoles,
      reason,
    });

    return {
      success: true,
      channel,
      affectedRoles,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to lock channel", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      lockRole,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

export default defineSlashCommand({
  data: {
    name: "lock",
    description: "Lock a channel to prevent members from sending messages",
    defaultMemberPermissions: "ManageChannels",
    options: [
      {
        name: "channel",
        description: "The channel to lock (defaults to current channel)",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        required: false,
      },
      {
        name: "role",
        description: "Specific role to lock (defaults to @everyone)",
        type: ApplicationCommandOptionType.Role,
        required: false,
      },
      {
        name: "reason",
        description: "Reason for locking the channel",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
      {
        name: "announce",
        description: "Send a message in the channel announcing the lock",
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
    const targetChannel =
      (interaction.options.getChannel("channel") as TextChannel) ||
      interaction.channel;
    const lockRole = interaction.options.getRole("role");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const announce = interaction.options.getBoolean("announce") ?? false;

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
    const validation = validateLockPermissions(executor, targetChannel);
    if (!validation.canLock) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as lock operation might take time
    await interaction.deferReply();

    // Execute lock
    const result = await executeLock(
      targetChannel,
      executor,
      reason,
      lockRole?.id,
    );

    // Handle special case where channel was already locked
    if (result.wasAlreadyLocked) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Channel Already Locked")
        .setDescription(`${targetChannel} is already locked`)
        .setColor(Colors.Yellow)
        .addFields(
          {
            name: "Channel",
            value: `${targetChannel} (#${targetChannel.name})`,
            inline: true,
          },
          {
            name: "Status",
            value: "Already locked",
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
      text: `Locked by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.channel) {
      embed
        .setTitle("🔒 Channel Locked")
        .setDescription(`${targetChannel} has been locked`)
        .setColor(Colors.Red)
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
            name: "Affected",
            value: result.affectedRoles?.join(", ") || "Unknown",
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

      // Add lock effects information
      embed.addFields({
        name: "Effect",
        value:
          "Members can no longer send messages, create threads, or react to messages",
        inline: false,
      });
    } else {
      embed
        .setTitle("❌ Lock Failed")
        .setDescription("Failed to lock the specified channel")
        .setColor(Colors.Red)
        .addFields(
          {
            name: "Channel",
            value: `${targetChannel} (#${targetChannel.name})`,
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

    // Send announcement in the locked channel if requested and lock was successful
    if (announce && result.success && result.channel) {
      try {
        const announceEmbed = new EmbedBuilder()
          .setTitle("🔒 Channel Locked")
          .setDescription("This channel has been locked by a moderator")
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
          .setTimestamp();

        await targetChannel.send({ embeds: [announceEmbed] });

        Logger.debug("Lock announcement sent to channel", {
          channelId: targetChannel.id,
          guildId: interaction.guild.id,
        });
      } catch (error) {
        Logger.debug("Could not send lock announcement to channel", {
          channelId: targetChannel.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Log the command usage
    Logger.info("Lock command executed", {
      success: result.success,
      channelId: targetChannel.id,
      channelName: targetChannel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      lockRole: lockRole?.id,
      affectedRoles: result.affectedRoles,
      reason,
      announce,
      wasAlreadyLocked: result.wasAlreadyLocked,
    });
  },
});
