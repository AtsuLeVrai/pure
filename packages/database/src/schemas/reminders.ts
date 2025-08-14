import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const reminders = pgTable(
  "reminders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: varchar("user_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }),
    channelId: varchar("channel_id", { length: 20 }).notNull(),
    message: text("message").notNull(),
    remindAt: timestamp("remind_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completed: boolean("completed").default(false),
  },
  (table) => [
    index("reminders_user_idx").on(table.userId),
    index("reminders_remind_at_idx").on(table.remindAt),
    index("reminders_completed_idx").on(table.completed),
  ],
);

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
