import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 } from "uuid";

export const guildConfigs = sqliteTable(
  "guild_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: text("guild_id").notNull().unique(),
    language: text("language").notNull(),

    timezone: text("timezone").default("UTC"),

    eventLoggingEnabled: integer("event_logging_enabled", {
      mode: "boolean",
    }).default(false),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("guild_configs_guild_id_idx").on(table.guildId),
    index("guild_configs_event_logging_idx").on(table.eventLoggingEnabled),
  ],
);
