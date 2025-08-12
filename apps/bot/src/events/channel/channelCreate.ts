import {
  AuditLogEvent,
  blockQuote,
  type CategoryChannel,
  ChannelType,
  Colors,
  EmbedBuilder,
  type ForumChannel,
  type NonThreadGuildBasedChannel,
  type StageChannel,
  type TextChannel,
  type VoiceChannel,
} from "discord.js";
import { prisma } from "@/index.js";
import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "channelCreate",
  async execute(_client, channel) {
    const startTime = Date.now();

    // Skip DM channels
    if (channel.isDMBased()) {
      return;
    }

    try {
      Logger.info("Channel created", {
        guildId: channel.guild.id,
        guildName: channel.guild.name,
        channelId: channel.id,
        channelName: channel.name,
        channelType: ChannelType[channel.type],
        parentId: channel.parentId,
      });

      // Get event log configuration for CHANNELS category
      const eventLogConfig = await prisma.eventLogConfig.findFirst({
        where: {
          guild_id: channel.guild.id,
          category: "CHANNELS",
          enabled: true,
        },
        select: {
          channel_id: true,
          webhook_url: true,
          color: true,
          include_bots: true,
          template: true,
        },
      });

      if (!eventLogConfig?.channel_id) {
        Logger.debug("No event log channel configured for CHANNELS category", {
          guildId: channel.guild.id,
        });
        return;
      }

      // Fetch audit log to determine who created the channel
      let creator: { id: string; tag: string; bot: boolean } | null = null;
      try {
        const auditLogs = await channel.guild.fetchAuditLogs({
          type: AuditLogEvent.ChannelCreate,
          limit: 5,
        });

        const relevantLog = auditLogs.entries.find(
          (entry) => entry.targetId === channel.id,
        );

        if (relevantLog?.executor) {
          creator = {
            id: relevantLog.executor.id,
            tag: relevantLog.executor.tag || "Unknown",
            bot: relevantLog.executor.bot,
          };
        }
      } catch (auditError) {
        Logger.warn("Failed to fetch audit logs for channel creation", {
          guildId: channel.guild.id,
          channelId: channel.id,
          error:
            auditError instanceof Error
              ? auditError.message
              : String(auditError),
        });
      }

      // Skip bot actions if configured
      if (creator?.bot && !eventLogConfig.include_bots) {
        Logger.debug("Skipping bot channel creation event", {
          guildId: channel.guild.id,
          channelId: channel.id,
          creatorBot: creator?.tag,
        });
        return;
      }

      // Get log channel
      const logChannel = channel.guild.channels.cache.get(
        eventLogConfig.channel_id,
      ) as TextChannel;

      if (!logChannel) {
        Logger.warn("Event log channel not found or inaccessible", {
          guildId: channel.guild.id,
          logChannelId: eventLogConfig.channel_id,
        });
        return;
      }

      // Create professional embed
      const embed = createChannelCreateEmbed(
        channel,
        creator,
        eventLogConfig.color,
      );

      // Send log message
      await logChannel.send({ embeds: [embed] });

      const executionTime = Date.now() - startTime;
      Logger.debug("ChannelCreate event processed successfully", {
        guildId: channel.guild.id,
        channelId: channel.id,
        logChannelId: eventLogConfig.channel_id,
        executionTime: `${executionTime}ms`,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      Logger.error("Failed to process channelCreate event", {
        guildId: channel.guild.id,
        channelId: channel.id,
        channelName: channel.name,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTime: `${executionTime}ms`,
      });
    }
  },
});

/**
 * Creates a premium enterprise-grade embed for channel creation events
 */
