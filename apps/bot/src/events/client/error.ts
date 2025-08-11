import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "error",
  execute: async (client, error) => {
    // Extract comprehensive error information
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      cause: error.cause,
    };

    // Extract client state information for debugging
    const clientState = {
      id: client.user?.id,
      status: client.ws.status,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      uptime: Math.floor(process.uptime()),
      readyAt: client.readyAt?.toISOString(),
      shards: client.shard?.count || 1,
    };

    // Categorize errors for better monitoring and alerting
    let category = "general";
    let severity = "error";
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Connection-related errors
    if (
      errorMessage.includes("websocket") ||
      errorMessage.includes("connection") ||
      errorName.includes("websocket") ||
      errorMessage.includes("gateway")
    ) {
      category = "connection";
      severity = "critical";
    }
    // Authentication errors
    else if (
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("token") ||
      errorName.includes("auth")
    ) {
      category = "authentication";
      severity = "critical";
    }
    // Rate limiting errors
    else if (
      errorMessage.includes("ratelimit") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorName.includes("ratelimit")
    ) {
      category = "ratelimit";
      severity = "warning";
    }
    // Permission errors
    else if (
      errorMessage.includes("permission") ||
      errorMessage.includes("forbidden") ||
      errorMessage.includes("403") ||
      errorName.includes("permission")
    ) {
      category = "permissions";
      severity = "warning";
    }
    // Shard errors
    else if (errorMessage.includes("shard") || errorName.includes("shard")) {
      category = "sharding";
      severity = "critical";
    }
    // Voice errors
    else if (errorMessage.includes("voice") || errorName.includes("voice")) {
      category = "voice";
      severity = "warning";
    }
    // API errors
    else if (
      errorMessage.includes("api") ||
      errorMessage.includes("request") ||
      errorName.includes("discord") ||
      errorName.includes("http")
    ) {
      category = "api";
    }

    // Log the error with appropriate severity
    Logger.error("Discord.js error occurred", {
      source: "discord.js",
      category,
      severity,
      error: errorInfo,
      client: clientState,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
      },
    });

    // Additional monitoring for critical errors
    if (severity === "critical") {
      Logger.error("CRITICAL: Discord.js error requires immediate attention", {
        source: "discord.js",
        category,
        severity,
        error: errorInfo,
        client: clientState,
        alert: true,
        actionRequired: true,
        troubleshooting: {
          possibleCauses: getCausesByCategory(category),
          recommendedActions: getActionsByCategory(category),
        },
      });
    }

    // Health check after error
    const healthStatus = {
      websocketReady: client.ws.status === 0,
      userAvailable: !!client.user,
      guildsLoaded: client.guilds.cache.size > 0,
      lowLatency: client.ws.ping < 1000,
    };

    const isHealthy = Object.values(healthStatus).every(Boolean);

    Logger.info("Post-error health check", {
      source: "discord.js",
      category: "health_check",
      status: isHealthy ? "healthy" : "degraded",
      checks: healthStatus,
      errorRecovery: true,
    });
  },
});

/**
 * Get possible causes by error category
 */
function getCausesByCategory(category: string): string[] {
  switch (category) {
    case "connection":
      return [
        "Network connectivity issues",
        "Discord gateway downtime",
        "Firewall blocking connections",
        "DNS resolution problems",
      ];
    case "authentication":
      return [
        "Invalid bot token",
        "Token expired or revoked",
        "Bot not properly configured",
        "Account suspended",
      ];
    case "ratelimit":
      return [
        "Too many API requests",
        "Burst limit exceeded",
        "Global rate limit hit",
        "Per-route limit exceeded",
      ];
    case "permissions":
      return [
        "Missing bot permissions",
        "Channel permissions insufficient",
        "Guild permissions changed",
        "User lacks required permissions",
      ];
    case "sharding":
      return [
        "Shard connection failed",
        "Invalid shard configuration",
        "Shard timeout",
        "Memory issues with shards",
      ];
    default:
      return ["Unknown error cause - requires investigation"];
  }
}

/**
 * Get recommended actions by error category
 */
function getActionsByCategory(category: string): string[] {
  switch (category) {
    case "connection":
      return [
        "Check internet connectivity",
        "Verify Discord status page",
        "Review firewall settings",
        "Restart bot if persistent",
      ];
    case "authentication":
      return [
        "Verify bot token validity",
        "Check bot configuration",
        "Regenerate token if necessary",
        "Review Discord developer portal",
      ];
    case "ratelimit":
      return [
        "Implement request queuing",
        "Review API usage patterns",
        "Add delays between requests",
        "Optimize command handling",
      ];
    case "permissions":
      return [
        "Review bot permissions in guild",
        "Check channel-specific permissions",
        "Update bot role hierarchy",
        "Communicate with guild administrators",
      ];
    case "sharding":
      return [
        "Review shard configuration",
        "Check memory usage",
        "Restart affected shards",
        "Consider shard count adjustment",
      ];
    default:
      return ["Review error logs and Discord.js documentation"];
  }
}
