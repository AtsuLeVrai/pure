import { pgEnum } from "drizzle-orm/pg-core";

export const ticketStatusEnum = pgEnum("TicketStatus", [
  "OPEN",
  "PENDING",
  "RESOLVED",
  "CLOSED",
]);

export const ticketPriorityEnum = pgEnum("TicketPriority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
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
