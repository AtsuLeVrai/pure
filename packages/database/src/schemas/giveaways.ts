import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { giveawayStatusEnum } from "./enums";

export const giveaways = pgTable(
  "giveaways",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 20 }).notNull(),
    messageId: varchar("message_id", { length: 20 }).notNull().unique(),
    hostId: varchar("host_id", { length: 20 }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    prize: text("prize").notNull(),
    requirements: jsonb("requirements"),
    status: giveawayStatusEnum("status").default("ACTIVE"),
    endsAt: timestamp("ends_at").notNull(),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("giveaways_guild_idx").on(table.guildId),
    index("giveaways_status_idx").on(table.status),
    index("giveaways_ends_at_idx").on(table.endsAt),
  ],
);

export type Giveaway = typeof giveaways.$inferSelect;
export type NewGiveaway = typeof giveaways.$inferInsert;

export const giveawayEntries = pgTable(
  "giveaway_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    giveawayId: text("giveaway_id").notNull(),
    userId: varchar("user_id", { length: 20 }).notNull(),
    entries: integer("entries").default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.giveawayId, table.userId),
    index("giveaway_entries_giveaway_idx").on(table.giveawayId),
  ],
);

export type GiveawayEntry = typeof giveawayEntries.$inferSelect;
export type NewGiveawayEntry = typeof giveawayEntries.$inferInsert;

export const giveawayWinners = pgTable(
  "giveaway_winners",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    giveawayId: text("giveaway_id").notNull(),
    userId: varchar("user_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    wonAt: timestamp("won_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.giveawayId, table.userId),
    index("giveaway_winners_user_idx").on(table.userId),
  ],
);

export type GiveawayWinner = typeof giveawayWinners.$inferSelect;
export type NewGiveawayWinner = typeof giveawayWinners.$inferInsert;
