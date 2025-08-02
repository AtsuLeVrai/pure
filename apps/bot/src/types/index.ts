import type {
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
} from "discord.js";

// Slash command categories for a Discord bot
export type CommandCategory =
  | "moderation"
  | "fun"
  | "utility"
  | "tickets"
  | "leveling"
  | "economy"
  | "admin";

// Define the types for slash commands in a Discord bot
export interface SlashCommand {
  readonly data: ChatInputApplicationCommandData;
  readonly category: CommandCategory;
  readonly execute: (
    client: Client<true>,
    interaction: ChatInputCommandInteraction,
  ) => Promise<void>;
}

// Helper function to define a slash command
export function defineSlashCommand(command: SlashCommand): SlashCommand {
  return command;
}

// Define the type for event entities in a Discord bot
export interface EventHandler<K extends keyof ClientEvents> {
  readonly name: K;
  readonly once?: boolean;
  readonly execute: (
    client: Client<true>,
    ...args: ClientEvents[K]
  ) => Promise<void>;
}

// Helper function to define an event entity
export function defineEvent<K extends keyof ClientEvents>(
  event: EventHandler<K>,
): EventHandler<K> {
  return event;
}
