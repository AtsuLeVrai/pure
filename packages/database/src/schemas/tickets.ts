import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { ticketAutomationTriggerEnum, ticketFieldTypeEnum } from "./enums";

// Main tickets table
export const tickets = pgTable(
  "tickets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    ticketNumber: integer("ticket_number").notNull(),

    // Core identifiers
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 20 }).notNull().unique(),
    threadId: varchar("thread_id", { length: 20 }),
    messageId: varchar("message_id", { length: 20 }), // Panel message ID

    // User info
    userId: varchar("user_id", { length: 20 }).notNull(),
    userDisplayName: varchar("user_display_name", { length: 100 }),
    userAvatarUrl: text("user_avatar_url"),

    // Category & Assignment - All customizable
    categoryId: varchar("category_id", { length: 50 }).notNull(),
    statusId: varchar("status_id", { length: 50 }).notNull(),
    priorityId: varchar("priority_id", { length: 50 }),
    typeId: varchar("type_id", { length: 50 }),

    // Assignment
    assignedToUserId: varchar("assigned_to_user_id", { length: 20 }),
    assignedToRoleId: varchar("assigned_to_role_id", { length: 20 }),
    assignedAt: timestamp("assigned_at"),
    assignedBy: varchar("assigned_by", { length: 20 }),

    // Core ticket data
    title: text("title").notNull(),
    description: text("description"),

    // SLA & Performance tracking
    slaResponseDeadline: timestamp("sla_response_deadline"),
    slaResolutionDeadline: timestamp("sla_resolution_deadline"),
    firstResponseAt: timestamp("first_response_at"),
    lastResponseAt: timestamp("last_response_at"),
    responseCount: integer("response_count").default(0),

    // Closure tracking
    closedAt: timestamp("closed_at"),
    closedBy: varchar("closed_by", { length: 20 }),
    closeReasonId: varchar("close_reason_id", { length: 50 }),
    closeNotes: text("close_notes"),

    // User feedback
    userRating: integer("user_rating"), // 1-5 or 1-10, configurable
    userFeedback: text("user_feedback"),
    feedbackAt: timestamp("feedback_at"),

    // Internal tracking
    internalNotes: text("internal_notes"),
    escalationLevel: integer("escalation_level").default(0),
    escalatedAt: timestamp("escalated_at"),
    escalatedBy: varchar("escalated_by", { length: 20 }),
    escalationReasonId: varchar("escalation_reason_id", { length: 50 }),

    // Archival
    archivedAt: timestamp("archived_at"),
    archivedBy: varchar("archived_by", { length: 20 }),
    archivedReason: text("archived_reason"),

    // Transcript & Files
    transcript: text("transcript"),
    transcriptUrl: text("transcript_url"),
    attachments: jsonb("attachments").$type<string[]>(),

    // Custom data - completely flexible
    customFields: jsonb("custom_fields"), // Any custom field data
    tags: jsonb("tags").$type<string[]>(), // Custom tags
    metadata: jsonb("metadata"), // Any additional data

    // Activity tracking
    lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at"),
    messageCount: integer("message_count").default(0),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Performance indexes
    index("tickets_guild_idx").on(table.guildId),
    index("tickets_user_idx").on(table.userId),
    index("tickets_category_idx").on(table.categoryId),
    index("tickets_status_idx").on(table.statusId),
    index("tickets_priority_idx").on(table.priorityId),
    index("tickets_assigned_user_idx").on(table.assignedToUserId),
    index("tickets_assigned_role_idx").on(table.assignedToRoleId),
    index("tickets_created_at_idx").on(table.createdAt),
    index("tickets_last_activity_idx").on(table.lastActivityAt),
    index("tickets_sla_response_idx").on(table.slaResponseDeadline),
    index("tickets_sla_resolution_idx").on(table.slaResolutionDeadline),

    // Unique constraints
    unique("tickets_guild_number_unique").on(table.guildId, table.ticketNumber),
  ],
);

