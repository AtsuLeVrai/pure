import { ActivityType, PresenceUpdateStatus } from "discord.js";
import { defineEvent, Logger, registerCommands } from "@/utils/index.js";

export default defineEvent({
  name: "ready",
  once: true,
  execute: async (client) => {
    try {
      await registerCommands(client);

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
