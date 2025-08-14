import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const starboardMessages = pgTable(
  "starboard_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    originalMessageId: varchar("original_message_id", { length: 20 })
      .notNull()
      .unique(),
    starboardMessageId: varchar("starboard_message_id", { length: 20 }),
    channelId: varchar("channel_id", { length: 20 }).notNull(),
    authorId: varchar("author_id", { length: 20 }).notNull(),
    starCount: integer("star_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("starboard_messages_guild_idx").on(table.guildId),
    index("starboard_messages_star_count_idx").on(table.starCount),
  ],
);

export type StarboardMessage = typeof starboardMessages.$inferSelect;
export type NewStarboardMessage = typeof starboardMessages.$inferInsert;