// Ticket categories - Ultra customizable with multi Discord categories support
export const ticketCategories = pgTable(
  "ticket_categories",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    // Display info
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    emoji: varchar("emoji", { length: 50 }), // Support for custom emojis
    color: varchar("color", { length: 7 }), // Hex color

    // Status & Visibility
    isActive: boolean("is_active").default(true),
    isVisible: boolean("is_visible").default(true),
    displayOrder: integer("display_order").default(0),

    // MULTI Discord Categories Support - This is the key feature you wanted!
    discordCategories:
      jsonb("discord_categories").$type<
        {
          categoryId: string;
          name: string;
          purpose: string; // "new", "active", "closed", "archive", etc.
          maxChannels?: number;
          namingTemplate: string;
        }[]
      >(),

    // Channel management
    channelNameTemplate: varchar("channel_name_template", {
      length: 150,
    }).default("ticket-{number}-{username}"),
    useThreads: boolean("use_threads").default(false),
    threadAutoArchive: integer("thread_auto_archive_minutes").default(1440), // 24h

    // Auto-assignment with advanced load balancing
    autoAssignEnabled: boolean("auto_assign_enabled").default(false),
    assignmentStrategy: varchar("assignment_strategy", { length: 50 }).default(
      "ROUND_ROBIN",
    ), // ROUND_ROBIN, LEAST_ACTIVE, RANDOM, PRIORITY
    assignToRoles: jsonb("assign_to_roles").$type<string[]>(),
    assignToUsers: jsonb("assign_to_users").$type<string[]>(),
    maxTicketsPerStaff: integer("max_tickets_per_staff").default(5),

    // SLA Configuration
    slaEnabled: boolean("sla_enabled").default(false),
    slaResponseMinutes: integer("sla_response_minutes"),
    slaResolutionMinutes: integer("sla_resolution_minutes"),
    slaBusinessHoursOnly: boolean("sla_business_hours_only").default(false),
    slaEscalateAfterBreaches: integer("sla_escalate_after_breaches").default(1),

    // User restrictions
    maxOpenTicketsPerUser: integer("max_open_tickets_per_user").default(3),
    cooldownMinutes: integer("cooldown_minutes").default(0),
    requiredRoles: jsonb("required_roles").$type<string[]>(),
    blockedRoles: jsonb("blocked_roles").$type<string[]>(),
    minAccountAge: integer("min_account_age_days"),
    minServerMemberDays: integer("min_server_member_days"),

    // Opening form configuration
    requireSubject: boolean("require_subject").default(true),
    requireDescription: boolean("require_description").default(true),
    customOpeningForm: jsonb("custom_opening_form"), // Form schema
    openingMessage: text("opening_message"),

    // Closure settings
    allowUserClose: boolean("allow_user_close").default(true),
    autoCloseAfterHours: integer("auto_close_after_hours"),
    autoCloseWarningHours: integer("auto_close_warning_hours"),
    closingMessage: text("closing_message"),
    requireCloseReason: boolean("require_close_reason").default(false),

    // Transcript & Archival
    transcriptEnabled: boolean("transcript_enabled").default(true),
    transcriptChannelId: varchar("transcript_channel_id", { length: 20 }),
    deleteChannelOnClose: boolean("delete_channel_on_close").default(false),
    archiveChannelOnClose: boolean("archive_channel_on_close").default(true),

    // Rating & Feedback
    feedbackEnabled: boolean("feedback_enabled").default(true),
    feedbackRequired: boolean("feedback_required").default(false),
    ratingScale: integer("rating_scale").default(5), // 5-star or 10-point scale
    feedbackQuestions: jsonb("feedback_questions").$type<string[]>(),

    // Notifications
    notifyOnCreate: jsonb("notify_on_create").$type<{
      roles: string[];
      users: string[];
      channels: string[];
      webhooks: string[];
    }>(),
    notifyOnAssign: boolean("notify_on_assign").default(true),
    notifyOnClose: boolean("notify_on_close").default(false),

    // Advanced features
    tagsEnabled: boolean("tags_enabled").default(true),
    allowedTags: jsonb("allowed_tags").$type<string[]>(),
    priorityEnabled: boolean("priority_enabled").default(true),
    escalationEnabled: boolean("escalation_enabled").default(true),

    // Metadata
    metadata: jsonb("metadata"), // For any additional custom config

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
  },
  (table) => [
    index("ticket_categories_guild_idx").on(table.guildId),
    index("ticket_categories_active_idx").on(table.isActive),
    index("ticket_categories_visible_idx").on(table.isVisible),
    index("ticket_categories_order_idx").on(table.displayOrder),
    unique("ticket_categories_guild_name_unique").on(table.guildId, table.name),
  ],
);

