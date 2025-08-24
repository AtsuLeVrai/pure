import {
  ApplicationCommandOptionType,
  blockQuote,
  bold,
  ChannelType,
  Collection,
  Colors,
  codeBlock,
  type GuildMember,
  inlineCode,
  MessageFlags,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
import { styledEmbed } from "@/utils/formatters.js";
import { Logger } from "@/utils/logger.js";
import { defineSlashCommand } from "@/utils/registry.js";

export default defineSlashCommand({
  data: {
    name: "clear",
    description:
      "Bulk delete messages from the current channel with moderation logging",
    defaultMemberPermissions: "ManageMessages",
    options: [
      {
        name: "amount",
        description:
          "Number of recent messages to delete (1-100, Discord API limit)",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        minValue: 1,
        maxValue: 100,
      },
      {
        name: "user",
        description:
          "Target specific user to delete only their messages (optional filter)",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "reason",
        description:
          "Moderation reason for audit log and transparency (max 512 chars)",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 512,
      },
    ],
  },
  category: "moderation",
  execute: async (client, interaction) => {
    // Validate guild context
    if (!interaction.guild) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("🚫 Server Required")
        .setDescription("This command can only be used within a server.")
        .addFields({
          name: "🔧 Solution",
          value: blockQuote(
            `Please use this command in a ${bold("server")} where the bot is present.`,
          ),
          inline: false,
        });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Validate channel type
    if (
      !interaction.channel ||
      interaction.channel.type !== ChannelType.GuildText
    ) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("📝 Text Channel Required")
        .setDescription("This command can only be used in text channels.")
        .addFields({
          name: "💡 Solution",
          value: blockQuote("Please use this command in a text channel."),
          inline: false,
        });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = interaction.channel as TextChannel;
    const member = interaction.member as GuildMember;
    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // Permission checks
    const botMember = interaction.guild.members.me;
    if (!botMember) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("⚠️ Bot Configuration Error")
        .setDescription("Unable to verify bot permissions in this server.");

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check user permissions
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("🔒 Insufficient Permissions")
        .setDescription("You don't have permission to manage messages.")
        .addFields({
          name: "📋 Required Permission",
          value: blockQuote(inlineCode("Manage Messages")),
          inline: false,
        });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });

      Logger.warn("Unauthorized clear command attempt", {
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guild.id,
        channelId: interaction.channel?.id,
        amount,
        targetUser: targetUser?.id,
      });
      return;
    }

    // Check bot permissions
    const requiredPermissions = [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ReadMessageHistory,
    ];

    const missingPermissions = requiredPermissions.filter(
      (permission) => !channel.permissionsFor(botMember)?.has(permission),
    );

    if (missingPermissions.length > 0) {
      const permissionNames: Record<string, string> = {
        [PermissionFlagsBits.ManageMessages.toString()]: "Manage Messages",
        [PermissionFlagsBits.ReadMessageHistory.toString()]:
          "Read Message History",
      };

      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Red)
        .setTitle("🔒 Insufficient Bot Permissions")
        .setDescription("I'm missing essential permissions for this channel.")
        .addFields(
          {
            name: "🚫 Missing Permissions",
            value: codeBlock(
              missingPermissions
                .map(
                  (perm) =>
                    `• ${permissionNames[perm.toString()] || "Unknown Permission"}`,
                )
                .join("\n"),
            ),
            inline: false,
          },
          {
            name: "🛠️ Administrator Action Required",
            value: blockQuote(
              `Please ${bold("grant the missing permissions")} and try again.`,
            ),
            inline: false,
          },
        );

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Role hierarchy check if targeting a specific user
    if (targetUser) {
      const targetMember =
        interaction.guild.members.cache.get(targetUser.id) ||
        (await interaction.guild.members.fetch(targetUser.id));
      if (targetMember) {
        // Prevent clearing messages from users with higher or equal roles
        if (
          targetMember.roles.highest.position >=
            member.roles.highest.position &&
          interaction.guild.ownerId !== interaction.user.id
        ) {
          const errorEmbed = styledEmbed(client)
            .setColor(Colors.Red)
            .setTitle("⚖️ Role Hierarchy Violation")
            .setDescription(
              "You cannot clear messages from users with equal or higher roles.",
            )
            .addFields({
              name: "🔐 Security Notice",
              value: blockQuote(
                "This restriction prevents abuse of moderation commands.",
              ),
              inline: false,
            });

          await interaction.reply({
            embeds: [errorEmbed],
            flags: MessageFlags.Ephemeral,
          });

          Logger.warn("Role hierarchy violation in clear command", {
            moderatorId: interaction.user.id,
            moderatorRole: member.roles.highest.name,
            targetId: targetUser.id,
            targetRole: targetMember.roles.highest.name,
            guildId: interaction.guild.id,
          });
          return;
        }
      }
    }

    // Send loading message
    const loadingEmbed = styledEmbed(client)
      .setColor(Colors.Yellow)
      .setTitle("🔄 Processing...")
      .setDescription("Clearing messages, please wait...")
      .addFields({
        name: "📊 Details",
        value: blockQuote(
          `${inlineCode("Amount:")} ${amount}\n` +
            `${inlineCode("Target:")} ${targetUser ? targetUser.tag : "All users"}\n` +
            `${inlineCode("Channel:")} ${channel.name}`,
        ),
        inline: false,
      });

    await interaction.reply({
      embeds: [loadingEmbed],
      flags: MessageFlags.Ephemeral,
    });

    // Fetch messages
    let messages = await channel.messages.fetch({
      limit: targetUser ? 100 : amount,
    });

    // Filter messages if targeting specific user
    if (targetUser) {
      messages = messages.filter((msg) => msg.author.id === targetUser.id);
      // Limit to requested amount after filtering
      messages = new Collection([...messages.entries()].slice(0, amount));
    }

    // Filter out messages older than 14 days (Discord limitation)
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const deletableMessages = messages.filter(
      (msg) => msg.createdTimestamp > twoWeeksAgo,
    );
    const undeletableCount = messages.size - deletableMessages.size;

    if (deletableMessages.size === 0) {
      const errorEmbed = styledEmbed(client)
        .setColor(Colors.Orange)
        .setTitle("⚠️ No Messages to Delete")
        .setDescription("No eligible messages found to delete.")
        .addFields({
          name: "📝 Possible Reasons",
          value: blockQuote(
            `• Messages are older than ${bold("14 days")}\n` +
              `• ${targetUser ? `User ${bold(targetUser.tag)} has no recent messages` : "No messages in range"}\n` +
              "• Messages may have already been deleted",
          ),
          inline: false,
        });

      await interaction.editReply({
        embeds: [errorEmbed],
      });
      return;
    }

    // Perform bulk delete
    const deletedMessages = await channel.bulkDelete(deletableMessages, true);
    const deletedCount = deletedMessages.size;

    // Log the moderation action
    Logger.warn("Messages cleared via command", {
      moderatorId: interaction.user.id,
      moderatorUsername: interaction.user.username,
      guildId: interaction.guild.id,
      channelId: channel.id,
      channelName: channel.name,
      deletedCount,
      requestedAmount: amount,
      targetUserId: targetUser?.id,
      targetUsername: targetUser?.username,
      reason: reason.substring(0, 200), // Truncate for logging
      undeletableCount,
    });

    // Success response
    const embed = styledEmbed(client)
      .setColor(Colors.Green)
      .setTitle("✅ Messages Cleared Successfully")
      .setDescription(
        `Successfully deleted ${bold(deletedCount.toString())} message${deletedCount !== 1 ? "s" : ""}.`,
      )
      .addFields(
        {
          name: "📊 Summary",
          value: blockQuote(
            `${inlineCode("Deleted:")} ${deletedCount}\n` +
              `${inlineCode("Channel:")} ${channel.name}\n` +
              `${inlineCode("Target:")} ${targetUser ? targetUser.toString() : "All users"}\n` +
              (undeletableCount > 0
                ? `${inlineCode("Skipped:")} ${undeletableCount} (too old)\n`
                : "") +
              `${inlineCode("Reason:")} ${reason}`,
          ),
          inline: false,
        },
        {
          name: "👤 Moderator",
          value: blockQuote(interaction.user.toString()),
          inline: true,
        },
        {
          name: "⏰ Action Time",
          value: blockQuote(`<t:${Math.floor(Date.now() / 1000)}:R>`),
          inline: true,
        },
      );

    if (undeletableCount > 0) {
      embed.addFields({
        name: "ℹ️ Note",
        value: blockQuote(
          `${undeletableCount} message${undeletableCount !== 1 ? "s were" : " was"} skipped because ${undeletableCount !== 1 ? "they are" : "it is"} older than 14 days (Discord limitation).`,
        ),
        inline: false,
      });
    }

    await interaction.editReply({
      embeds: [embed],
    });
  },
});
