import {
  ApplicationCommandOptionType,
  type ApplicationCommandSubCommandData,
  type ChatInputApplicationCommandData,
  type Client,
  Routes,
} from "discord.js";
import autoplayCommand from "@/commands/music/autoplay.js";
import controlsCommand from "@/commands/music/controls.js";
import filtersCommand from "@/commands/music/filters.js";
import gameCommand from "@/commands/music/game.js";
import karaokeCommand from "@/commands/music/karaoke.js";
import loopCommand from "@/commands/music/loop.js";
import lyricsCommand from "@/commands/music/lyrics.js";
import playCommand from "@/commands/music/play.js";
import playlistCommand from "@/commands/music/playlist.js";
import queueCommand from "@/commands/music/queue.js";
import radioCommand from "@/commands/music/radio.js";
import saveCommand from "@/commands/music/save.js";
import searchCommand from "@/commands/music/search.js";
import musicSettingsCommand from "@/commands/music/settings.js";
import musicStatsCommand from "@/commands/music/stats.js";
import voiceCommand from "@/commands/music/voice.js";
import volumeCommand from "@/commands/music/volume.js";
import applicationCommandPermissionsUpdateEvent from "@/events/client/applicationCommandPermissionsUpdate.js";
import cacheSweepEvent from "@/events/client/cacheSweep.js";
import debugEvent from "@/events/client/debug.js";
import errorEvent from "@/events/client/error.js";
import interactionCreateEvent from "@/events/client/interactionCreate.js";
import invalidatedEvent from "@/events/client/invalidated.js";
import readyEvent from "@/events/client/ready.js";
import warnEvent from "@/events/client/warn.js";
import shardDisconnectEvent from "@/events/shard/shardDisconnect.js";
import shardErrorEvent from "@/events/shard/shardError.js";
import shardReadyEvent from "@/events/shard/shardReady.js";
import shardReconnectingEvent from "@/events/shard/shardReconnecting.js";
import shardResumeEvent from "@/events/shard/shardResume.js";
import { env } from "@/index.js";
import type { EventHandler, SlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Environment configuration
export const isDev = process.env.NODE_ENV === "development";
export const isProd = process.env.NODE_ENV === "production";

// Command registry for the bot
export const commandRegistry: SlashCommand[] = [
  playCommand,
  queueCommand,
  controlsCommand,
  loopCommand,
  volumeCommand,
  filtersCommand,
  playlistCommand,
  searchCommand,
  lyricsCommand,
  voiceCommand,
  musicSettingsCommand,
  musicStatsCommand,
  karaokeCommand,
  gameCommand,
  radioCommand,
  autoplayCommand,
  saveCommand,
] as const;

/**
 * Groups commands into subcommand groups based on category and subcommand properties
 */
function processCommandsIntoGroups(
  commands: SlashCommand[],
): ChatInputApplicationCommandData[] {
  const standaloneCommands: ChatInputApplicationCommandData[] = [];
  const subcommandGroups = new Map<string, SlashCommand[]>();

  for (const command of commands) {
    if (command.subcommand === true) {
      // This command should be grouped as a subcommand under its category
      const groupKey = command.category;

      if (!subcommandGroups.has(groupKey)) {
        subcommandGroups.set(groupKey, []);
      }

      subcommandGroups.get(groupKey)?.push(command);
    } else {
      // Standalone command
      standaloneCommands.push(command.data);
    }
  }

  // Create grouped commands
  const groupedCommands: ChatInputApplicationCommandData[] = [];

  for (const [groupName, groupCommands] of subcommandGroups) {
    // Filter options to only include valid subcommand option types
    const subcommands: ApplicationCommandSubCommandData[] = groupCommands.map(
      (cmd) => ({
        type: ApplicationCommandOptionType.Subcommand,
        name: cmd.data.name,
        description: cmd.data.description,
        // Only include options that are valid for subcommands (no nested subcommands/groups)
        options:
          cmd.data.options?.filter(
            (option) =>
              option.type !== ApplicationCommandOptionType.Subcommand &&
              option.type !== ApplicationCommandOptionType.SubcommandGroup,
          ) || [],
      }),
    );

    const groupCommand: ChatInputApplicationCommandData = {
      name: groupName,
      description: `${groupName.charAt(0).toUpperCase() + groupName.slice(1)} commands`,
      options: subcommands,
    };

    groupedCommands.push(groupCommand);
  }

  return [...standaloneCommands, ...groupedCommands];
}

/**
 * Creates a map for command execution routing
 */
export function createCommandExecutionMap(
  commands: SlashCommand[],
): Map<string, SlashCommand["execute"]> {
  const executionMap = new Map<string, SlashCommand["execute"]>();

  for (const command of commands) {
    if (command.subcommand === true) {
      // Key format: "category:subcommandName" for grouped commands
      const key = `${command.category}:${command.data.name}`;
      executionMap.set(key, command.execute);
    } else {
      // Key format: "commandName" for standalone commands
      executionMap.set(command.data.name, command.execute);
    }
  }

  return executionMap;
}

// Global execution map for command routing
export const commandExecutionMap = createCommandExecutionMap(commandRegistry);

// Register commands with the Discord API
export async function registerCommands(client: Client<true>): Promise<void> {
  const commandsData = processCommandsIntoGroups(commandRegistry);
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
export const eventRegistry: EventHandler<any>[] = [
  applicationCommandPermissionsUpdateEvent,
  cacheSweepEvent,
  debugEvent,
  errorEvent,
  interactionCreateEvent,
  invalidatedEvent,
  readyEvent,
  warnEvent,
  shardDisconnectEvent,
  shardErrorEvent,
  shardReadyEvent,
  shardReconnectingEvent,
  shardResumeEvent,
] as const;

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