// Staff permissions and roles
export const ticketStaffRoles = pgTable(
  "ticket_staff_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    // Role info
    roleId: varchar("role_id", { length: 20 }).notNull(),

    // Category access
    allowedCategories: jsonb("allowed_categories").$type<string[]>(), // null = all categories
    allowedDepartments: jsonb("allowed_departments").$type<string[]>(),

    // Permissions
    canViewAll: boolean("can_view_all").default(false),
    canAssignTickets: boolean("can_assign_tickets").default(false),
    canCloseTickets: boolean("can_close_tickets").default(false),
    canDeleteTickets: boolean("can_delete_tickets").default(false),
    canManageCategories: boolean("can_manage_categories").default(false),
    canViewAnalytics: boolean("can_view_analytics").default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ticket_staff_roles_guild_idx").on(table.guildId),
    unique("ticket_staff_roles_guild_role_unique").on(
      table.guildId,
      table.roleId,
    ),
  ],
);

// Ticket activity log
export const ticketActivities = pgTable(
  "ticket_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    ticketId: text("ticket_id").notNull(),

    userId: varchar("user_id", { length: 20 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(), // "created", "assigned", "closed", etc.

    details: jsonb("details"), // Additional data about the action
    oldValue: text("old_value"),
    newValue: text("new_value"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ticket_activities_ticket_idx").on(table.ticketId),
    index("ticket_activities_created_at_idx").on(table.createdAt),
  ],
);

// Ticket templates for quick responses
export const ticketTemplates = pgTable(
  "ticket_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    content: text("content").notNull(),

    categoryId: varchar("category_id", { length: 50 }),
    isGlobal: boolean("is_global").default(false), // Available in all categories

    useCount: integer("use_count").default(0),
    createdBy: varchar("created_by", { length: 20 }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ticket_templates_guild_idx").on(table.guildId),
    index("ticket_templates_category_idx").on(table.categoryId),
  ],
);

// User ticket settings and preferences
export const userTicketSettings = pgTable(
  "user_ticket_settings",
  {
    userId: varchar("user_id", { length: 20 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    // Notification preferences
    dmNotifications: boolean("dm_notifications").default(true),
    emailNotifications: boolean("email_notifications").default(false),

    // Preferred language for tickets
    language: varchar("language", { length: 5 }).default("en"),

    // Auto-close settings
    allowAutoClose: boolean("allow_auto_close").default(true),
    autoCloseAfterHours: integer("auto_close_after_hours").default(72),

    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_ticket_settings_guild_idx").on(table.guildId),
    unique("user_ticket_settings_user_guild_unique").on(
      table.userId,
      table.guildId,
    ),
  ],
);

// Customizable ticket statuses - Users can create their own!
export const ticketStatuses = pgTable(
  "ticket_statuses",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }).notNull(), // Hex color
    emoji: varchar("emoji", { length: 50 }),

    // Status behavior
    isOpenStatus: boolean("is_open_status").default(true), // Open vs closed logic
    isDefaultOpen: boolean("is_default_open").default(false), // Default for new tickets
    isDefaultClosed: boolean("is_default_closed").default(false), // Default when closing

    // Automation triggers
    allowUserActions: boolean("allow_user_actions").default(true), // Users can set this status
    requireStaffOnly: boolean("require_staff_only").default(false),
    autoCloseAfterHours: integer("auto_close_after_hours"),

    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
  },
  (table) => [
    index("ticket_statuses_guild_idx").on(table.guildId),
    index("ticket_statuses_active_idx").on(table.isActive),
    unique("ticket_statuses_guild_name_unique").on(table.guildId, table.name),
  ],
);

// Customizable ticket priorities
export const ticketPriorities = pgTable(
  "ticket_priorities",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }).notNull(),
    emoji: varchar("emoji", { length: 50 }),

    // Priority behavior
    level: integer("level").notNull(), // 1 = highest, higher numbers = lower priority
    isDefault: boolean("is_default").default(false),

    // SLA modifiers
    slaMultiplier: real("sla_multiplier").default(1.0), // Multiply SLA times by this

    // Auto-escalation
    autoEscalateAfterHours: integer("auto_escalate_after_hours"),
    escalateToUsers: jsonb("escalate_to_users").$type<string[]>(),
    escalateToRoles: jsonb("escalate_to_roles").$type<string[]>(),

    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
  },
  (table) => [
    index("ticket_priorities_guild_idx").on(table.guildId),
    index("ticket_priorities_level_idx").on(table.level),
    unique("ticket_priorities_guild_name_unique").on(table.guildId, table.name),
  ],
);

