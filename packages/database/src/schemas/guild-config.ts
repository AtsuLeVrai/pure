import {
  boolean,
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const guildConfigs = pgTable(
  "guild_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull().unique(),

    // Moderation settings
    moderationLogChannelId: varchar("moderation_log_channel_id", {
      length: 20,
    }),
    autoRoleId: varchar("auto_role_id", { length: 20 }),
    muteRoleId: varchar("mute_role_id", { length: 20 }),

    // Level system settings
    levelSystemEnabled: boolean("level_system_enabled").default(false),
    levelUpChannelId: varchar("level_up_channel_id", { length: 20 }),
    levelUpMessage: text("level_up_message"),
    xpRate: real("xp_rate").default(1.0),

    // Economy settings
    economyEnabled: boolean("economy_enabled").default(false),
    dailyReward: real("daily_reward").default(100),
    workRewardMin: real("work_reward_min").default(50),
    workRewardMax: real("work_reward_max").default(200),

    // Ticket system settings
    ticketCategoryId: varchar("ticket_category_id", { length: 20 }),
    ticketSupportRoleId: varchar("ticket_support_role_id", { length: 20 }),

    // Welcome/Leave settings
    welcomeEnabled: boolean("welcome_enabled").default(false),
    welcomeChannelId: varchar("welcome_channel_id", { length: 20 }),
    welcomeMessage: text("welcome_message"),
    leaveEnabled: boolean("leave_enabled").default(false),
    leaveChannelId: varchar("leave_channel_id", { length: 20 }),
    leaveMessage: text("leave_message"),

    // General settings
    language: text("language").default("en"),
    timezone: text("timezone").default("UTC"),
    voiceChannelTemplates: jsonb("voice_channel_templates"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("guild_configs_guild_id_idx").on(table.guildId)],
);

export type GuildConfig = typeof guildConfigs.$inferSelect;
export type NewGuildConfig = typeof guildConfigs.$inferInsert;