function createChannelCreateEmbed(
  channel: NonThreadGuildBasedChannel,
  creator: { id: string; tag: string; bot: boolean } | null,
  customColor?: string | null,
): EmbedBuilder {
  const channelIcon = getChannelIcon(channel.type);
  const createdTimestamp = Math.floor(channel.createdTimestamp! / 1000);
  const guildMemberCount = channel.guild.memberCount;
  const channelCount = channel.guild.channels.cache.size;

  const embed = new EmbedBuilder()
    .setTitle(`${channelIcon} New Channel Created`)
    .setDescription(
      `> ${getChannelStatusEmoji(channel)} **${channel.name}** has been successfully created in **${channel.guild.name}**\n` +
        `> ${channel.type === ChannelType.GuildCategory ? "📁" : "📍"} Located in: ${channel.parent ? `**${channel.parent.name}**` : "*No Category*"}`,
    )
    .setColor(
      customColor ? (customColor as any) : getChannelColor(channel.type),
    )
    .setThumbnail(channel.guild.iconURL({ size: 256 }) || null)
    .setTimestamp();

  // Channel Information Block
  embed.addFields({
    name: `${channelIcon} Channel Information`,
    value: blockQuote(
      `Name: ${channel.name}\nID: ${channel.id}\nType: ${ChannelType[channel.type]}\nPosition: #${channel.position + 1}\nCategory: ${channel.parent ? channel.parent.name : "None"}\nDirect Link: ${channel}`,
    ),
    inline: false,
  });

  // Creation Details Block
  const creationDetails = [
    `🕐 **Created:** <t:${createdTimestamp}:F>`,
    `⏱️ **Relative:** <t:${createdTimestamp}:R>`,
    `📅 **Date:** <t:${createdTimestamp}:D>`,
  ];

  if (creator) {
    const creatorEmoji = creator.bot ? "🤖" : "👤";
    creationDetails.push(
      `${creatorEmoji} **Creator:** ${creator.tag} (<@${creator.id}>)`,
    );
    creationDetails.push(`🆔 **Creator ID:** \`${creator.id}\``);
  }

  embed.addFields({
    name: "📋 Creation Details",
    value: creationDetails.join("\n"),
    inline: false,
  });

  // Channel-specific configuration
  const specificInfo = getChannelSpecificInfo(channel);
  if (specificInfo.length > 0) {
    const configBlock = [
      "\`\`\`ini",
      "[Channel Configuration]",
      ...specificInfo.map((info) =>
        info.replace(/\*\*/g, "").replace(/:/g, " ="),
      ),
      "\`\`\`",
    ].join("\n");

    embed.addFields({
      name: "⚙️ Channel Configuration",
      value: configBlock,
      inline: false,
    });
  }

  // Permissions Overview
  const permissions = getChannelPermissions(channel);
  if (permissions.everyone.length > 0 || permissions.special.length > 0) {
    const permissionLines = [];

    if (permissions.everyone.length > 0) {
      permissionLines.push("**@everyone Permissions:**");
      permissionLines.push(
        ...permissions.everyone.slice(0, 3).map((p) => `├─ ${p}`),
      );
      if (permissions.everyone.length > 3) {
        permissionLines.push(
          `└─ *+${permissions.everyone.length - 3} more...*`,
        );
      }
    }

    if (permissions.special.length > 0) {
      permissionLines.push("**Special Overrides:**");
      permissions.special.slice(0, 2).forEach((override, index) => {
        const isLast = index === Math.min(permissions.special.length, 2) - 1;
        const prefix = isLast ? "└─" : "├─";
        const typeEmoji = override.type === "role" ? "🎭" : "👤";
        permissionLines.push(
          `${prefix} ${typeEmoji} ${override.name} (${override.permissions.length} perms)`,
        );
      });
      if (permissions.special.length > 2) {
        permissionLines.push(
          `   *+${permissions.special.length - 2} more overrides...*`,
        );
      }
    }

    embed.addFields({
      name: "🔐 Permission Overview",
      value: permissionLines.join("\n") || "No special permissions configured",
      inline: false,
    });
  }

  // Server Statistics Sidebar
  embed.addFields(
    {
      name: "📊 Server Stats",
      value: [
        `👥 **Members:** ${guildMemberCount.toLocaleString()}`,
        `📺 **Channels:** ${channelCount}`,
        `🎭 **Roles:** ${channel.guild.roles.cache.size}`,
      ].join("\n"),
      inline: true,
    },
    {
      name: "📈 Channel Metrics",
      value: [
        `📁 **Categories:** ${channel.guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size}`,
        `📝 **Text:** ${channel.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size}`,
        `🔊 **Voice:** ${channel.guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size}`,
      ].join("\n"),
      inline: true,
    },
  );

  // Quote section for professional appearance
  if (
    channel.type === ChannelType.GuildText &&
    (channel as TextChannel).topic
  ) {
    embed.addFields({
      name: "📖 Channel Topic",
      value: `> ${(channel as TextChannel).topic}`,
      inline: false,
    });
  }

  // Premium footer with comprehensive info
  embed.setFooter({
    text: `${channel.guild.name} • Channel Management • Event ID: ${channel.id.slice(-6)} • ${new Date().toISOString().slice(0, 19)}Z`,
    iconURL: channel.guild.iconURL({ size: 64 }) || undefined,
  });

  return embed;
}

/**
 * Gets channel icon emoji based on type
 */
function getChannelIcon(type: ChannelType): string {
  const iconMap: Record<number, string> = {
    [ChannelType.GuildText]: "📝",
    [ChannelType.GuildVoice]: "🔊",
    [ChannelType.GuildCategory]: "📁",
    [ChannelType.GuildAnnouncement]: "📢",
    [ChannelType.GuildStageVoice]: "🎭",
    [ChannelType.GuildForum]: "💬",
    [ChannelType.GuildMedia]: "🖼️",
    [ChannelType.AnnouncementThread]: "🧵",
    [ChannelType.PublicThread]: "🧵",
    [ChannelType.PrivateThread]: "🔒",
  };
  return iconMap[type] || "❓";
}

/**
 * Gets channel status emoji based on type and properties
 */
function getChannelStatusEmoji(channel: NonThreadGuildBasedChannel): string {
  switch (channel.type) {
    case ChannelType.GuildText:
      return (channel as TextChannel).nsfw ? "🔞" : "✨";
    case ChannelType.GuildVoice:
      return "🎵";
    case ChannelType.GuildCategory:
      return "🗂️";
    case ChannelType.GuildAnnouncement:
      return "📣";
    case ChannelType.GuildStageVoice:
      return "🎪";
    case ChannelType.GuildForum:
      return "💭";
    default:
      return "🆕";
  }
}

