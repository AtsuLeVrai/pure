CREATE TYPE "public"."event_log_category" AS ENUM('channels', 'members', 'messages', 'moderation', 'roles', 'voice', 'guild_settings', 'emojis_stickers', 'invites', 'threads', 'scheduled_events', 'interactions', 'security', 'automod');--> statement-breakpoint
CREATE TABLE "event_log_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"category" "event_log_category" NOT NULL,
	"enabled" boolean DEFAULT false,
	"channel_id" varchar(20),
	"webhook_url" text,
	"include_bots" boolean DEFAULT false,
	"include_webhooks" boolean DEFAULT false,
	"ignore_channels" text[],
	"ignore_roles" text[],
	"embed_color" varchar(7) DEFAULT '#5865F2',
	"custom_template" text,
	"include_timestamp" boolean DEFAULT true,
	"include_user_avatar" boolean DEFAULT true,
	"enable_audit_trail" boolean DEFAULT false,
	"enable_alerts" boolean DEFAULT false,
	"alert_thresholds" text,
	"created_by" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"language" text DEFAULT 'en',
	"event_logging_enabled" boolean DEFAULT false,
	"default_log_channel_id" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guild_configs_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
CREATE TABLE "user_playlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"tracks" text NOT NULL,
	"track_count" integer DEFAULT 0,
	"total_duration" integer DEFAULT 0,
	"allow_collaboration" boolean DEFAULT false,
	"play_count" integer DEFAULT 0,
	"last_played" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_log_configs_guild_idx" ON "event_log_configs" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "event_log_configs_enabled_idx" ON "event_log_configs" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "event_log_configs_category_idx" ON "event_log_configs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "event_log_configs_guild_category_idx" ON "event_log_configs" USING btree ("guild_id","category");--> statement-breakpoint
CREATE INDEX "guild_configs_guild_id_idx" ON "guild_configs" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "guild_configs_event_logging_idx" ON "guild_configs" USING btree ("event_logging_enabled");--> statement-breakpoint
CREATE INDEX "user_playlists_user_idx" ON "user_playlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_playlists_guild_idx" ON "user_playlists" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "user_playlists_user_guild_idx" ON "user_playlists" USING btree ("user_id","guild_id");--> statement-breakpoint
CREATE INDEX "user_playlists_name_idx" ON "user_playlists" USING btree ("name");