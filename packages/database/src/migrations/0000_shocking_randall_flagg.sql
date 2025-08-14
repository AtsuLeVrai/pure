CREATE TYPE "public"."AutoModerationAction" AS ENUM('DELETE', 'WARN', 'TIMEOUT', 'KICK', 'BAN');--> statement-breakpoint
CREATE TYPE "public"."AutoModerationTrigger" AS ENUM('SPAM', 'CAPS', 'LINKS', 'INVITES', 'PROFANITY', 'MENTIONS', 'REPEATED_TEXT', 'ZALGO', 'MASS_MENTIONS');--> statement-breakpoint
CREATE TYPE "public"."EconomyTransactionType" AS ENUM('EARN', 'SPEND', 'TRANSFER', 'DAILY_REWARD', 'WEEKLY_REWARD', 'GAME_WIN', 'GAME_LOSS', 'SHOP_PURCHASE', 'ADMIN_ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."EventLogCategory" AS ENUM('CHANNELS', 'MEMBERS', 'MESSAGES', 'MODERATION', 'ROLES', 'VOICE', 'GUILD_SETTINGS', 'EMOJIS_STICKERS', 'INVITES', 'THREADS', 'SCHEDULED_EVENTS', 'INTERACTIONS');--> statement-breakpoint
CREATE TYPE "public"."GiveawayStatus" AS ENUM('ACTIVE', 'ENDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."PollType" AS ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO');--> statement-breakpoint
CREATE TYPE "public"."ReactionRoleType" AS ENUM('NORMAL', 'UNIQUE', 'VERIFY', 'TOGGLE');--> statement-breakpoint
CREATE TYPE "public"."SuggestionStatus" AS ENUM('PENDING', 'APPROVED', 'DENIED', 'IMPLEMENTED');--> statement-breakpoint
CREATE TYPE "public"."TicketPriority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."TicketStatus" AS ENUM('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"date" date NOT NULL,
	"hour" integer,
	"member_count" integer DEFAULT 0,
	"joins" integer DEFAULT 0,
	"leaves" integer DEFAULT 0,
	"message_count" integer DEFAULT 0,
	"voice_minutes" integer DEFAULT 0,
	"commands_used" integer DEFAULT 0,
	"reactions_count" integer DEFAULT 0,
	"threads_created" integer DEFAULT 0,
	"tickets_created" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"warning_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_guild_id_date_hour_unique" UNIQUE("guild_id","date","hour")
);
--> statement-breakpoint
CREATE TABLE "custom_commands" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"response" text NOT NULL,
	"uses" integer DEFAULT 0,
	"enabled" boolean DEFAULT true,
	"created_by" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar(20),
	CONSTRAINT "custom_commands_guild_id_name_unique" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "economy_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"type" "EconomyTransactionType" NOT NULL,
	"amount" bigint NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" bigint NOT NULL,
	"role_id" varchar(20),
	"stock" integer,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "shop_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"item_id" text NOT NULL,
	"price_paid" bigint NOT NULL,
	"quantity" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_economy" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"balance" bigint DEFAULT 0,
	"bank" bigint DEFAULT 0,
	"last_daily" timestamp,
	"last_weekly" timestamp,
	"last_work" timestamp,
	"daily_streak" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_economy_user_id_guild_id_unique" UNIQUE("user_id","guild_id")
);
--> statement-breakpoint
CREATE TABLE "event_log_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"category" "EventLogCategory" NOT NULL,
	"enabled" boolean DEFAULT false,
	"channel_id" varchar(20),
	"webhook_url" text,
	"color" varchar(7),
	"include_bots" boolean DEFAULT false,
	"template" text,
	"created_by_id" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"responses" jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"fields_data" jsonb NOT NULL,
	"enabled" boolean DEFAULT true,
	"created_by" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "giveaway_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"giveaway_id" text NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"entries" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "giveaway_entries_giveaway_id_user_id_unique" UNIQUE("giveaway_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "giveaway_winners" (
	"id" text PRIMARY KEY NOT NULL,
	"giveaway_id" text NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"won_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "giveaway_winners_giveaway_id_user_id_unique" UNIQUE("giveaway_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "giveaways" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"message_id" varchar(20) NOT NULL,
	"host_id" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"prize" text NOT NULL,
	"requirements" jsonb,
	"status" "GiveawayStatus" DEFAULT 'ACTIVE',
	"ends_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "giveaways_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "guild_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"moderation_log_channel_id" varchar(20),
	"auto_role_id" varchar(20),
	"mute_role_id" varchar(20),
	"level_system_enabled" boolean DEFAULT false,
	"level_up_channel_id" varchar(20),
	"level_up_message" text,
	"xp_rate" real DEFAULT 1,
	"economy_enabled" boolean DEFAULT false,
	"daily_reward" real DEFAULT 100,
	"work_reward_min" real DEFAULT 50,
	"work_reward_max" real DEFAULT 200,
	"ticket_category_id" varchar(20),
	"ticket_support_role_id" varchar(20),
	"welcome_enabled" boolean DEFAULT false,
	"welcome_channel_id" varchar(20),
	"welcome_message" text,
	"leave_enabled" boolean DEFAULT false,
	"leave_channel_id" varchar(20),
	"leave_message" text,
	"language" text DEFAULT 'en',
	"timezone" text DEFAULT 'UTC',
	"voice_channel_templates" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guild_configs_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
CREATE TABLE "scheduled_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"send_at" timestamp NOT NULL,
	"sent" boolean DEFAULT false,
	"created_by" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_moderation_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT true,
	"trigger" "AutoModerationTrigger" NOT NULL,
	"action" "AutoModerationAction" NOT NULL,
	"threshold" integer,
	"duration" integer,
	"channels" text[],
	"roles" text[],
	"keywords" text[],
	"whitelist" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warnings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"moderator_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"reason" text NOT NULL,
	"active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"text" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"option_id" text NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "poll_votes_poll_id_user_id_unique" UNIQUE("poll_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"message_id" varchar(20) NOT NULL,
	"creator_id" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "PollType" DEFAULT 'SINGLE_CHOICE',
	"ends_at" timestamp,
	"ended" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar(20),
	CONSTRAINT "polls_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20),
	"channel_id" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"remind_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "reaction_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"message_id" varchar(20) NOT NULL,
	"emoji" text NOT NULL,
	"role_id" varchar(20) NOT NULL,
	"type" "ReactionRoleType" DEFAULT 'NORMAL',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reaction_roles_message_id_emoji_unique" UNIQUE("message_id","emoji")
);
--> statement-breakpoint
CREATE TABLE "starboard_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"original_message_id" varchar(20) NOT NULL,
	"starboard_message_id" varchar(20),
	"channel_id" varchar(20) NOT NULL,
	"author_id" varchar(20) NOT NULL,
	"star_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "starboard_messages_original_message_id_unique" UNIQUE("original_message_id")
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"message_id" varchar(20) NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" "SuggestionStatus" DEFAULT 'PENDING',
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar(20),
	CONSTRAINT "suggestions_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"assigned_to" varchar(20),
	"category" text NOT NULL,
	"status" "TicketStatus" DEFAULT 'OPEN',
	"priority" "TicketPriority" DEFAULT 'LOW',
	"subject" text NOT NULL,
	"closed_reason" text,
	"closed_by" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar(20),
	CONSTRAINT "tickets_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "level_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"role_id" varchar(20) NOT NULL,
	"level" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "level_roles_guild_id_level_unique" UNIQUE("guild_id","level")
);
--> statement-breakpoint
CREATE TABLE "user_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"xp" bigint DEFAULT 0,
	"level" integer DEFAULT 0,
	"messages_sent" integer DEFAULT 0,
	"voice_time" bigint DEFAULT 0,
	"last_xp_at" timestamp DEFAULT now(),
	"commands_used" integer DEFAULT 0,
	"reactions_given" integer DEFAULT 0,
	"reactions_received" integer DEFAULT 0,
	"casino_wins" integer DEFAULT 0,
	"casino_losses" integer DEFAULT 0,
	"money_won" bigint DEFAULT 0,
	"money_lost" bigint DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_metrics_user_id_guild_id_unique" UNIQUE("user_id","guild_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"discord_access_token" text NOT NULL,
	"discord_refresh_token" text,
	"discord_token_expires_at" timestamp NOT NULL,
	"session_expires_at" timestamp NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"global_name" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analytics_guild_idx" ON "analytics" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "analytics_date_idx" ON "analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "custom_commands_guild_idx" ON "custom_commands" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "economy_transactions_user_guild_idx" ON "economy_transactions" USING btree ("user_id","guild_id");--> statement-breakpoint
