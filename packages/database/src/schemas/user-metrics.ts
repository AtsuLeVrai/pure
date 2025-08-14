import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const userMetrics = pgTable(
  "user_metrics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: varchar("user_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    // Level system
    xp: bigint("xp", { mode: "number" }).default(0),
    level: integer("level").default(0),
    messagesSent: integer("messages_sent").default(0),
    voiceTime: bigint("voice_time", { mode: "number" }).default(0),
    lastXpAt: timestamp("last_xp_at").defaultNow(),

    // Engagement metrics
    commandsUsed: integer("commands_used").default(0),
    reactionsGiven: integer("reactions_given").default(0),
    reactionsReceived: integer("reactions_received").default(0),

    // Casino stats
    casinoWins: integer("casino_wins").default(0),
    casinoLosses: integer("casino_losses").default(0),
    moneyWon: bigint("money_won", { mode: "number" }).default(0),
    moneyLost: bigint("money_lost", { mode: "number" }).default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.userId, table.guildId),
    index("user_metrics_guild_level_idx").on(table.guildId, table.level),
    index("user_metrics_guild_xp_idx").on(table.guildId, table.xp),
    index("user_metrics_user_idx").on(table.userId),
  ],
);

export type UserMetrics = typeof userMetrics.$inferSelect;
export type NewUserMetrics = typeof userMetrics.$inferInsert;

export const levelRoles = pgTable(
  "level_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    roleId: varchar("role_id", { length: 20 }).notNull(),
    level: integer("level").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.guildId, table.level),
    index("level_roles_guild_idx").on(table.guildId),
  ],
);

export type LevelRole = typeof levelRoles.$inferSelect;
export type NewLevelRole = typeof levelRoles.$inferInsert;
