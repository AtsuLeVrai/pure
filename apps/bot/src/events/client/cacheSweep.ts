import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "cacheSweep",
  execute: async (client, message) => {
    // Parse cache sweep information
    const sweepInfo = {
      message,
      timestamp: new Date().toISOString(),
      clientId: client.user?.id,
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
    };

    // Extract memory usage before and after sweep
    const memoryUsage = {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    };

    // Determine sweep type and importance
    let sweepType = "unknown";
    let severity = "info";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("guild")) {
      sweepType = "guilds";
    } else if (lowerMessage.includes("user")) {
      sweepType = "users";
    } else if (lowerMessage.includes("channel")) {
      sweepType = "channels";
    } else if (lowerMessage.includes("message")) {
      sweepType = "messages";
      severity = "debug"; // Message sweeps are frequent and less important
    } else if (lowerMessage.includes("member")) {
      sweepType = "members";
    } else if (lowerMessage.includes("emoji")) {
      sweepType = "emojis";
    } else if (lowerMessage.includes("role")) {
      sweepType = "roles";
    } else if (lowerMessage.includes("invite")) {
      sweepType = "invites";
    } else if (lowerMessage.includes("ban")) {
      sweepType = "bans";
    } else if (lowerMessage.includes("presence")) {
      sweepType = "presences";
      severity = "debug"; // Presence sweeps are frequent
    } else if (lowerMessage.includes("voice")) {
      sweepType = "voice_states";
    }

    // Log cache sweep with appropriate level
    if (severity === "debug") {
      Logger.debug("Discord.js cache sweep completed", {
        source: "discord.js",
        category: "cache_management",
        sweepType,
        sweep: sweepInfo,
        memory: memoryUsage,
        performance: {
          uptime: Math.floor(process.uptime()),
          ping: client.ws.ping,
        },
      });
    } else {
      Logger.info("Discord.js cache sweep completed", {
        source: "discord.js",
        category: "cache_management",
        sweepType,
        sweep: sweepInfo,
        memory: memoryUsage,
        performance: {
          uptime: Math.floor(process.uptime()),
          ping: client.ws.ping,
        },
        cacheStats: {
          guilds: client.guilds.cache.size,
          users: client.users.cache.size,
          channels: client.channels.cache.size,
          // Add more cache sizes if needed
        },
      });
    }

    // Monitor memory usage trends
    if (memoryUsage.heapUsed > 500) {
      // More than 500MB
      Logger.warn("High memory usage detected after cache sweep", {
        source: "discord.js",
        category: "memory_monitoring",
        sweepType,
        memory: memoryUsage,
        recommendation:
          "Consider more aggressive cache sweeping or investigate memory leaks",
      });
    }
  },
});
