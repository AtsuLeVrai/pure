import { type Client, type ClientEvents, Events, Routes } from "discord.js";
import { env } from "@/index.js";
import type { EventHandler, SlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Environment configuration
export const isDev = process.env.NODE_ENV === "development";
export const isProd = process.env.NODE_ENV === "production";

// Command registry for the bot
export const commandRegistry = new Map<string, SlashCommand>();

// Helper function to define a slash command
export function defineSlashCommand(command: SlashCommand): SlashCommand {
  // Normalization
  command.data.name = command.data.name.toLowerCase().trim();
  command.data.description = command.data.description.trim();

  // Validate name format (Discord requirements)
  if (!/^[\w-]{1,32}$/.test(command.data.name)) {
    throw new Error(
      `Command name "${command.data.name}" contains invalid characters. Only letters, numbers, hyphens and underscores are allowed`,
    );
  }

  // Check for duplicates
  if (commandRegistry.has(command.data.name)) {
    throw new Error(`Command "${command.data.name}" is already registered`);
  }

  // Auto-registration
  commandRegistry.set(command.data.name, command);

  // Return the command
  return command;
}

// Register commands with the Discord API
export async function registerCommands(client: Client<true>): Promise<void> {
  const commandsData = Array.from(commandRegistry.values()).map(
    (cmd) => cmd.data,
  );
  const commandCount = commandsData.length;
  if (commandCount === 0) {
    Logger.warn("No commands to register");
    return;
  }

  try {
    Logger.info(`Registering ${commandCount} slash commands...`);

    const guildId = env?.DISCORD_GUILD_ID;
    if (isDev && guildId) {
      // Development: Guild-specific deployment (instant updates)
      await client.rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commandsData },
      );

      Logger.info(`Successfully registered ${commandCount} guild commands`, {
        guildId,
        commands: commandsData.map((cmd) => cmd.name),
      });
    } else {
      // Production: Global deployment (up to 1 hour propagation)
      await client.rest.put(Routes.applicationCommands(client.user.id), {
        body: commandsData,
      });

      Logger.info(`Successfully registered ${commandCount} global commands`, {
        commands: commandsData.map((cmd) => cmd.name),
      });
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
      Logger.debug(`Registered event handler: ${event.name}`);
    }

    Logger.info(`Successfully registered ${registeredCount} event handlers`);
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

// Function to load all commands and events
export async function loadModules(): Promise<void> {
  await import("@/commands/music/index.js");
  await import("@/commands/utility/help.js");
  await import("@/events/client/applicationCommandPermissionsUpdate.js");
  await import("@/events/client/cacheSweep.js");
  await import("@/events/client/debug.js");
  await import("@/events/client/error.js");
  await import("@/events/client/interactionCreate.js");
  await import("@/events/client/invalidated.js");
  await import("@/events/client/ready.js");
  await import("@/events/client/warn.js");
  await import("@/events/shard/shardDisconnect.js");
  await import("@/events/shard/shardError.js");
  await import("@/events/shard/shardReady.js");
  await import("@/events/shard/shardReconnecting.js");
  await import("@/events/shard/shardResume.js");
}
