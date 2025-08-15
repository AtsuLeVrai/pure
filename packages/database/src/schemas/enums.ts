import { pgEnum } from "drizzle-orm/pg-core";

// Ticket System - Only essential system enums (non-customizable)
export const ticketFieldTypeEnum = pgEnum("TicketFieldType", [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "DATE",
  "TIME",
  "DATETIME",
  "EMAIL",
  "URL",
  "PHONE",
  "USER_SELECT",
  "ROLE_SELECT",
  "CHANNEL_SELECT",
  "FILE_UPLOAD",
  "RATING",
  "COLOR_PICKER",
]);

export const ticketAutomationTriggerEnum = pgEnum("TicketAutomationTrigger", [
  "TICKET_CREATED",
  "TICKET_UPDATED",
  "MESSAGE_SENT",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "ASSIGNED",
  "UNASSIGNED",
  "TAG_ADDED",
  "TAG_REMOVED",
  "FIELD_UPDATED",
  "TIME_ELAPSED",
  "SLA_WARNING",
  "SLA_BREACH",
  "USER_JOINED",
  "USER_LEFT",
]);

export const economyTransactionTypeEnum = pgEnum("EconomyTransactionType", [
  "EARN",
  "SPEND",
  "TRANSFER",
  "DAILY_REWARD",
  "WEEKLY_REWARD",
  "GAME_WIN",
  "GAME_LOSS",
  "SHOP_PURCHASE",
  "ADMIN_ADJUSTMENT",
]);

export const giveawayStatusEnum = pgEnum("GiveawayStatus", [
  "ACTIVE",
  "ENDED",
  "CANCELLED",
]);

export const autoModerationTriggerEnum = pgEnum("AutoModerationTrigger", [
  "SPAM",
  "CAPS",
  "LINKS",
  "INVITES",
  "PROFANITY",
  "MENTIONS",
  "REPEATED_TEXT",
  "ZALGO",
  "MASS_MENTIONS",
]);

export const autoModerationActionEnum = pgEnum("AutoModerationAction", [
  "DELETE",
  "WARN",
  "TIMEOUT",
  "KICK",
  "BAN",
]);

export const reactionRoleTypeEnum = pgEnum("ReactionRoleType", [
  "NORMAL",
  "UNIQUE",
  "VERIFY",
  "TOGGLE",
]);

export const suggestionStatusEnum = pgEnum("SuggestionStatus", [
  "PENDING",
  "APPROVED",
  "DENIED",
  "IMPLEMENTED",
]);

export const pollTypeEnum = pgEnum("PollType", [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "YES_NO",
]);

export const eventLogCategoryEnum = pgEnum("EventLogCategory", [
  "CHANNELS",
  "MEMBERS",
  "MESSAGES",
  "MODERATION",
  "ROLES",
  "VOICE",
  "GUILD_SETTINGS",
  "EMOJIS_STICKERS",
  "INVITES",
  "THREADS",
  "SCHEDULED_EVENTS",
  "INTERACTIONS",
]);
