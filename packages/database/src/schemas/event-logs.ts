import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { eventLogCategoryEnum } from "./enums";

export const eventLogConfigs = pgTable(
  "event_log_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    category: eventLogCategoryEnum("category").notNull(),
    enabled: boolean("enabled").default(false),
    channelId: varchar("channel_id", { length: 20 }),
    webhookUrl: text("webhook_url"),
    color: varchar("color", { length: 7 }), // Hex color
    includeBots: boolean("include_bots").default(false),
    template: text("template"),
    createdById: varchar("created_by_id", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("event_log_configs_guild_idx").on(table.guildId),
    index("event_log_configs_enabled_idx").on(table.enabled),
    index("event_log_configs_guild_category_idx").on(
      table.guildId,
      table.category,
    ),
  ],
);

export type EventLogConfig = typeof eventLogConfigs.$inferSelect;
export type NewEventLogConfig = typeof eventLogConfigs.$inferInsert;
