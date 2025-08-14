import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { reactionRoleTypeEnum } from "./enums";

export const reactionRoles = pgTable(
  "reaction_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 20 }).notNull(),
    messageId: varchar("message_id", { length: 20 }).notNull(),
    emoji: text("emoji").notNull(),
    roleId: varchar("role_id", { length: 20 }).notNull(),
    type: reactionRoleTypeEnum("type").default("NORMAL"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.messageId, table.emoji),
    index("reaction_roles_guild_idx").on(table.guildId),
  ],
);

export type ReactionRole = typeof reactionRoles.$inferSelect;
export type NewReactionRole = typeof reactionRoles.$inferInsert;
