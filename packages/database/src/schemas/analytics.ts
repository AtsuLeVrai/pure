import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const analytics = pgTable(
  "analytics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    date: date("date").notNull(),
    hour: integer("hour"),

    // Member metrics
    memberCount: integer("member_count").default(0),
    joins: integer("joins").default(0),
    leaves: integer("leaves").default(0),

    // Activity metrics
    messageCount: integer("message_count").default(0),
    voiceMinutes: integer("voice_minutes").default(0),
    commandsUsed: integer("commands_used").default(0),

    // Engagement metrics
    reactionsCount: integer("reactions_count").default(0),
    threadsCreated: integer("threads_created").default(0),
    ticketsCreated: integer("tickets_created").default(0),

    // Error/Warning counts
    errorCount: integer("error_count").default(0),
    warningCount: integer("warning_count").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.guildId, table.date, table.hour),
    index("analytics_guild_idx").on(table.guildId),
    index("analytics_date_idx").on(table.date),
  ],
);

export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;
