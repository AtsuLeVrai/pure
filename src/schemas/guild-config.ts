import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

/**
 * Minimal guild configuration for Music + Event Logging focus
 * Enterprise-grade but streamlined for core functionality
 */
export const guildConfigs = pgTable(
  "guild_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull().unique(),
    language: text("language").default("en"),

    // Event Logging Settings
    eventLoggingEnabled: boolean("event_logging_enabled").default(false),
    defaultLogChannelId: varchar("default_log_channel_id", { length: 20 }),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("guild_configs_guild_id_idx").on(table.guildId),
    index("guild_configs_event_logging_idx").on(table.eventLoggingEnabled),
  ],
);

export type GuildConfig = typeof guildConfigs.$inferSelect;
export type NewGuildConfig = typeof guildConfigs.$inferInsert;
