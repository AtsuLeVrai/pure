import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { suggestionStatusEnum } from "./enums";

export const suggestions = pgTable(
  "suggestions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 20 }).notNull(),
    messageId: varchar("message_id", { length: 20 }).notNull().unique(),
    userId: varchar("user_id", { length: 20 }).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    status: suggestionStatusEnum("status").default("PENDING"),
    upvotes: integer("upvotes").default(0),
    downvotes: integer("downvotes").default(0),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: varchar("deleted_by", { length: 20 }),
  },
  (table) => [
    index("suggestions_guild_idx").on(table.guildId),
    index("suggestions_status_idx").on(table.status),
  ],
);

export type Suggestion = typeof suggestions.$inferSelect;
export type NewSuggestion = typeof suggestions.$inferInsert;
