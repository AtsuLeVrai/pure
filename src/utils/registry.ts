import {
  type APIApplicationCommand,
  type Client,
  type ClientEvents,
  Events,
  Routes,
} from "discord.js";
import { env } from "@/index.js";
import type { Button, EventHandler, SlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Command registry for the bot
export const commandRegistry = new Map<string, SlashCommand>();

// Helper function to define a slash command
export function defineSlashCommand(command: SlashCommand): SlashCommand {
  // Normalization
  command.data.name = command.data.name.toLowerCase().trim();
  command.data.description = command.data.description.trim();

  // Check for duplicates
  if (commandRegistry.has(command.data.name)) {
    throw new Error(`Command "${command.data.name}" is already registered`);
  }

  // Auto-registration
  commandRegistry.set(command.data.name, command);

  // Return the command
  return command;
}

// Map to store command names to their API IDs
// This is useful for later use, such as permissions management
export const commandIds = new Map<string, APIApplicationCommand>();

// Register commands with the Discord API
export async function registerCommands(client: Client<true>): Promise<void> {
  const commandsData = Array.from(commandRegistry.values()).map(
    (cmd) => cmd.data,
  );
  const commandCount = commandsData.length;
  if (commandCount === 0) {
    return;
  }

  try {
    const guildId = env?.DISCORD_GUILD_ID;
    let registeredCommands: APIApplicationCommand[];

    if (env.NODE_ENV === "development" && guildId) {
      registeredCommands = (await client.rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commandsData },
      )) as APIApplicationCommand[];
    } else {
      registeredCommands = (await client.rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commandsData },
      )) as APIApplicationCommand[];
    }

    // Store command IDs for later use
    for (const cmd of registeredCommands) {
      commandIds.set(cmd.name, cmd);
    }
  } catch (error) {
    Logger.error("Failed to register slash commands", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : String(error),
      commandCount,
    });

    // Don't exit process, but log the failure
    throw error;
  }
}

// Button registry for the bot
export const buttonRegistry = new Map<string, Button>();

// Helper function to define a button interaction handler
export function defineButton(button: Button): Button {
  // Normalize the custom_id
  button.customId = button.customId.toLowerCase().trim();

  // Check for duplicates
  if (buttonRegistry.has(button.customId)) {
    throw new Error(`Button "${button.customId}" is already registered`);
  }

  // Registration
  buttonRegistry.set(button.customId, button);

  return button;
}

// Event registry for the bot
export const eventRegistry = new Set<EventHandler<any>>();

// Helper function to define an event entity
export function defineEvent<K extends keyof ClientEvents>(
  event: EventHandler<K>,
): EventHandler<K> {
  // Validate event name exists in Discord.js
  if (!Object.values(Events).includes(event.name as Events)) {
    console.warn(`Event "${event.name}" might not be a valid Discord.js event`);
  }

  // Check for duplicate once-only events
  const existingOnceEvent = Array.from(eventRegistry).find(
    (e) => e.name === event.name && e.once === true,
  );

  if (existingOnceEvent && event.once) {
    throw new Error(`Once-only event "${event.name}" is already registered`);
  }

  // Auto-registration
  eventRegistry.add(event);

  // Return the event
  return event;
}

// Register events with the Discord client
export function registerEvents(client: Client<true>): void {
  let registeredCount = 0;

  try {
    for (const event of eventRegistry) {
      if (event.once) {
        // One-time events (e.g., 'ready')
        client.once(event.name, (...args) => {
          event.execute(client, ...args).catch((error) => {
            Logger.error(`Error in once event '${event.name}'`, {
              error:
                error instanceof Error
                  ? {
                      message: error.message,
                      stack: error.stack,
                    }
                  : String(error),
              eventName: event.name,
            });
          });
        });
      } else {
        // Recurring events (e.g., 'interactionCreate')
        client.on(event.name, (...args) => {
          event.execute(client, ...args).catch((error) => {
            Logger.error(`Error in event '${event.name}'`, {
              error:
                error instanceof Error
                  ? {
                      message: error.message,
                      stack: error.stack,
                    }
                  : String(error),
              eventName: event.name,
            });
          });
        });
      }

      registeredCount++;
    }
  } catch (error) {
    Logger.error("Failed to register event handlers", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : String(error),
      registeredCount,
    });

    throw error;
  }
}

// Function to load all commands, events, and buttons
export async function loadModules(): Promise<void> {
  // Load commands
  await import("@/commands/music/index.js");
  await import("@/commands/utility/help.js");

  // Load events
  await import("@/events/client/applicationCommandPermissionsUpdate.js");
  await import("@/events/client/cacheSweep.js");
  await import("@/events/client/debug.js");
  await import("@/events/client/error.js");
  await import("@/events/client/interactionCreate.js");
  await import("@/events/client/invalidated.js");
  await import("@/events/client/ready.js");
  await import("@/events/client/warn.js");
}
