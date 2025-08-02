import { type Client, Routes } from "discord.js";
import banCommand from "@/commands/moderation/ban.js";
import clearwarnsCommand from "@/commands/moderation/clearwarns.js";
import kickCommand from "@/commands/moderation/kick.js";
import lockCommand from "@/commands/moderation/lock.js";
import massbanCommand from "@/commands/moderation/massban.js";
import modlogsCommand from "@/commands/moderation/modlogs.js";
import muteCommand from "@/commands/moderation/mute.js";
import nicknameCommand from "@/commands/moderation/nickname.js";
import purgeCommand from "@/commands/moderation/purge.js";
import slowmodeCommand from "@/commands/moderation/slowmode.js";
import timeoutCommand from "@/commands/moderation/timeout.js";
import unbanCommand from "@/commands/moderation/unban.js";
import unlockCommand from "@/commands/moderation/unlock.js";
import unmuteCommand from "@/commands/moderation/unmute.js";
import userinfoCommand from "@/commands/moderation/userinfo.js";
import warnCommand from "@/commands/moderation/warn.js";
import warningsCommand from "@/commands/moderation/warnings.js";
import helpCommand from "@/commands/utility/help.js";
import pingCommand from "@/commands/utility/ping.js";
import interactionCreateEvent from "@/events/client/interactionCreate.js";
import readyEvent from "@/events/client/ready.js";
import { env } from "@/index.js";
import type { EventHandler, SlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Environment configuration
export const isDev = process.env.NODE_ENV === "development";
export const isProd = process.env.NODE_ENV === "production";

// Command registry for the bot
export const commandRegistry: readonly SlashCommand[] = [
  banCommand,
  clearwarnsCommand,
  kickCommand,
  lockCommand,
  massbanCommand,
  modlogsCommand,
  muteCommand,
  nicknameCommand,
  purgeCommand,
  slowmodeCommand,
  timeoutCommand,
  unbanCommand,
  unlockCommand,
  unmuteCommand,
  userinfoCommand,
  warnCommand,
  warningsCommand,
  helpCommand,
  pingCommand,
] as const;

// Register commands with the Discord API
export async function registerCommands(client: Client<true>): Promise<void> {
  const commandsData = commandRegistry.map((cmd) => cmd.data);
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
export const eventRegistry: readonly EventHandler<any>[] = [
  readyEvent,
  interactionCreateEvent,
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
