import type {
  ApplicationCommandSubCommandData,
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
  execute: (
    client: Client<true>,
    interaction: ChatInputCommandInteraction,
  ) => Promise<void>;
}

// Define the type for slash subcommands in a Discord bot
export interface SlashSubCommand {
  data: ApplicationCommandSubCommandData;
  execute: SlashCommand["execute"];
}

// Define the type for event entities in a Discord bot
export interface EventHandler<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: Client<true>, ...args: ClientEvents[K]) => Promise<void>;
}
