import type { ClientEvents } from "discord.js";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { v7 } from "uuid";

export const EVENT_LOG_CATEGORIES = {
  messages: [
    "messageCreate",
    "messageDelete",
    "messageDeleteBulk",
    "messageUpdate",
    "messageReactionAdd",
    "messageReactionRemove",
  ],
  members: [
    "guildMemberAdd",
    "guildMemberRemove",
    "guildMemberUpdate",
    "userUpdate",
    "presenceUpdate",
  ],
  channels: [
    "channelCreate",
    "channelDelete",
    "channelUpdate",
    "channelPinsUpdate",
    "threadCreate",
    "threadDelete",
    "threadUpdate",
  ],
  roles: ["roleCreate", "roleDelete", "roleUpdate"],
  voice: ["voiceStateUpdate", "voiceChannelEffectSend"],
  moderation: [
    "guildBanAdd",
    "guildBanRemove",
    "autoModerationActionExecution",
    "autoModerationRuleCreate",
    "autoModerationRuleDelete",
    "autoModerationRuleUpdate",
  ],
  guild: [
    "guildUpdate",
    "guildIntegrationsUpdate",
    "guildAuditLogEntryCreate",
    "emojiCreate",
    "emojiDelete",
    "emojiUpdate",
    "stickerCreate",
    "stickerDelete",
    "stickerUpdate",
  ],
  invites: ["inviteCreate", "inviteDelete"],
  events: [
    "guildScheduledEventCreate",
    "guildScheduledEventUpdate",
    "guildScheduledEventDelete",
    "guildScheduledEventUserAdd",
    "guildScheduledEventUserRemove",
  ],
  webhooks: ["webhooksUpdate"],
} satisfies Record<string, (keyof ClientEvents)[]>;

export const ALL_TRACKABLE_EVENTS = Object.values(
  EVENT_LOG_CATEGORIES,
).flat() as (keyof ClientEvents)[];

export type EventLogCategory = keyof typeof EVENT_LOG_CATEGORIES;

export function getEventCategory(
  eventName: keyof ClientEvents,
): EventLogCategory | null {
  for (const [category, events] of Object.entries(EVENT_LOG_CATEGORIES)) {
    if (events.includes(eventName as never)) {
      return category as EventLogCategory;
    }
  }
  return null;
}

export const eventLogConfigs = sqliteTable(
  "event_log_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),

    guildId: text("guild_id").notNull(),
    category: text("category").notNull().$type<EventLogCategory>(),

    enabled: integer("enabled", { mode: "boolean" }).default(false),
    channelId: text("channel_id"),

    ignoredChannels: text("ignored_channels", { mode: "json" })
      .$type<string[]>()
      .default([]),
    ignoredRoles: text("ignored_roles", { mode: "json" })
      .$type<string[]>()
      .default([]),
    ignoredUsers: text("ignored_users", { mode: "json" })
      .$type<string[]>()
      .default([]),

    includeBots: integer("include_bots", { mode: "boolean" }).default(false),
    includeWebhooks: integer("include_webhooks", { mode: "boolean" }).default(
      false,
    ),
    includeAuditLog: integer("include_audit_log", { mode: "boolean" }).default(
      true,
    ),

    rateLimitEnabled: integer("rate_limit_enabled", {
      mode: "boolean",
    }).default(true),
    rateLimitPerMinute: integer("rate_limit_per_minute").default(10),
    rateLimitBurst: integer("rate_limit_burst").default(5),

    embedColor: integer("embed_color").default(0xff8a80),
    includeTimestamp: integer("include_timestamp", { mode: "boolean" }).default(
      true,
    ),
    includeUserAvatar: integer("include_user_avatar", {
      mode: "boolean",
    }).default(true),
    includeThumbnail: integer("include_thumbnail", { mode: "boolean" }).default(
      false,
    ),

    webhookUrl: text("webhook_url"),
    webhookEnabled: integer("webhook_enabled", { mode: "boolean" }).default(
      false,
    ),
    discordWebhookId: text("discord_webhook_id"),
    discordWebhookToken: text("discord_webhook_token"),

    enablePing: integer("enable_ping", { mode: "boolean" }).default(false),
    pingRoles: text("ping_roles", { mode: "json" })
      .$type<string[]>()
      .default([]),
    enableDM: integer("enable_dm", { mode: "boolean" }).default(false),
    dmUsers: text("dm_users", { mode: "json" }).$type<string[]>().default([]),

    conditions: text("conditions", { mode: "json" }).$type<{
      minAccountAge?: number;
      minServerTime?: number;
      requiredRoles?: string[];
      excludeRoles?: string[];
      channelTypes?: string[];
      messageLength?: { min?: number; max?: number };
    }>(),

    enableAnalytics: integer("enable_analytics", { mode: "boolean" }).default(
      false,
    ),
    retentionDays: integer("retention_days").default(30),

    lastModifiedBy: text("last_modified_by").notNull(),
    modificationReason: text("modification_reason"),
    version: integer("version").default(1),

    isActive: integer("is_active", { mode: "boolean" }).default(true),
    lastTriggered: integer("last_triggered", { mode: "timestamp" }),
    triggerCount: integer("trigger_count").default(0),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    unique("unique_guild_category").on(table.guildId, table.category),

    index("event_log_configs_guild_idx").on(table.guildId),
    index("event_log_configs_enabled_idx").on(table.enabled, table.isActive),
    index("event_log_configs_category_idx").on(table.category),
    index("event_log_configs_channel_idx").on(table.channelId),
    index("event_log_configs_rate_limit_idx").on(
      table.rateLimitEnabled,
      table.guildId,
    ),

    index("event_log_configs_active_enabled_idx").on(
      table.isActive,
      table.enabled,
      table.guildId,
    ),
  ],
);