/**
 * Gets appropriate color for channel type
 */
function getChannelColor(type: ChannelType): number {
  const colorMap: Record<number, number> = {
    [ChannelType.GuildText]: Colors.Blue,
    [ChannelType.GuildVoice]: Colors.Green,
    [ChannelType.GuildCategory]: Colors.Purple,
    [ChannelType.GuildAnnouncement]: Colors.Gold,
    [ChannelType.GuildStageVoice]: Colors.Red,
    [ChannelType.GuildForum]: Colors.Orange,
    [ChannelType.GuildMedia]: Colors.DarkPurple,
  };
  return colorMap[type] || Colors.Grey;
}

/**
 * Gets channel-specific configuration information
 */
function getChannelSpecificInfo(channel: NonThreadGuildBasedChannel): string[] {
  const info: string[] = [];

  switch (channel.type) {
    case ChannelType.GuildText: {
      const textChannel = channel as TextChannel;
      if (textChannel.topic) {
        info.push(
          `**Topic:** ${textChannel.topic.substring(0, 100)}${textChannel.topic.length > 100 ? "..." : ""}`,
        );
      }
      info.push(`**NSFW:** ${textChannel.nsfw ? "Yes" : "No"}`);
      if (textChannel.rateLimitPerUser > 0) {
        info.push(`**Slowmode:** ${textChannel.rateLimitPerUser}s`);
      }
      break;
    }
    case ChannelType.GuildVoice: {
      const voiceChannel = channel as VoiceChannel;
      info.push(`**Bitrate:** ${voiceChannel.bitrate / 1000}kbps`);
      info.push(`**User Limit:** ${voiceChannel.userLimit || "Unlimited"}`);
      if (voiceChannel.rtcRegion) {
        info.push(`**Region:** ${voiceChannel.rtcRegion}`);
      }
      break;
    }
    case ChannelType.GuildStageVoice: {
      const stageChannel = channel as StageChannel;
      if (stageChannel.topic) {
        info.push(
          `**Topic:** ${stageChannel.topic.substring(0, 100)}${stageChannel.topic.length > 100 ? "..." : ""}`,
        );
      }
      info.push(`**Bitrate:** ${stageChannel.bitrate / 1000}kbps`);
      info.push(`**User Limit:** ${stageChannel.userLimit || "Unlimited"}`);
      break;
    }
    case ChannelType.GuildForum: {
      const forumChannel = channel as ForumChannel;
      if (forumChannel.topic) {
        info.push(
          `**Guidelines:** ${forumChannel.topic.substring(0, 100)}${forumChannel.topic.length > 100 ? "..." : ""}`,
        );
      }
      info.push(`**NSFW:** ${forumChannel.nsfw ? "Yes" : "No"}`);
      if (forumChannel.rateLimitPerUser && forumChannel.rateLimitPerUser > 0) {
        info.push(`**Slowmode:** ${forumChannel.rateLimitPerUser}s`);
      }
      break;
    }
    case ChannelType.GuildCategory: {
      const categoryChannel = channel as CategoryChannel;
      const childCount = categoryChannel.children.cache.size;
      info.push(`**Child Channels:** ${childCount}`);
      break;
    }
  }

  return info;
}

/**
 * Gets simplified channel permissions for logging
 */
function getChannelPermissions(channel: NonThreadGuildBasedChannel): {
  everyone: string[];
  special: Array<{
    id: string;
    name: string;
    type: "role" | "user";
    permissions: string[];
  }>;
} {
  const permissions = {
    everyone: [] as string[],
    special: [] as Array<{
      id: string;
      name: string;
      type: "role" | "user";
      permissions: string[];
    }>,
  };

  // Get @everyone permissions
  const everyoneOverwrite = channel.permissionOverwrites.cache.get(
    channel.guild.roles.everyone.id,
  );
  if (everyoneOverwrite) {
    const allowed = everyoneOverwrite.allow.toArray();
    const denied = everyoneOverwrite.deny.toArray();

    permissions.everyone = [
      ...allowed.map((p) => `✅ ${p}`),
      ...denied.map((p) => `❌ ${p}`),
    ];
  }

  // Get special permission overwrites (limited to first 5 for log brevity)
  const otherOverwrites = channel.permissionOverwrites.cache
    .filter((overwrite) => overwrite.id !== channel.guild.roles.everyone.id)
    .first(5);

  for (const overwrite of otherOverwrites) {
    const target =
      channel.guild.roles.cache.get(overwrite.id) ||
      channel.guild.members.cache.get(overwrite.id);
    if (target) {
      const allowed = overwrite.allow.toArray();
      const denied = overwrite.deny.toArray();

      permissions.special.push({
        id: overwrite.id,
        name: "name" in target ? target.name : target.displayName,
        type: "color" in target ? "role" : "user",
        permissions: [
          ...allowed.map((p) => `✅ ${p}`),
          ...denied.map((p) => `❌ ${p}`),
        ],
      });
    }
  }

  return permissions;
}
