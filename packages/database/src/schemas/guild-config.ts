import {
  boolean,
  index,
  integer,
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

    // Ticket System Settings - Enterprise Grade
    ticketsEnabled: boolean("tickets_enabled").default(false),

    // Default ticket settings
    ticketChannelCategoryId: varchar("ticket_channel_category_id", {
      length: 20,
    }),
    ticketLogChannelId: varchar("ticket_log_channel_id", { length: 20 }),
    ticketArchiveCategoryId: varchar("ticket_archive_category_id", {
      length: 20,
    }),

    // Auto-numbering
    ticketNumberPrefix: varchar("ticket_number_prefix", { length: 10 }).default(
      "TICK",
    ),
    nextTicketNumber: integer("next_ticket_number").default(1),

    // Default SLA settings
    defaultSlaResponseMinutes: integer("default_sla_response_minutes").default(
      60,
    ), // 1 hour
    defaultSlaResolutionMinutes: integer(
      "default_sla_resolution_minutes",
    ).default(1440), // 24 hours
    slaWarningEnabled: boolean("sla_warning_enabled").default(true),
    slaWarningChannelId: varchar("sla_warning_channel_id", { length: 20 }),

    // Auto-assignment
    enableLoadBalancing: boolean("enable_load_balancing").default(false),
    maxTicketsPerStaff: integer("max_tickets_per_staff").default(10),

    // Auto-close settings
    autoCloseEnabled: boolean("auto_close_enabled").default(false),
    autoCloseAfterHours: integer("auto_close_after_hours").default(72),
    autoCloseWarningHours: integer("auto_close_warning_hours").default(24),

    // User limits
    maxOpenTicketsPerUser: integer("max_open_tickets_per_user").default(3),
    ticketCooldownMinutes: integer("ticket_cooldown_minutes").default(5),

    // Transcript settings
    transcriptEnabled: boolean("transcript_enabled").default(true),
    transcriptChannelId: varchar("transcript_channel_id", { length: 20 }),
    transcriptFormat: varchar("transcript_format", { length: 20 }).default(
      "HTML",
    ), // HTML, TXT, JSON

    // Rating system
    ratingEnabled: boolean("rating_enabled").default(true),
    ratingRequired: boolean("rating_required").default(false),
    ratingChannelId: varchar("rating_channel_id", { length: 20 }),

    // Notifications
    notifyOnTicketCreate: boolean("notify_on_ticket_create").default(true),
    notifyOnTicketAssign: boolean("notify_on_ticket_assign").default(true),
    notifyOnTicketClose: boolean("notify_on_ticket_close").default(false),

    // Advanced features
    enableTicketThreads: boolean("enable_ticket_threads").default(false),
    enableTicketPrioritization: boolean("enable_ticket_prioritization").default(
      true,
    ),
    enableTicketEscalation: boolean("enable_ticket_escalation").default(true),
    enableCustomFields: boolean("enable_custom_fields").default(false),

    // Branding
    ticketWelcomeMessage: text("ticket_welcome_message"),
    ticketCloseMessage: text("ticket_close_message"),
    ticketEmbedColor: varchar("ticket_embed_color", { length: 7 }).default(
      "#5865F2",
    ),

    // Analytics & Reporting
    enableAnalytics: boolean("enable_analytics").default(true),
    dailyReportsEnabled: boolean("daily_reports_enabled").default(false),
    dailyReportsChannelId: varchar("daily_reports_channel_id", { length: 20 }),

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