// Customizable ticket types
export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }),
    emoji: varchar("emoji", { length: 50 }),

    // Type-specific settings
    isDefault: boolean("is_default").default(false),
    requiresApproval: boolean("requires_approval").default(false),
    defaultPriorityId: varchar("default_priority_id", { length: 50 }),

    // Auto-assignment
    autoAssignToUsers: jsonb("auto_assign_to_users").$type<string[]>(),
    autoAssignToRoles: jsonb("auto_assign_to_roles").$type<string[]>(),

    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
  },
  (table) => [
    index("ticket_types_guild_idx").on(table.guildId),
    unique("ticket_types_guild_name_unique").on(table.guildId, table.name),
  ],
);

// Customizable close reasons
export const ticketCloseReasons = pgTable(
  "ticket_close_reasons",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }),
    emoji: varchar("emoji", { length: 50 }),

    // Close reason behavior
    isDefault: boolean("is_default").default(false),
    requiresNote: boolean("requires_note").default(false),
    allowUserClose: boolean("allow_user_close").default(true), // Users can use this reason

    // Post-closure actions
    sendClosureMessage: boolean("send_closure_message").default(true),
    closureMessage: text("closure_message"),
    deleteChannelAfter: integer("delete_channel_after_hours"),

    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
  },
  (table) => [
    index("ticket_close_reasons_guild_idx").on(table.guildId),
    unique("ticket_close_reasons_guild_name_unique").on(
      table.guildId,
      table.name,
    ),
  ],
);

// Ultra-flexible custom fields system
export const ticketCustomFields = pgTable(
  "ticket_custom_fields",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    fieldType: ticketFieldTypeEnum("field_type").notNull(),

    // Field configuration based on type
    fieldConfig: jsonb("field_config"), // Type-specific config
    /* Examples:
    TEXT/TEXTAREA: { minLength: 10, maxLength: 500, placeholder: "Enter text..." }
    SELECT: { options: ["Option 1", "Option 2"], allowMultiple: false }
    NUMBER: { min: 0, max: 100, step: 1 }
    DATE: { minDate: "2024-01-01", maxDate: "2025-12-31" }
    */

    // Field behavior
    isRequired: boolean("is_required").default(false),
    isVisible: boolean("is_visible").default(true),
    isEditable: boolean("is_editable").default(true),
    showInList: boolean("show_in_list").default(false), // Show in ticket lists

    // Categorization
    categoryIds: jsonb("category_ids").$type<string[]>(), // null = all categories
    requiredForStatuses: jsonb("required_for_statuses").$type<string[]>(),

    // Display
    displayOrder: integer("display_order").default(0),
    section: varchar("section", { length: 100 }), // Group fields in sections

    // Permissions
    editableByRoles: jsonb("editable_by_roles").$type<string[]>(),
    viewableByRoles: jsonb("viewable_by_roles").$type<string[]>(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
  },
  (table) => [
    index("ticket_custom_fields_guild_idx").on(table.guildId),
    index("ticket_custom_fields_type_idx").on(table.fieldType),
    unique("ticket_custom_fields_guild_name_unique").on(
      table.guildId,
      table.name,
    ),
  ],
);

// Workflow automations - The ultimate customization tool!
export const ticketAutomations = pgTable(
  "ticket_automations",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // Trigger configuration
    trigger: ticketAutomationTriggerEnum("trigger").notNull(),
    triggerConfig: jsonb("trigger_config"), // Trigger-specific config

    // Conditions (optional filters)
    conditions: jsonb("conditions"), // Array of condition objects
    /* Example conditions:
    [
      { field: "categoryId", operator: "equals", value: "support" },
      { field: "priorityLevel", operator: "greater_than", value: 3 },
      { field: "customField.urgency", operator: "contains", value: "high" }
    ]
    */

    // Actions to perform
    actions:
      jsonb("actions").$type<
        Array<{
          type: string; // From ticketAutomationActionEnum
          config: any; // Action-specific configuration
          delay?: number; // Delay in minutes before executing
        }>
      >(),

    // Scheduling & Limits
    isActive: boolean("is_active").default(true),
    runOnce: boolean("run_once").default(false), // Only run once per ticket
    maxExecutions: integer("max_executions"), // Max times this can run per ticket

    // Category restrictions
    categoryIds: jsonb("category_ids").$type<string[]>(), // null = all categories

    // Execution tracking
    executionCount: integer("execution_count").default(0),
    lastExecuted: timestamp("last_executed"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ticket_automations_guild_idx").on(table.guildId),
    index("ticket_automations_trigger_idx").on(table.trigger),
    index("ticket_automations_active_idx").on(table.isActive),
  ],
);

