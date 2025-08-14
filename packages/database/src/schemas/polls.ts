import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { pollTypeEnum } from "./enums";

export const polls = pgTable(
  "polls",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 20 }).notNull(),
    messageId: varchar("message_id", { length: 20 }).notNull().unique(),
    creatorId: varchar("creator_id", { length: 20 }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    type: pollTypeEnum("type").default("SINGLE_CHOICE"),
    endsAt: timestamp("ends_at"),
    ended: boolean("ended").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: varchar("deleted_by", { length: 20 }),
  },
  (table) => [
    index("polls_guild_idx").on(table.guildId),
    index("polls_ended_idx").on(table.ended),
  ],
);

export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;

export const pollOptions = pgTable(
  "poll_options",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    pollId: text("poll_id").notNull(),
    text: text("text").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("poll_options_poll_idx").on(table.pollId)],
);

export type PollOption = typeof pollOptions.$inferSelect;
export type NewPollOption = typeof pollOptions.$inferInsert;

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    pollId: text("poll_id").notNull(),
    optionId: text("option_id").notNull(),
    userId: varchar("user_id", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.pollId, table.userId),
    index("poll_votes_poll_idx").on(table.pollId),
  ],
);

export type PollVote = typeof pollVotes.$inferSelect;
export type NewPollVote = typeof pollVotes.$inferInsert;
