import { ActivityType, type Client, PresenceUpdateStatus } from "discord.js";
import {
  commandRegistry,
  defineEvent,
  isDev,
  Logger,
  registerCommands,
} from "@/utils/index.js";

// Utility function to get memory usage in MB
function getMemoryUsage(): {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
} {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  };
}

// Utility function to format uptime in a human-readable way
function formatUptime(uptimeSeconds: number): string {
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

// Function to set the bot's presence
async function setBotPresence(client: Client<true>): Promise<void> {
  const guildCount = client.guilds.cache.size;

  try {
    client.user?.setPresence({
      status: PresenceUpdateStatus.Online,
      activities: [
        {
          name: `${guildCount} servers • /help`,
          type: ActivityType.Watching,
        },
      ],
    });

    Logger.debug("Bot presence updated", {
      status: "online",
      activity: `${guildCount} servers • /help`,
    });
  } catch (error) {
    Logger.warn("Failed to set bot presence", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Function to perform health checks on the bot
async function performHealthChecks(client: Client<true>): Promise<boolean> {
  const checks = {
    websocket: client.ws.status === 0, // 0 = READY
    guilds: client.guilds.cache.size > 0,
    user: !!client.user,
    ping: client.ws.ping < 1000,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  Logger.info("Health check completed", {
    status: allHealthy ? "healthy" : "degraded",
    checks,
    ping: client.ws.ping,
  });

  return allHealthy;
}

export default defineEvent({
  name: "ready",
  once: true,
  execute: async (client) => {
    const startTime = Date.now();

    try {
      // Bot information
      const botInfo = {
        id: client.user.id,
        tag: client.user.tag,
        username: client.user.username,
        discriminator: client.user.discriminator,
      };

      // Bot statistics
      const stats = {
        guilds: client.guilds.cache.size,
        users: client.guilds.cache.reduce(
          (acc, guild) => acc + guild.memberCount,
          0,
        ),
        channels: client.channels.cache.size,
        commands: 0, // Will be updated after command registration
      };

      // Environment information
      const environment = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        environment: isDev,
        uptime: formatUptime(process.uptime()),
        pid: process.pid,
      };

      // Memory usage
      const memory = getMemoryUsage();

      // Discord client information
      const clientInfo = {
        ping: client.ws.ping,
        status: client.ws.status,
        shards: client.shard?.count || 1,
        readyAt: client.readyAt?.toISOString(),
        maxConcurrency:
          client.options.rest?.globalRequestsPerSecond || "default",
      };

      // Log initial ready message
      Logger.info("Pure Discord Bot is initializing...", {
        bot: botInfo,
        stats,
        environment,
        memory,
        client: clientInfo,
      });

      // Register commands
      try {
        await registerCommands(client);
        // Update stats with command count
        stats.commands = commandRegistry.size;
        Logger.info("Commands registered successfully");
      } catch (error) {
        Logger.error("Failed to register commands", {
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                }
              : String(error),
        });
      }

      // Set bot presence
      await setBotPresence(client);

      // Health checks
      await performHealthChecks(client);

      // Startup complete
      const endTime = Date.now();
      const startupTime = endTime - startTime;

      Logger.info(`${client.user.username} Discord Bot is ready!`, {
        bot: `${botInfo.tag} (${botInfo.id})`,
        stats: {
          guilds: stats.guilds,
          users: stats.users.toLocaleString(),
          channels: stats.channels,
        },
        performance: {
          startupTime: `${startupTime}ms`,
          memoryUsage: `${memory.heapUsed}MB / ${memory.heapTotal}MB`,
          ping: `${client.ws.ping}ms`,
        },
        environment: environment.environment,
        version: environment.nodeVersion,
      });

      // Development mode logging
      if (isDev) {
        Logger.info("Development mode active", {
          features: [
            "Hot reload enabled",
            "Debug logging active",
            "Guild commands only",
            "Enhanced error reporting",
          ],
        });
      }

      // Monitoring metrics
      Logger.info("System metrics", {
        type: "metrics",
        timestamp: new Date().toISOString(),
        metrics: {
          guilds: stats.guilds,
          users: stats.users,
          memory_mb: memory.heapUsed,
          ping_ms: client.ws.ping,
          uptime_seconds: Math.floor(process.uptime()),
        },
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

      // Don't exit process, but mark as degraded
      process.exitCode = 1;
    }
  },
});
