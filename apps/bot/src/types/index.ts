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
  | "admin"
  | "music";

// Define the types for slash commands in a Discord bot
export interface SlashCommand {
  data: ChatInputApplicationCommandData;
  category: CommandCategory;
  subcommand?: boolean; // Optional: If the command is a subcommand
  execute: (
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
  name: K;
  once?: boolean;
  execute: (client: Client<true>, ...args: ClientEvents[K]) => Promise<void>;
}

// Helper function to define an event entity
export function defineEvent<K extends keyof ClientEvents>(
  event: EventHandler<K>,
): EventHandler<K> {
  return event;
}
