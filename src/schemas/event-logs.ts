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

    embedColor: integer("embed_color").default(0xff8a80),

    webhookUrl: text("webhook_url"),
    webhookEnabled: integer("webhook_enabled", { mode: "boolean" }).default(
      false,
    ),
    discordWebhookId: text("discord_webhook_id"),
    discordWebhookToken: text("discord_webhook_token"),

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
    index("event_log_configs_category_idx").on(table.category),
    index("event_log_configs_channel_idx").on(table.channelId),

    index("event_log_configs_active_enabled_idx").on(
      table.enabled,
      table.guildId,
    ),
  ],
);
