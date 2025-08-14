import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const scheduledMessages = pgTable(
  "scheduled_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 20 }).notNull(),
    content: text("content").notNull(),
    sendAt: timestamp("send_at").notNull(),
    sent: boolean("sent").default(false),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("scheduled_messages_guild_idx").on(table.guildId),
    index("scheduled_messages_send_at_idx").on(table.sendAt),
    index("scheduled_messages_sent_idx").on(table.sent),
  ],
);

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type NewScheduledMessage = typeof scheduledMessages.$inferInsert;