CREATE INDEX "economy_transactions_guild_idx" ON "economy_transactions" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "economy_transactions_type_idx" ON "economy_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "economy_transactions_created_at_idx" ON "economy_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shop_items_guild_idx" ON "shop_items" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "shop_items_enabled_idx" ON "shop_items" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "shop_purchases_user_guild_idx" ON "shop_purchases" USING btree ("user_id","guild_id");--> statement-breakpoint
CREATE INDEX "shop_purchases_item_idx" ON "shop_purchases" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "shop_purchases_created_at_idx" ON "shop_purchases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_economy_guild_idx" ON "user_economy" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "event_log_configs_guild_idx" ON "event_log_configs" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "event_log_configs_enabled_idx" ON "event_log_configs" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "event_log_configs_guild_category_idx" ON "event_log_configs" USING btree ("guild_id","category");--> statement-breakpoint
CREATE INDEX "form_submissions_form_idx" ON "form_submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_submissions_user_idx" ON "form_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forms_guild_idx" ON "forms" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "giveaway_entries_giveaway_idx" ON "giveaway_entries" USING btree ("giveaway_id");--> statement-breakpoint
CREATE INDEX "giveaway_winners_user_idx" ON "giveaway_winners" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "giveaways_guild_idx" ON "giveaways" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "giveaways_status_idx" ON "giveaways" USING btree ("status");--> statement-breakpoint
CREATE INDEX "giveaways_ends_at_idx" ON "giveaways" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "guild_configs_guild_id_idx" ON "guild_configs" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "scheduled_messages_guild_idx" ON "scheduled_messages" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "scheduled_messages_send_at_idx" ON "scheduled_messages" USING btree ("send_at");--> statement-breakpoint
CREATE INDEX "scheduled_messages_sent_idx" ON "scheduled_messages" USING btree ("sent");--> statement-breakpoint
CREATE INDEX "auto_moderation_rules_guild_idx" ON "auto_moderation_rules" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "auto_moderation_rules_enabled_idx" ON "auto_moderation_rules" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "warnings_user_guild_idx" ON "warnings" USING btree ("user_id","guild_id");--> statement-breakpoint
CREATE INDEX "warnings_guild_idx" ON "warnings" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "poll_options_poll_idx" ON "poll_options" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "poll_votes_poll_idx" ON "poll_votes" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "polls_guild_idx" ON "polls" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "polls_ended_idx" ON "polls" USING btree ("ended");--> statement-breakpoint
CREATE INDEX "reminders_user_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_remind_at_idx" ON "reminders" USING btree ("remind_at");--> statement-breakpoint
CREATE INDEX "reminders_completed_idx" ON "reminders" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "reaction_roles_guild_idx" ON "reaction_roles" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "starboard_messages_guild_idx" ON "starboard_messages" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "starboard_messages_star_count_idx" ON "starboard_messages" USING btree ("star_count");--> statement-breakpoint
CREATE INDEX "suggestions_guild_idx" ON "suggestions" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "suggestions_status_idx" ON "suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_guild_idx" ON "tickets" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "tickets_user_idx" ON "tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "level_roles_guild_idx" ON "level_roles" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "user_metrics_guild_level_idx" ON "user_metrics" USING btree ("guild_id","level");--> statement-breakpoint
CREATE INDEX "user_metrics_guild_xp_idx" ON "user_metrics" USING btree ("guild_id","xp");--> statement-breakpoint
CREATE INDEX "user_metrics_user_idx" ON "user_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_idx" ON "user_sessions" USING btree ("session_expires_at");