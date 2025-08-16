import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

/**
 * Event categories for comprehensive Discord logging
 * Enterprise-grade categorization for scalable log management
 */
export const eventLogCategory = pgEnum("event_log_category", [
  // Core Discord Events
  "channels", // Channel create/delete/update
  "members", // Member join/leave/update
  "messages", // Message delete/edit/bulk delete
  "moderation", // Bans/kicks/timeouts/warns
  "roles", // Role create/delete/update/assign
  "voice", // Voice channel join/leave/move

  // Advanced Events
  "guild_settings", // Guild settings changes
  "emojis_stickers", // Custom emoji/sticker changes
  "invites", // Invite create/delete/use
  "threads", // Thread create/delete/update
  "scheduled_events", // Discord events create/update
  "interactions", // Slash commands/buttons/selects

  // Security Events
  "security", // Permission changes, webhook actions
  "automod", // Auto-moderation triggers
]);

/**
 * Event log configuration per guild
 * Flexible configuration system for enterprise logging needs
 */
export const eventLogConfigs = pgTable(
  "event_log_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),

    guildId: varchar("guild_id", { length: 20 }).notNull(),
    category: eventLogCategory("category").notNull(),

    // Logging configuration
    enabled: boolean("enabled").default(false),
    channelId: varchar("channel_id", { length: 20 }),

    // Advanced options
    webhookUrl: text("webhook_url"), // For external logging systems

    // Filtering options
    includeBots: boolean("include_bots").default(false),
    includeWebhooks: boolean("include_webhooks").default(false),
    ignoreChannels: text("ignore_channels").array(), // Channel IDs to ignore
    ignoreRoles: text("ignore_roles").array(), // Role IDs to ignore

    // Formatting options
    embedColor: varchar("embed_color", { length: 7 }).default("#5865F2"),
    customTemplate: text("custom_template"), // Custom message template
    includeTimestamp: boolean("include_timestamp").default(true),
    includeUserAvatar: boolean("include_user_avatar").default(true),

    // Enterprise features
    enableAuditTrail: boolean("enable_audit_trail").default(false),
    enableAlerts: boolean("enable_alerts").default(false),
    alertThresholds: text("alert_thresholds"), // JSON config for alert rules

    // Metadata
    createdBy: varchar("created_by", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("event_log_configs_guild_idx").on(table.guildId),
    index("event_log_configs_enabled_idx").on(table.enabled),
    index("event_log_configs_category_idx").on(table.category),
    index("event_log_configs_guild_category_idx").on(
      table.guildId,
      table.category,
    ),
  ],
);

export type EventLogConfig = typeof eventLogConfigs.$inferSelect;
export type NewEventLogConfig = typeof eventLogConfigs.$inferInsert;
