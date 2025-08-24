import { ActivityType, PresenceUpdateStatus } from "discord.js";
import { Logger } from "@/utils/logger.js";
import { defineEvent, registerCommands } from "@/utils/registry.js";

export default defineEvent({
  name: "ready",
  once: true,
  execute: async (client) => {
    try {
      // Register commands
      await registerCommands(client);

      // await db.insert(eventLogConfigs).values({
      //   guildId: "936969912600121384",
      //   category: "channels",
      //   enabled: true,
      //   channelId: "1233166498021904404",
      // });

      client.user?.setPresence({
        status: PresenceUpdateStatus.Online,
        activities: [
          {
            name: `${client.guilds.cache.size} servers • /help`,
            type: ActivityType.Watching,
          },
        ],
      });
    } catch (error) {
      Logger.error("Error during bot initialization", {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : String(error),
        phase: "ready_event",
        fatal: true,
      });

      process.exitCode = 1;
    }
  },
});
