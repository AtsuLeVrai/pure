import { defineEvent } from "@/types/index.js";
import { isDev, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "debug",
  execute: async (client, info) => {
    // Only log debug messages in development mode to avoid spam
    if (isDev) {
      Logger.debug("Discord.js debug information", {
        source: "discord.js",
        message: info,
        timestamp: new Date().toISOString(),
        clientStatus: client.ws.status,
        ping: client.ws.ping,
      });
    }

    // Log important debug messages even in production
    const importantPatterns = [
      "heartbeat",
      "resume",
      "reconnect",
      "shard",
      "gateway",
      "voice",
      "ratelimit",
    ];

    const isImportant = importantPatterns.some((pattern) =>
      info.toLowerCase().includes(pattern),
    );

    if (isImportant && !isDev) {
      Logger.info("Important Discord.js debug message", {
        source: "discord.js",
        message: info,
        category: "gateway",
        timestamp: new Date().toISOString(),
      });
    }
  },
});
