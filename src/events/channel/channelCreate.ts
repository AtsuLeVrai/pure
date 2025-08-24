import {
  AuditLogEvent,
  blockQuote,
  bold,
  ChannelType,
  Colors,
  inlineCode,
  PermissionFlagsBits,
  TimestampStyles,
  time,
  userMention,
} from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "@/index.js";
import { eventLogConfigs } from "@/schemas/event-logs.js";
import { styledEmbed } from "@/utils/formatters.js";
import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "channelCreate",
  execute: async (client, channel) => {
    if (!channel.guild) {
      return;
    }

    try {
      // Fetch event log configuration for channels category
      const logConfig = await db
        .select()
        .from(eventLogConfigs)
        .where(eq(eventLogConfigs.guildId, channel.guild.id))
        .limit(1)
        .then(
          (rows) =>
            rows.find(
              (row) => row.enabled === true && row.category === "channels",
            ) || null,
        );

      if (!logConfig || !logConfig.channelId) {
        return;
      }

      // Get the log channel
      const logChannel = await channel.guild.channels
        .fetch(logConfig.channelId)
        .catch(() => null);
      if (!logChannel || !logChannel.isTextBased()) {
        Logger.warn("Channel create log failed: Invalid log channel", {
          guildId: channel.guild.id,
          logChannelId: logConfig.channelId,
          createdChannelId: channel.id,
        });
        return;
      }

      // Check bot permissions in log channel
      const botMember = channel.guild.members.me;
      if (
        !botMember ||
        !logChannel
          .permissionsFor(botMember)
          ?.has([
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
          ])
      ) {
        Logger.warn("Channel create log failed: Missing bot permissions", {
          guildId: channel.guild.id,
          logChannelId: logConfig.channelId,
          createdChannelId: channel.id,
        });
        return;
      }

      // Get audit log information
      let auditLogEntry = null;
      let executor = null;

      try {
        const auditLogs = await channel.guild.fetchAuditLogs({
          type: AuditLogEvent.ChannelCreate,
          limit: 5,
        });

        auditLogEntry = auditLogs.entries.find(
          (entry) =>
            entry.target?.id === channel.id &&
            Date.now() - entry.createdTimestamp < 5000, // Within 5 seconds
        );

        if (auditLogEntry) {
          executor = auditLogEntry.executor;
        }
      } catch (error) {
        Logger.debug("Failed to fetch audit log for channel create", {
          guildId: channel.guild.id,
          channelId: channel.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Skip if executor is a bot and bots are not included
      if (executor?.bot && !logConfig.includeBots) {
        return;
      }

      // Skip if executor is in ignored users
      if (executor && logConfig.ignoredUsers?.includes(executor.id)) {
        return;
      }

      // Get channel type display name
      const getChannelTypeDisplay = (type: ChannelType): string => {
        switch (type) {
          case ChannelType.GuildText:
            return "Text Channel";
          case ChannelType.GuildVoice:
            return "Voice Channel";
          case ChannelType.GuildCategory:
            return "Category";
          case ChannelType.GuildAnnouncement:
            return "Announcement Channel";
          case ChannelType.AnnouncementThread:
            return "Announcement Thread";
          case ChannelType.PublicThread:
            return "Public Thread";
          case ChannelType.PrivateThread:
            return "Private Thread";
          case ChannelType.GuildStageVoice:
            return "Stage Channel";
          case ChannelType.GuildForum:
            return "Forum Channel";
          case ChannelType.GuildMedia:
            return "Media Channel";
          default:
            return "Unknown Channel";
        }
      };

      // Get channel permissions summary for categories
      const getPermissionsSummary = (): string => {
        if (channel.type !== ChannelType.GuildCategory) return "";

        const overwrites = channel.permissionOverwrites.cache;
        if (overwrites.size === 0) return "No permission overwrites";

        return `${overwrites.size} permission overwrite(s)`;
      };

      // Build the embed
      const embed = styledEmbed(client)
        .setColor(logConfig.embedColor || Colors.Green)
        .setTitle("📁 Channel Created")
        .setDescription(
          `A new ${getChannelTypeDisplay(channel.type).toLowerCase()} has been created.`,
        )
        .addFields({
          name: "📋 Channel Details",
          value: blockQuote(
            (channel.type !== ChannelType.GuildCategory
              ? `${inlineCode("Channel:")} ${channel.toString()}\n`
              : "") +
              `${inlineCode("Name:")} ${bold(channel.name)}\n` +
              `${inlineCode("Type:")} ${getChannelTypeDisplay(channel.type)}\n` +
              `${inlineCode("ID:")} ${inlineCode(channel.id)}\n` +
              (channel.parent
                ? `${inlineCode("Category:")} ${channel.parent.name}\n`
                : "") +
              (channel.type === ChannelType.GuildCategory
                ? `${inlineCode("Permissions:")} ${getPermissionsSummary()}\n`
                : "") +
              `${inlineCode("Position:")} ${channel.position}`,
          ),
          inline: false,
        })
        .setTimestamp(channel.createdAt);

      // Add executor information if available
      if (executor) {
        embed.addFields({
          name: "👤 Created By",
          value: blockQuote(
            `${inlineCode("User:")} ${userMention(executor.id)} (${executor.tag})\n` +
              `${inlineCode("ID:")} ${inlineCode(executor.id)}`,
          ),
          inline: true,
        });
      }

      // Add audit log reason if available
      if (auditLogEntry?.reason) {
        embed.addFields({
          name: "📝 Reason",
          value: blockQuote(auditLogEntry.reason.substring(0, 200)),
          inline: true,
        });
      }

      // Add timestamp
      embed.addFields({
        name: "⏰ Created At",
        value: blockQuote(
          `${time(Math.floor(channel.createdTimestamp / 1000), TimestampStyles.LongDateTime)}\n` +
            `${time(Math.floor(channel.createdTimestamp / 1000), TimestampStyles.RelativeTime)}`,
        ),
        inline: true,
      });

      // Set footer with channel mention
      embed.setFooter({
        text: channel.guild.name,
        iconURL: channel.guild.iconURL() || undefined,
      });

      // Add executor avatar as thumbnail if enabled
      if (executor?.displayAvatarURL()) {
        embed.setThumbnail(executor.displayAvatarURL({ size: 256 }));
      }

      // Send the log message
      await logChannel.send({
        embeds: [embed],
      });

      // Update trigger count and last triggered
      await db
        .update(eventLogConfigs)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(eventLogConfigs.id, logConfig.id));

      Logger.debug("Channel create event logged successfully", {
        guildId: channel.guild.id,
        channelId: channel.id,
        channelName: channel.name,
        channelType: channel.type,
        executorId: executor?.id,
        logChannelId: logConfig.channelId,
      });
    } catch (error) {
      Logger.error("Failed to log channel create event", {
        guildId: channel.guild?.id,
        channelId: channel.id,
        channelName: channel.name,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : String(error),
      });
    }
  },
});