// Track automation executions for debugging
export const ticketAutomationExecutions = pgTable(
  "ticket_automation_executions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    automationId: varchar("automation_id", { length: 50 }).notNull(),
    ticketId: text("ticket_id").notNull(),

    // Execution details
    status: varchar("status", { length: 20 }).notNull(), // SUCCESS, FAILED, SKIPPED
    error: text("error"), // Error message if failed
    executionTime: integer("execution_time_ms"), // How long it took

    // Context
    triggerData: jsonb("trigger_data"), // What triggered this execution
    actionResults: jsonb("action_results"), // Results of each action

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ticket_automation_executions_automation_idx").on(table.automationId),
    index("ticket_automation_executions_ticket_idx").on(table.ticketId),
    index("ticket_automation_executions_status_idx").on(table.status),
  ],
);

// Ultra-granular permission system
export const ticketPermissions = pgTable(
  "ticket_permissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    // Target (role or user)
    targetType: varchar("target_type", { length: 10 }).notNull(), // "ROLE" or "USER"
    targetId: varchar("target_id", { length: 20 }).notNull(), // Role ID or User ID

    // Scope restrictions
    categoryIds: jsonb("category_ids").$type<string[]>(), // null = all categories
    statusIds: jsonb("status_ids").$type<string[]>(), // null = all statuses

    // Permissions array
    permissions: jsonb("permissions").$type<string[]>(), // Array of ticketPermissionEnum values

    // Additional constraints
    maxTicketsAssigned: integer("max_tickets_assigned").default(10),
    canViewOwnTicketsOnly: boolean("can_view_own_tickets_only").default(false),
    canOverrideAutomation: boolean("can_override_automation").default(false),

    // Time-based restrictions
    workingHours: jsonb("working_hours"), // When they can be assigned/work
    timezone: varchar("timezone", { length: 50 }).default("UTC"),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
  },
  (table) => [
    index("ticket_permissions_guild_idx").on(table.guildId),
    index("ticket_permissions_target_idx").on(table.targetType, table.targetId),
    unique("ticket_permissions_guild_target_unique").on(
      table.guildId,
      table.targetType,
      table.targetId,
    ),
  ],
);

// Export types
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type TicketCategory = typeof ticketCategories.$inferSelect;
export type NewTicketCategory = typeof ticketCategories.$inferInsert;

export type TicketStatus = typeof ticketStatuses.$inferSelect;
export type NewTicketStatus = typeof ticketStatuses.$inferInsert;

export type TicketPriority = typeof ticketPriorities.$inferSelect;
export type NewTicketPriority = typeof ticketPriorities.$inferInsert;

export type TicketType = typeof ticketTypes.$inferSelect;
export type NewTicketType = typeof ticketTypes.$inferInsert;

export type TicketCloseReason = typeof ticketCloseReasons.$inferSelect;
export type NewTicketCloseReason = typeof ticketCloseReasons.$inferInsert;

export type TicketCustomField = typeof ticketCustomFields.$inferSelect;
export type NewTicketCustomField = typeof ticketCustomFields.$inferInsert;

export type TicketAutomation = typeof ticketAutomations.$inferSelect;
export type NewTicketAutomation = typeof ticketAutomations.$inferInsert;

export type TicketAutomationExecution =
  typeof ticketAutomationExecutions.$inferSelect;
export type NewTicketAutomationExecution =
  typeof ticketAutomationExecutions.$inferInsert;

export type TicketPermission = typeof ticketPermissions.$inferSelect;
export type NewTicketPermission = typeof ticketPermissions.$inferInsert;

export type TicketStaffRole = typeof ticketStaffRoles.$inferSelect;
export type NewTicketStaffRole = typeof ticketStaffRoles.$inferInsert;

export type TicketActivity = typeof ticketActivities.$inferSelect;
export type NewTicketActivity = typeof ticketActivities.$inferInsert;

export type TicketTemplate = typeof ticketTemplates.$inferSelect;
export type NewTicketTemplate = typeof ticketTemplates.$inferInsert;

export type UserTicketSettings = typeof userTicketSettings.$inferSelect;
export type NewUserTicketSettings = typeof userTicketSettings.$inferInsert;
