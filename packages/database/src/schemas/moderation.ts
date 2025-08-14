import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { autoModerationActionEnum, autoModerationTriggerEnum } from "./enums";

export const warnings = pgTable(
  "warnings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: varchar("user_id", { length: 20 }).notNull(),
    moderatorId: varchar("moderator_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    reason: text("reason").notNull(),
    active: boolean("active").default(true),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("warnings_user_guild_idx").on(table.userId, table.guildId),
    index("warnings_guild_idx").on(table.guildId),
  ],
);

export type Warning = typeof warnings.$inferSelect;
export type NewWarning = typeof warnings.$inferInsert;

export const autoModerationRules = pgTable(
  "auto_moderation_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    enabled: boolean("enabled").default(true),
    trigger: autoModerationTriggerEnum("trigger").notNull(),
    action: autoModerationActionEnum("action").notNull(),
    threshold: integer("threshold"),
    duration: integer("duration"),
    channels: text("channels").array(),
    roles: text("roles").array(),
    keywords: text("keywords").array(),
    whitelist: text("whitelist").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("auto_moderation_rules_guild_idx").on(table.guildId),
    index("auto_moderation_rules_enabled_idx").on(table.enabled),
  ],
);

export type AutoModerationRule = typeof autoModerationRules.$inferSelect;
export type NewAutoModerationRule = typeof autoModerationRules.$inferInsert;
