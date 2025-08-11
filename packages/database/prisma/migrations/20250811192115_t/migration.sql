-- CreateEnum
CREATE TYPE "public"."ModerationType" AS ENUM ('BAN', 'KICK', 'TIMEOUT', 'WARN', 'UNBAN', 'PURGE', 'LOCK', 'UNLOCK', 'SLOWMODE', 'MUTE', 'UNMUTE', 'CLEAR_WARNINGS', 'MASSBAN', 'NICKNAME', 'ANTIRAID');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."EconomyTransactionType" AS ENUM ('EARN', 'SPEND', 'TRANSFER', 'DAILY_REWARD', 'WEEKLY_REWARD', 'GAME_WIN', 'GAME_LOSS', 'SHOP_PURCHASE', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."GiveawayStatus" AS ENUM ('ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AutoModerationTrigger" AS ENUM ('SPAM', 'CAPS', 'LINKS', 'INVITES', 'PROFANITY', 'MENTIONS', 'REPEATED_TEXT', 'ZALGO', 'MASS_MENTIONS');

-- CreateEnum
CREATE TYPE "public"."AutoModerationAction" AS ENUM ('DELETE', 'WARN', 'TIMEOUT', 'KICK', 'BAN');

-- CreateEnum
CREATE TYPE "public"."ReactionRoleType" AS ENUM ('NORMAL', 'UNIQUE', 'VERIFY', 'TOGGLE');

-- CreateEnum
CREATE TYPE "public"."SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "public"."PollType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO');

-- CreateEnum
CREATE TYPE "public"."LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'MODERATION', 'COMMAND', 'MESSAGE', 'VOICE_JOIN', 'VOICE_LEAVE', 'GUILD_JOIN', 'GUILD_LEAVE');

-- CreateEnum
CREATE TYPE "public"."EventLogCategory" AS ENUM ('CHANNELS', 'MEMBERS', 'MESSAGES', 'MODERATION', 'ROLES', 'VOICE', 'GUILD_SETTINGS', 'EMOJIS_STICKERS', 'INVITES', 'THREADS', 'SCHEDULED_EVENTS', 'INTERACTIONS');

-- CreateTable
CREATE TABLE "public"."guild_configs" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "moderation_log_channel_id" VARCHAR(20),
    "auto_role_id" VARCHAR(20),
    "mute_role_id" VARCHAR(20),
    "level_system_enabled" BOOLEAN NOT NULL DEFAULT false,
    "level_up_channel_id" VARCHAR(20),
    "level_up_message" TEXT,
    "xp_rate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "economy_enabled" BOOLEAN NOT NULL DEFAULT false,
    "daily_reward" BIGINT NOT NULL DEFAULT 100,
    "work_reward_min" BIGINT NOT NULL DEFAULT 50,
    "work_reward_max" BIGINT NOT NULL DEFAULT 200,
    "ticket_category_id" VARCHAR(20),
    "ticket_support_role_id" VARCHAR(20),
    "welcome_enabled" BOOLEAN NOT NULL DEFAULT false,
    "welcome_channel_id" VARCHAR(20),
    "welcome_message" TEXT,
    "leave_enabled" BOOLEAN NOT NULL DEFAULT false,
    "leave_channel_id" VARCHAR(20),
    "leave_message" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "voice_channel_templates" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_metrics" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "xp" BIGINT NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "voice_time" BIGINT NOT NULL DEFAULT 0,
    "last_xp_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commands_used" INTEGER NOT NULL DEFAULT 0,
    "reactions_given" INTEGER NOT NULL DEFAULT 0,
    "reactions_received" INTEGER NOT NULL DEFAULT 0,
    "casino_wins" INTEGER NOT NULL DEFAULT 0,
    "casino_losses" INTEGER NOT NULL DEFAULT 0,
    "money_won" BIGINT NOT NULL DEFAULT 0,
    "money_lost" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warnings" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "moderator_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "reason" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."moderation_logs" (
    "id" TEXT NOT NULL,
    "log_id" VARCHAR(50) NOT NULL,
    "type" "public"."ModerationType" NOT NULL,
    "target_user_id" VARCHAR(20) NOT NULL,
    "moderator_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "reason" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auto_moderation_rules" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger" "public"."AutoModerationTrigger" NOT NULL,
    "action" "public"."AutoModerationAction" NOT NULL,
    "threshold" INTEGER,
    "duration" INTEGER,
    "channels" TEXT[],
    "roles" TEXT[],
    "keywords" TEXT[],
    "whitelist" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_moderation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "assigned_to" VARCHAR(20),
    "category" TEXT NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."TicketPriority" NOT NULL DEFAULT 'LOW',
    "subject" TEXT NOT NULL,
    "closed_reason" TEXT,
    "closed_by" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(20),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_economy" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "bank" BIGINT NOT NULL DEFAULT 0,
    "last_daily" TIMESTAMP(3),
    "last_weekly" TIMESTAMP(3),
    "last_work" TIMESTAMP(3),
    "daily_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_economy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."economy_transactions" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "type" "public"."EconomyTransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economy_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shop_items" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" BIGINT NOT NULL,
    "role_id" VARCHAR(20),
    "stock" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(20),

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."giveaways" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "message_id" VARCHAR(20) NOT NULL,
    "host_id" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prize" TEXT NOT NULL,
    "requirements" JSONB,
    "status" "public"."GiveawayStatus" NOT NULL DEFAULT 'ACTIVE',
    "ends_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giveaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."giveaway_entries" (
    "id" TEXT NOT NULL,
    "giveaway_id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "entries" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giveaway_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reaction_roles" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "message_id" VARCHAR(20) NOT NULL,
    "emoji" TEXT NOT NULL,
    "role_id" VARCHAR(20) NOT NULL,
    "type" "public"."ReactionRoleType" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reaction_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_commands" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "response" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(20),

    CONSTRAINT "custom_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reminders" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20),
    "channel_id" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."suggestions" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "message_id" VARCHAR(20) NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(20),

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."polls" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "message_id" VARCHAR(20) NOT NULL,
    "creator_id" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."PollType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "ends_at" TIMESTAMP(3),
    "ended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(20),

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."poll_options" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."poll_votes" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forms" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields_data" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(20),

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_submissions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "responses" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."starboard_messages" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "original_message_id" VARCHAR(20) NOT NULL,
    "starboard_message_id" VARCHAR(20),
    "channel_id" VARCHAR(20) NOT NULL,
    "author_id" VARCHAR(20) NOT NULL,
    "star_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "starboard_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduled_messages" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "send_at" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_by" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "level" "public"."LogLevel" NOT NULL DEFAULT 'INFO',
    "user_id" VARCHAR(20),
    "target_user_id" VARCHAR(20),
    "moderator_id" VARCHAR(20),
    "channel_id" VARCHAR(20),
    "message_id" VARCHAR(20),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "response_time" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "joins" INTEGER NOT NULL DEFAULT 0,
    "leaves" INTEGER NOT NULL DEFAULT 0,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "voice_minutes" INTEGER NOT NULL DEFAULT 0,
    "commands_used" INTEGER NOT NULL DEFAULT 0,
    "reactions_count" INTEGER NOT NULL DEFAULT 0,
    "threads_created" INTEGER NOT NULL DEFAULT 0,
    "tickets_created" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."level_roles" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "role_id" VARCHAR(20) NOT NULL,
    "level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shop_purchases" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "item_id" TEXT NOT NULL,
    "price_paid" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."giveaway_winners" (
    "id" TEXT NOT NULL,
    "giveaway_id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "won_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giveaway_winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."temp_voice_channels" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "owner_id" VARCHAR(20) NOT NULL,
    "parent_category" VARCHAR(20),
    "channel_name" TEXT NOT NULL,
    "user_limit" INTEGER,
    "bitrate" INTEGER,
    "region" TEXT,
    "allowed_users" TEXT[],
    "banned_users" TEXT[],
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "auto_delete" BOOLEAN NOT NULL DEFAULT true,
    "delete_timeout" INTEGER NOT NULL DEFAULT 300,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "temp_voice_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auto_roles" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "role_id" VARCHAR(20) NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB,
    "delay" INTEGER,
    "message_id" VARCHAR(20),
    "emoji" TEXT,
    "button_data" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auto_role_assignments" (
    "id" TEXT NOT NULL,
    "auto_role_id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "auto_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."voice_activities" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "session_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_end" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "deafened" BOOLEAN NOT NULL DEFAULT false,
    "streaming" BOOLEAN NOT NULL DEFAULT false,
    "camera" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "voice_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_templates" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "embed_data" JSONB,
    "variables" TEXT[],
    "category" TEXT NOT NULL DEFAULT 'general',
    "uses" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."afk_system" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "set_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mentions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "afk_system_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bump_reminders" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "message_template" TEXT NOT NULL,
    "interval_hours" INTEGER NOT NULL DEFAULT 2,
    "role_to_ping" VARCHAR(20),
    "next_bump_at" TIMESTAMP(3) NOT NULL,
    "last_bump_at" TIMESTAMP(3),
    "auto_bump" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bump_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bump_logs" (
    "id" TEXT NOT NULL,
    "reminder_id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "bumped_by" VARCHAR(20) NOT NULL,
    "bumped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auto_bump" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bump_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."server_stats" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "stat_type" TEXT NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "format_string" TEXT NOT NULL DEFAULT '{stat}',
    "update_interval" INTEGER NOT NULL DEFAULT 600,
    "last_updated" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auto_moderation_whitelist" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_moderation_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_log_configs" (
    "id" TEXT NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "category" "public"."EventLogCategory" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "channel_id" VARCHAR(20),
    "webhook_url" TEXT,
    "color" VARCHAR(7),
    "include_bots" BOOLEAN NOT NULL DEFAULT false,
    "template" TEXT,
    "created_by_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_log_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" VARCHAR(20) NOT NULL,
    "username" TEXT NOT NULL,
    "global_name" TEXT,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "discord_access_token" TEXT NOT NULL,
    "discord_refresh_token" TEXT,
    "discord_token_expires_at" TIMESTAMP(3) NOT NULL,
    "session_expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_configs_guild_id_key" ON "public"."guild_configs"("guild_id");

-- CreateIndex
CREATE INDEX "guild_configs_guild_id_idx" ON "public"."guild_configs"("guild_id");

-- CreateIndex
CREATE INDEX "user_metrics_guild_id_level_idx" ON "public"."user_metrics"("guild_id", "level");

-- CreateIndex
CREATE INDEX "user_metrics_guild_id_xp_idx" ON "public"."user_metrics"("guild_id", "xp");

-- CreateIndex
CREATE INDEX "user_metrics_user_id_idx" ON "public"."user_metrics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_metrics_user_id_guild_id_key" ON "public"."user_metrics"("user_id", "guild_id");

-- CreateIndex
CREATE INDEX "warnings_user_id_guild_id_idx" ON "public"."warnings"("user_id", "guild_id");

-- CreateIndex
CREATE INDEX "warnings_guild_id_idx" ON "public"."warnings"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_logs_log_id_key" ON "public"."moderation_logs"("log_id");

-- CreateIndex
CREATE INDEX "moderation_logs_target_user_id_guild_id_idx" ON "public"."moderation_logs"("target_user_id", "guild_id");

-- CreateIndex
CREATE INDEX "moderation_logs_moderator_id_idx" ON "public"."moderation_logs"("moderator_id");

-- CreateIndex
CREATE INDEX "moderation_logs_type_idx" ON "public"."moderation_logs"("type");

-- CreateIndex
CREATE INDEX "moderation_logs_timestamp_idx" ON "public"."moderation_logs"("timestamp");

-- CreateIndex
CREATE INDEX "moderation_logs_guild_id_timestamp_idx" ON "public"."moderation_logs"("guild_id", "timestamp");

-- CreateIndex
CREATE INDEX "auto_moderation_rules_guild_id_idx" ON "public"."auto_moderation_rules"("guild_id");

-- CreateIndex
CREATE INDEX "auto_moderation_rules_enabled_idx" ON "public"."auto_moderation_rules"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_channel_id_key" ON "public"."tickets"("channel_id");

-- CreateIndex
CREATE INDEX "tickets_guild_id_idx" ON "public"."tickets"("guild_id");

-- CreateIndex
CREATE INDEX "tickets_user_id_idx" ON "public"."tickets"("user_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "public"."tickets"("status");

-- CreateIndex
CREATE INDEX "user_economy_guild_id_idx" ON "public"."user_economy"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_economy_user_id_guild_id_key" ON "public"."user_economy"("user_id", "guild_id");

-- CreateIndex
CREATE INDEX "economy_transactions_user_id_guild_id_idx" ON "public"."economy_transactions"("user_id", "guild_id");

-- CreateIndex
CREATE INDEX "economy_transactions_guild_id_idx" ON "public"."economy_transactions"("guild_id");

-- CreateIndex
CREATE INDEX "economy_transactions_type_idx" ON "public"."economy_transactions"("type");

-- CreateIndex
CREATE INDEX "economy_transactions_created_at_idx" ON "public"."economy_transactions"("created_at");

-- CreateIndex
CREATE INDEX "shop_items_guild_id_idx" ON "public"."shop_items"("guild_id");

-- CreateIndex
CREATE INDEX "shop_items_enabled_idx" ON "public"."shop_items"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "giveaways_message_id_key" ON "public"."giveaways"("message_id");

-- CreateIndex
CREATE INDEX "giveaways_guild_id_idx" ON "public"."giveaways"("guild_id");

-- CreateIndex
CREATE INDEX "giveaways_status_idx" ON "public"."giveaways"("status");

-- CreateIndex
CREATE INDEX "giveaways_ends_at_idx" ON "public"."giveaways"("ends_at");

-- CreateIndex
CREATE INDEX "giveaway_entries_giveaway_id_idx" ON "public"."giveaway_entries"("giveaway_id");

-- CreateIndex
CREATE UNIQUE INDEX "giveaway_entries_giveaway_id_user_id_key" ON "public"."giveaway_entries"("giveaway_id", "user_id");

-- CreateIndex
CREATE INDEX "reaction_roles_guild_id_idx" ON "public"."reaction_roles"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_roles_message_id_emoji_key" ON "public"."reaction_roles"("message_id", "emoji");

-- CreateIndex
CREATE INDEX "custom_commands_guild_id_idx" ON "public"."custom_commands"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_commands_guild_id_name_key" ON "public"."custom_commands"("guild_id", "name");

-- CreateIndex
CREATE INDEX "reminders_user_id_idx" ON "public"."reminders"("user_id");

-- CreateIndex
CREATE INDEX "reminders_remind_at_idx" ON "public"."reminders"("remind_at");

-- CreateIndex
CREATE INDEX "reminders_completed_idx" ON "public"."reminders"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "suggestions_message_id_key" ON "public"."suggestions"("message_id");

-- CreateIndex
CREATE INDEX "suggestions_guild_id_idx" ON "public"."suggestions"("guild_id");

-- CreateIndex
CREATE INDEX "suggestions_status_idx" ON "public"."suggestions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "polls_message_id_key" ON "public"."polls"("message_id");

-- CreateIndex
CREATE INDEX "polls_guild_id_idx" ON "public"."polls"("guild_id");

-- CreateIndex
CREATE INDEX "polls_ended_idx" ON "public"."polls"("ended");

-- CreateIndex
CREATE INDEX "poll_options_poll_id_idx" ON "public"."poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "poll_votes_poll_id_idx" ON "public"."poll_votes"("poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_poll_id_user_id_key" ON "public"."poll_votes"("poll_id", "user_id");

-- CreateIndex
CREATE INDEX "forms_guild_id_idx" ON "public"."forms"("guild_id");

-- CreateIndex
CREATE INDEX "form_submissions_form_id_idx" ON "public"."form_submissions"("form_id");

-- CreateIndex
CREATE INDEX "form_submissions_user_id_idx" ON "public"."form_submissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "starboard_messages_original_message_id_key" ON "public"."starboard_messages"("original_message_id");

-- CreateIndex
CREATE INDEX "starboard_messages_guild_id_idx" ON "public"."starboard_messages"("guild_id");

-- CreateIndex
CREATE INDEX "starboard_messages_star_count_idx" ON "public"."starboard_messages"("star_count");

-- CreateIndex
CREATE INDEX "scheduled_messages_guild_id_idx" ON "public"."scheduled_messages"("guild_id");

-- CreateIndex
CREATE INDEX "scheduled_messages_send_at_idx" ON "public"."scheduled_messages"("send_at");

-- CreateIndex
CREATE INDEX "scheduled_messages_sent_idx" ON "public"."scheduled_messages"("sent");

-- CreateIndex
CREATE INDEX "audit_logs_guild_id_idx" ON "public"."audit_logs"("guild_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_level_idx" ON "public"."audit_logs"("level");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "public"."audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_guild_id_timestamp_idx" ON "public"."audit_logs"("guild_id", "timestamp");

-- CreateIndex
CREATE INDEX "analytics_guild_id_idx" ON "public"."analytics"("guild_id");

-- CreateIndex
CREATE INDEX "analytics_date_idx" ON "public"."analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_guild_id_date_hour_key" ON "public"."analytics"("guild_id", "date", "hour");

-- CreateIndex
CREATE INDEX "level_roles_guild_id_idx" ON "public"."level_roles"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "level_roles_guild_id_level_key" ON "public"."level_roles"("guild_id", "level");

-- CreateIndex
CREATE INDEX "shop_purchases_user_id_guild_id_idx" ON "public"."shop_purchases"("user_id", "guild_id");

-- CreateIndex
CREATE INDEX "shop_purchases_item_id_idx" ON "public"."shop_purchases"("item_id");

-- CreateIndex
CREATE INDEX "shop_purchases_created_at_idx" ON "public"."shop_purchases"("created_at");

-- CreateIndex
CREATE INDEX "giveaway_winners_user_id_idx" ON "public"."giveaway_winners"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "giveaway_winners_giveaway_id_user_id_key" ON "public"."giveaway_winners"("giveaway_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "temp_voice_channels_channel_id_key" ON "public"."temp_voice_channels"("channel_id");

-- CreateIndex
CREATE INDEX "temp_voice_channels_guild_id_idx" ON "public"."temp_voice_channels"("guild_id");

-- CreateIndex
CREATE INDEX "temp_voice_channels_owner_id_idx" ON "public"."temp_voice_channels"("owner_id");

-- CreateIndex
CREATE INDEX "temp_voice_channels_expires_at_idx" ON "public"."temp_voice_channels"("expires_at");

-- CreateIndex
CREATE INDEX "auto_roles_guild_id_idx" ON "public"."auto_roles"("guild_id");

-- CreateIndex
CREATE INDEX "auto_roles_enabled_idx" ON "public"."auto_roles"("enabled");

-- CreateIndex
CREATE INDEX "auto_role_assignments_user_id_guild_id_idx" ON "public"."auto_role_assignments"("user_id", "guild_id");

-- CreateIndex
CREATE INDEX "auto_role_assignments_assigned_at_idx" ON "public"."auto_role_assignments"("assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "auto_role_assignments_auto_role_id_user_id_key" ON "public"."auto_role_assignments"("auto_role_id", "user_id");

-- CreateIndex
CREATE INDEX "voice_activities_user_id_guild_id_idx" ON "public"."voice_activities"("user_id", "guild_id");

-- CreateIndex
CREATE INDEX "voice_activities_channel_id_idx" ON "public"."voice_activities"("channel_id");

-- CreateIndex
CREATE INDEX "voice_activities_session_start_idx" ON "public"."voice_activities"("session_start");

-- CreateIndex
CREATE INDEX "voice_activities_duration_seconds_idx" ON "public"."voice_activities"("duration_seconds");

-- CreateIndex
CREATE INDEX "message_templates_guild_id_idx" ON "public"."message_templates"("guild_id");

-- CreateIndex
CREATE INDEX "message_templates_category_idx" ON "public"."message_templates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_guild_id_name_key" ON "public"."message_templates"("guild_id", "name");

-- CreateIndex
CREATE INDEX "afk_system_guild_id_idx" ON "public"."afk_system"("guild_id");

-- CreateIndex
CREATE INDEX "afk_system_set_at_idx" ON "public"."afk_system"("set_at");

-- CreateIndex
CREATE UNIQUE INDEX "afk_system_user_id_guild_id_key" ON "public"."afk_system"("user_id", "guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "bump_reminders_guild_id_key" ON "public"."bump_reminders"("guild_id");

-- CreateIndex
CREATE INDEX "bump_reminders_next_bump_at_idx" ON "public"."bump_reminders"("next_bump_at");

-- CreateIndex
CREATE INDEX "bump_reminders_enabled_idx" ON "public"."bump_reminders"("enabled");

-- CreateIndex
CREATE INDEX "bump_logs_reminder_id_idx" ON "public"."bump_logs"("reminder_id");

-- CreateIndex
CREATE INDEX "bump_logs_guild_id_idx" ON "public"."bump_logs"("guild_id");

-- CreateIndex
CREATE INDEX "bump_logs_bumped_at_idx" ON "public"."bump_logs"("bumped_at");

-- CreateIndex
CREATE INDEX "server_stats_guild_id_idx" ON "public"."server_stats"("guild_id");

-- CreateIndex
CREATE INDEX "server_stats_enabled_idx" ON "public"."server_stats"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "server_stats_guild_id_stat_type_key" ON "public"."server_stats"("guild_id", "stat_type");

-- CreateIndex
CREATE INDEX "auto_moderation_whitelist_guild_id_idx" ON "public"."auto_moderation_whitelist"("guild_id");

-- CreateIndex
CREATE INDEX "auto_moderation_whitelist_type_idx" ON "public"."auto_moderation_whitelist"("type");

-- CreateIndex
CREATE UNIQUE INDEX "auto_moderation_whitelist_guild_id_type_value_key" ON "public"."auto_moderation_whitelist"("guild_id", "type", "value");

-- CreateIndex
CREATE INDEX "event_log_configs_guild_id_idx" ON "public"."event_log_configs"("guild_id");

-- CreateIndex
CREATE INDEX "event_log_configs_enabled_idx" ON "public"."event_log_configs"("enabled");

-- CreateIndex
CREATE INDEX "event_log_configs_guild_id_category_idx" ON "public"."event_log_configs"("guild_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_user_id_key" ON "public"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "public"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_session_expires_at_idx" ON "public"."user_sessions"("session_expires_at");

-- AddForeignKey
ALTER TABLE "public"."user_metrics" ADD CONSTRAINT "user_metrics_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warnings" ADD CONSTRAINT "warnings_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moderation_logs" ADD CONSTRAINT "moderation_logs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auto_moderation_rules" ADD CONSTRAINT "auto_moderation_rules_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_economy" ADD CONSTRAINT "user_economy_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."economy_transactions" ADD CONSTRAINT "economy_transactions_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."economy_transactions" ADD CONSTRAINT "economy_transactions_user_id_guild_id_fkey" FOREIGN KEY ("user_id", "guild_id") REFERENCES "public"."user_economy"("user_id", "guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shop_items" ADD CONSTRAINT "shop_items_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."giveaways" ADD CONSTRAINT "giveaways_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."giveaway_entries" ADD CONSTRAINT "giveaway_entries_giveaway_id_fkey" FOREIGN KEY ("giveaway_id") REFERENCES "public"."giveaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reaction_roles" ADD CONSTRAINT "reaction_roles_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_commands" ADD CONSTRAINT "custom_commands_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminders" ADD CONSTRAINT "reminders_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."polls" ADD CONSTRAINT "polls_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_votes" ADD CONSTRAINT "poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forms" ADD CONSTRAINT "forms_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_submissions" ADD CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."starboard_messages" ADD CONSTRAINT "starboard_messages_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_messages" ADD CONSTRAINT "scheduled_messages_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."level_roles" ADD CONSTRAINT "level_roles_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shop_purchases" ADD CONSTRAINT "shop_purchases_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shop_purchases" ADD CONSTRAINT "shop_purchases_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."shop_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."giveaway_winners" ADD CONSTRAINT "giveaway_winners_giveaway_id_fkey" FOREIGN KEY ("giveaway_id") REFERENCES "public"."giveaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."giveaway_winners" ADD CONSTRAINT "giveaway_winners_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temp_voice_channels" ADD CONSTRAINT "temp_voice_channels_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auto_roles" ADD CONSTRAINT "auto_roles_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auto_role_assignments" ADD CONSTRAINT "auto_role_assignments_auto_role_id_fkey" FOREIGN KEY ("auto_role_id") REFERENCES "public"."auto_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."voice_activities" ADD CONSTRAINT "voice_activities_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_templates" ADD CONSTRAINT "message_templates_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."afk_system" ADD CONSTRAINT "afk_system_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bump_reminders" ADD CONSTRAINT "bump_reminders_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bump_logs" ADD CONSTRAINT "bump_logs_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "public"."bump_reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."server_stats" ADD CONSTRAINT "server_stats_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auto_moderation_whitelist" ADD CONSTRAINT "auto_moderation_whitelist_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_log_configs" ADD CONSTRAINT "event_log_configs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
