CREATE TYPE "public"."TicketAutomationTrigger" AS ENUM('TICKET_CREATED', 'TICKET_UPDATED', 'MESSAGE_SENT', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'TAG_ADDED', 'TAG_REMOVED', 'FIELD_UPDATED', 'TIME_ELAPSED', 'SLA_WARNING', 'SLA_BREACH', 'USER_JOINED', 'USER_LEFT');--> statement-breakpoint
CREATE TYPE "public"."TicketFieldType" AS ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'DATE', 'TIME', 'DATETIME', 'EMAIL', 'URL', 'PHONE', 'USER_SELECT', 'ROLE_SELECT', 'CHANNEL_SELECT', 'FILE_UPLOAD', 'RATING', 'COLOR_PICKER');--> statement-breakpoint
CREATE TABLE "ticket_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"user_id" varchar(20) NOT NULL,
	"action" varchar(50) NOT NULL,
	"details" jsonb,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_automation_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"automation_id" varchar(50) NOT NULL,
	"ticket_id" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"error" text,
	"execution_time_ms" integer,
	"trigger_data" jsonb,
	"action_results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_automations" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"trigger" "TicketAutomationTrigger" NOT NULL,
	"trigger_config" jsonb,
	"conditions" jsonb,
	"actions" jsonb,
	"is_active" boolean DEFAULT true,
	"run_once" boolean DEFAULT false,
	"max_executions" integer,
	"category_ids" jsonb,
	"execution_count" integer DEFAULT 0,
	"last_executed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_categories" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"emoji" varchar(50),
	"color" varchar(7),
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"discord_categories" jsonb,
	"channel_name_template" varchar(150) DEFAULT 'ticket-{number}-{username}',
	"use_threads" boolean DEFAULT false,
	"thread_auto_archive_minutes" integer DEFAULT 1440,
	"auto_assign_enabled" boolean DEFAULT false,
	"assignment_strategy" varchar(50) DEFAULT 'ROUND_ROBIN',
	"assign_to_roles" jsonb,
	"assign_to_users" jsonb,
	"max_tickets_per_staff" integer DEFAULT 5,
	"sla_enabled" boolean DEFAULT false,
	"sla_response_minutes" integer,
	"sla_resolution_minutes" integer,
	"sla_business_hours_only" boolean DEFAULT false,
	"sla_escalate_after_breaches" integer DEFAULT 1,
	"max_open_tickets_per_user" integer DEFAULT 3,
	"cooldown_minutes" integer DEFAULT 0,
	"required_roles" jsonb,
	"blocked_roles" jsonb,
	"min_account_age_days" integer,
	"min_server_member_days" integer,
	"require_subject" boolean DEFAULT true,
	"require_description" boolean DEFAULT true,
	"custom_opening_form" jsonb,
	"opening_message" text,
	"allow_user_close" boolean DEFAULT true,
	"auto_close_after_hours" integer,
	"auto_close_warning_hours" integer,
	"closing_message" text,
	"require_close_reason" boolean DEFAULT false,
	"transcript_enabled" boolean DEFAULT true,
	"transcript_channel_id" varchar(20),
	"delete_channel_on_close" boolean DEFAULT false,
	"archive_channel_on_close" boolean DEFAULT true,
	"feedback_enabled" boolean DEFAULT true,
	"feedback_required" boolean DEFAULT false,
	"rating_scale" integer DEFAULT 5,
	"feedback_questions" jsonb,
	"notify_on_create" jsonb,
	"notify_on_assign" boolean DEFAULT true,
	"notify_on_close" boolean DEFAULT false,
	"tags_enabled" boolean DEFAULT true,
	"allowed_tags" jsonb,
	"priority_enabled" boolean DEFAULT true,
	"escalation_enabled" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	CONSTRAINT "ticket_categories_guild_name_unique" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "ticket_close_reasons" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7),
	"emoji" varchar(50),
	"is_default" boolean DEFAULT false,
	"requires_note" boolean DEFAULT false,
	"allow_user_close" boolean DEFAULT true,
	"send_closure_message" boolean DEFAULT true,
	"closure_message" text,
	"delete_channel_after_hours" integer,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	CONSTRAINT "ticket_close_reasons_guild_name_unique" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "ticket_custom_fields" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"field_type" "TicketFieldType" NOT NULL,
	"field_config" jsonb,
	"is_required" boolean DEFAULT false,
	"is_visible" boolean DEFAULT true,
	"is_editable" boolean DEFAULT true,
	"show_in_list" boolean DEFAULT false,
	"category_ids" jsonb,
	"required_for_statuses" jsonb,
	"display_order" integer DEFAULT 0,
	"section" varchar(100),
	"editable_by_roles" jsonb,
	"viewable_by_roles" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	CONSTRAINT "ticket_custom_fields_guild_name_unique" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "ticket_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"target_type" varchar(10) NOT NULL,
	"target_id" varchar(20) NOT NULL,
	"category_ids" jsonb,
	"status_ids" jsonb,
	"permissions" jsonb,
	"max_tickets_assigned" integer DEFAULT 10,
	"can_view_own_tickets_only" boolean DEFAULT false,
	"can_override_automation" boolean DEFAULT false,
	"working_hours" jsonb,
	"timezone" varchar(50) DEFAULT 'UTC',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	CONSTRAINT "ticket_permissions_guild_target_unique" UNIQUE("guild_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "ticket_priorities" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) NOT NULL,
	"emoji" varchar(50),
	"level" integer NOT NULL,
	"is_default" boolean DEFAULT false,
	"sla_multiplier" real DEFAULT 1,
	"auto_escalate_after_hours" integer,
	"escalate_to_users" jsonb,
	"escalate_to_roles" jsonb,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	CONSTRAINT "ticket_priorities_guild_name_unique" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "ticket_staff_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"role_id" varchar(20) NOT NULL,
	"allowed_categories" jsonb,
	"allowed_departments" jsonb,
	"can_view_all" boolean DEFAULT false,
	"can_assign_tickets" boolean DEFAULT false,
	"can_close_tickets" boolean DEFAULT false,
	"can_delete_tickets" boolean DEFAULT false,
	"can_manage_categories" boolean DEFAULT false,
	"can_view_analytics" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_staff_roles_guild_role_unique" UNIQUE("guild_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "ticket_statuses" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) NOT NULL,
	"emoji" varchar(50),
	"is_open_status" boolean DEFAULT true,
	"is_default_open" boolean DEFAULT false,
	"is_default_closed" boolean DEFAULT false,
	"allow_user_actions" boolean DEFAULT true,
	"require_staff_only" boolean DEFAULT false,
	"auto_close_after_hours" integer,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	CONSTRAINT "ticket_statuses_guild_name_unique" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "ticket_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"category_id" varchar(50),
	"is_global" boolean DEFAULT false,
	"use_count" integer DEFAULT 0,
	"created_by" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_types" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7),
	"emoji" varchar(50),
	"is_default" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"default_priority_id" varchar(50),
	"auto_assign_to_users" jsonb,
	"auto_assign_to_roles" jsonb,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(20) NOT NULL,
	CONSTRAINT "ticket_types_guild_name_unique" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "user_ticket_settings" (
	"user_id" varchar(20) PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"dm_notifications" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT false,
	"language" varchar(5) DEFAULT 'en',
	"allow_auto_close" boolean DEFAULT true,
	"auto_close_after_hours" integer DEFAULT 72,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_ticket_settings_user_guild_unique" UNIQUE("user_id","guild_id")
);
--> statement-breakpoint
ALTER TABLE "user_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
DROP INDEX "tickets_status_idx";--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "tickets_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_channel_category_id" varchar(20);--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_log_channel_id" varchar(20);--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_archive_category_id" varchar(20);--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_number_prefix" varchar(10) DEFAULT 'TICK';--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "next_ticket_number" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "default_sla_response_minutes" integer DEFAULT 60;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "default_sla_resolution_minutes" integer DEFAULT 1440;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "sla_warning_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "sla_warning_channel_id" varchar(20);--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "enable_load_balancing" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "max_tickets_per_staff" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "auto_close_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "auto_close_after_hours" integer DEFAULT 72;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "auto_close_warning_hours" integer DEFAULT 24;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "max_open_tickets_per_user" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_cooldown_minutes" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "transcript_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "transcript_channel_id" varchar(20);--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "transcript_format" varchar(20) DEFAULT 'HTML';--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "rating_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "rating_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "rating_channel_id" varchar(20);--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "notify_on_ticket_create" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "notify_on_ticket_assign" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "notify_on_ticket_close" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "enable_ticket_threads" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "enable_ticket_prioritization" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "enable_ticket_escalation" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "enable_custom_fields" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_welcome_message" text;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_close_message" text;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "ticket_embed_color" varchar(7) DEFAULT '#5865F2';--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "enable_analytics" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "daily_reports_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guild_configs" ADD COLUMN "daily_reports_channel_id" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "ticket_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "thread_id" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "message_id" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "user_display_name" varchar(100);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "user_avatar_url" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "category_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "status_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "priority_id" varchar(50);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "type_id" varchar(50);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_to_user_id" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_to_role_id" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_by" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "sla_response_deadline" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "sla_resolution_deadline" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "first_response_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "last_response_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "response_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "close_reason_id" varchar(50);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "close_notes" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "user_rating" integer;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "user_feedback" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "feedback_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "escalation_level" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "escalated_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "escalated_by" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "escalation_reason_id" varchar(50);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "archived_by" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "archived_reason" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "transcript" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "transcript_url" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "custom_fields" jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "last_activity_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "last_message_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "message_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "ticket_activities_ticket_idx" ON "ticket_activities" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_activities_created_at_idx" ON "ticket_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ticket_automation_executions_automation_idx" ON "ticket_automation_executions" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "ticket_automation_executions_ticket_idx" ON "ticket_automation_executions" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_automation_executions_status_idx" ON "ticket_automation_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ticket_automations_guild_idx" ON "ticket_automations" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_automations_trigger_idx" ON "ticket_automations" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "ticket_automations_active_idx" ON "ticket_automations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ticket_categories_guild_idx" ON "ticket_categories" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_categories_active_idx" ON "ticket_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ticket_categories_visible_idx" ON "ticket_categories" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "ticket_categories_order_idx" ON "ticket_categories" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "ticket_close_reasons_guild_idx" ON "ticket_close_reasons" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_custom_fields_guild_idx" ON "ticket_custom_fields" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_custom_fields_type_idx" ON "ticket_custom_fields" USING btree ("field_type");--> statement-breakpoint
CREATE INDEX "ticket_permissions_guild_idx" ON "ticket_permissions" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_permissions_target_idx" ON "ticket_permissions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "ticket_priorities_guild_idx" ON "ticket_priorities" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_priorities_level_idx" ON "ticket_priorities" USING btree ("level");--> statement-breakpoint
CREATE INDEX "ticket_staff_roles_guild_idx" ON "ticket_staff_roles" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_statuses_guild_idx" ON "ticket_statuses" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_statuses_active_idx" ON "ticket_statuses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ticket_templates_guild_idx" ON "ticket_templates" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "ticket_templates_category_idx" ON "ticket_templates" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "ticket_types_guild_idx" ON "ticket_types" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "user_ticket_settings_guild_idx" ON "user_ticket_settings" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "tickets_category_idx" ON "tickets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "tickets_priority_idx" ON "tickets" USING btree ("priority_id");--> statement-breakpoint
CREATE INDEX "tickets_assigned_user_idx" ON "tickets" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "tickets_assigned_role_idx" ON "tickets" USING btree ("assigned_to_role_id");--> statement-breakpoint
CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tickets_last_activity_idx" ON "tickets" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "tickets_sla_response_idx" ON "tickets" USING btree ("sla_response_deadline");--> statement-breakpoint
CREATE INDEX "tickets_sla_resolution_idx" ON "tickets" USING btree ("sla_resolution_deadline");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status_id");--> statement-breakpoint
ALTER TABLE "guild_configs" DROP COLUMN "ticket_category_id";--> statement-breakpoint
ALTER TABLE "guild_configs" DROP COLUMN "ticket_support_role_id";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "assigned_to";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "subject";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "closed_reason";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_guild_number_unique" UNIQUE("guild_id","ticket_number");--> statement-breakpoint
DROP TYPE "public"."TicketPriority";--> statement-breakpoint
DROP TYPE "public"."TicketStatus";