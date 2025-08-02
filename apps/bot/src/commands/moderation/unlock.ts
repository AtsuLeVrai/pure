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

// Define the structure for unlock result
interface UnlockResult {
  success: boolean;
  error?: string;
  channel?: TextChannel;
  wasNotLocked?: boolean;
  restoredRoles?: string[];
}

// Utility function to validate unlock permissions
function validateUnlockPermissions(
  executor: GuildMember,
  channel: TextChannel,
): { canUnlock: boolean; reason?: string } {
  // Check if executor has manage channels permission
  if (!executor.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return {
      canUnlock: false,
      reason: "You don't have permission to manage channels",
    };
  }

  // Check if bot has manage channels permission in the channel
  const botMember = channel.guild.members.me;
  if (
    !botMember?.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels)
  ) {
    return {
      canUnlock: false,
      reason: "Bot doesn't have permission to manage this channel",
    };
  }

  return { canUnlock: true };
}

// Utility function to check if channel is locked
function isChannelLocked(channel: TextChannel): boolean {
  const everyoneRole = channel.guild.roles.everyone;
  const everyoneOverwrites = channel.permissionOverwrites.cache.get(
    everyoneRole.id,
  );

  if (!everyoneOverwrites) return false;

  // Check if @everyone has SendMessages permission explicitly denied
  return everyoneOverwrites.deny.has(PermissionFlagsBits.SendMessages);
}

// Utility function to execute channel unlock
async function executeUnlock(
  channel: TextChannel,
  executor: GuildMember,
  reason: string,
  unlockRole?: string,
): Promise<UnlockResult> {
  try {
    const restoredRoles: string[] = [];

    if (unlockRole) {
      // Unlock specific role
      const role =
        channel.guild.roles.cache.get(unlockRole) ||
        channel.guild.roles.cache.find(
          (r) => r.name.toLowerCase() === unlockRole.toLowerCase(),
        );

      if (!role) {
        return { success: false, error: "Specified role not found" };
      }

      // Check if this role has lock-related overrides
      const roleOverwrites = channel.permissionOverwrites.cache.get(role.id);
      if (
        !roleOverwrites ||
        !roleOverwrites.deny.has(PermissionFlagsBits.SendMessages)
      ) {
        return {
          success: false,
          wasNotLocked: true,
          error: `Role ${role.name} is not locked in this channel`,
        };
      }

      // Restore permissions by removing the explicit denies
      await channel.permissionOverwrites.edit(
        role,
        {
          SendMessages: null,
          SendMessagesInThreads: null,
          CreatePublicThreads: null,
          CreatePrivateThreads: null,
        },
        {
          reason: `Channel unlocked for role ${role.name} | Unlocked by: ${executor.user.tag} (${executor.id}) | Reason: ${reason}`,
        },
      );

      restoredRoles.push(role.name);
    } else {
      // Check if channel is locked for @everyone
      if (!isChannelLocked(channel)) {
        return {
          success: false,
          wasNotLocked: true,
          error: "Channel is not locked",
        };
      }

      // Unlock for @everyone (default behavior)
      const everyoneRole = channel.guild.roles.everyone;

      // Restore permissions by removing the explicit denies
      await channel.permissionOverwrites.edit(
        everyoneRole,
        {
          SendMessages: null,
          SendMessagesInThreads: null,
          CreatePublicThreads: null,
          CreatePrivateThreads: null,
        },
        {
          reason: `Channel unlocked | Unlocked by: ${executor.user.tag} (${executor.id}) | Reason: ${reason}`,
        },
      );

      restoredRoles.push("@everyone");
    }

    Logger.info("Channel unlocked successfully", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      unlockRole,
      restoredRoles,
      reason,
    });

    return {
      success: true,
      channel,
      restoredRoles,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to unlock channel", {
      channelId: channel.id,
      channelName: channel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      unlockRole,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

export default defineSlashCommand({
  data: {
    name: "unlock",
    description: "Unlock a channel to allow members to send messages",
    defaultMemberPermissions: "ManageChannels",
    options: [
      {
        name: "channel",
        description: "The channel to unlock (defaults to current channel)",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        required: false,
      },
      {
        name: "role",
        description: "Specific role to unlock (defaults to @everyone)",
        type: ApplicationCommandOptionType.Role,
        required: false,
      },
      {
        name: "reason",
        description: "Reason for unlocking the channel",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
      {
        name: "announce",
        description: "Send a message in the channel announcing the unlock",
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
    const unlockRole = interaction.options.getRole("role");
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
    const validation = validateUnlockPermissions(executor, targetChannel);
    if (!validation.canUnlock) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as unlock operation might take time
    await interaction.deferReply();

    // Execute unlock
    const result = await executeUnlock(
      targetChannel,
      executor,
      reason,
      unlockRole?.id,
    );

    // Handle special case where channel was not locked
    if (result.wasNotLocked) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Channel Not Locked")
        .setDescription(
          unlockRole
            ? `Role ${unlockRole.name} is not locked in ${targetChannel}`
            : `${targetChannel} is not locked`,
        )
        .setColor(Colors.Yellow)
        .addFields(
          {
            name: "Channel",
            value: `${targetChannel} (#${targetChannel.name})`,
            inline: true,
          },
          {
            name: "Status",
            value: "Not locked",
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({
          text: `Checked by ${executor.user.tag}`,
          iconURL: executor.user.displayAvatarURL(),
        });

      if (unlockRole) {
        embed.addFields({
          name: "Role",
          value: `${unlockRole} (${unlockRole.name})`,
          inline: true,
        });
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Unlocked by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.channel) {
      embed
        .setTitle("🔓 Channel Unlocked")
        .setDescription(`${targetChannel} has been unlocked`)
        .setColor(Colors.Green)
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
            name: "Restored Access",
            value: result.restoredRoles?.join(", ") || "Unknown",
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

      // Add unlock effects information
      embed.addFields({
        name: "Effect",
        value:
          "Members can now send messages, create threads, and react to messages",
        inline: false,
      });
    } else {
      embed
        .setTitle("❌ Unlock Failed")
        .setDescription("Failed to unlock the specified channel")
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

    // Send announcement in the unlocked channel if requested and unlock was successful
    if (announce && result.success && result.channel) {
      try {
        const announceEmbed = new EmbedBuilder()
          .setTitle("🔓 Channel Unlocked")
          .setDescription("This channel has been unlocked by a moderator")
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
          )
          .setTimestamp();

        await targetChannel.send({ embeds: [announceEmbed] });

        Logger.debug("Unlock announcement sent to channel", {
          channelId: targetChannel.id,
          guildId: interaction.guild.id,
        });
      } catch (error) {
        Logger.debug("Could not send unlock announcement to channel", {
          channelId: targetChannel.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Log the command usage
    Logger.info("Unlock command executed", {
      success: result.success,
      channelId: targetChannel.id,
      channelName: targetChannel.name,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      unlockRole: unlockRole?.id,
      restoredRoles: result.restoredRoles,
      reason,
      announce,
      wasNotLocked: result.wasNotLocked,
    });
  },
});
