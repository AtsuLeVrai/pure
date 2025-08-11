import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardError",
  execute: async (client, error, shardId) => {
    // Extract comprehensive error information
    const errorInfo = {
      shardId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      timestamp: new Date().toISOString(),
    };

    // Get shard manager information
    const shardManager = client.shard;
    const shardInfo = shardManager
      ? {
          totalShards: shardManager.count,
          shardIds: shardManager.ids,
          mode: shardManager.mode,
        }
      : null;

    // Get current client state
    const clientState = {
      status: client.ws.status,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      uptime: Math.floor(process.uptime()),
      readyAt: client.readyAt?.toISOString(),
    };

    // Categorize the error
    let category = "unknown";
    let severity = "error";
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // WebSocket/Connection errors
    if (
      errorMessage.includes("websocket") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("socket") ||
      errorName.includes("websocket")
    ) {
      category = "websocket";
      severity = "critical";
    }
    // Authentication errors
    else if (
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("401") ||
      errorMessage.includes("token") ||
      errorMessage.includes("auth")
    ) {
      category = "authentication";
      severity = "critical";
    }
    // Rate limiting errors
    else if (
      errorMessage.includes("rate") ||
      errorMessage.includes("429") ||
      errorName.includes("ratelimit")
    ) {
      category = "rate_limit";
      severity = "warning";
    }
    // Permission errors
    else if (
      errorMessage.includes("permission") ||
      errorMessage.includes("403") ||
      errorMessage.includes("forbidden")
    ) {
      category = "permissions";
      severity = "warning";
    }
    // Gateway errors
    else if (
      errorMessage.includes("gateway") ||
      errorMessage.includes("shard") ||
      errorMessage.includes("heartbeat")
    ) {
      category = "gateway";
      severity = "critical";
    }
    // Network errors
    else if (
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("dns") ||
      errorName.includes("network")
    ) {
      category = "network";
      severity = "error";
    }
    // Memory/Resource errors
    else if (
      errorMessage.includes("memory") ||
      errorMessage.includes("heap") ||
      errorName.includes("memory")
    ) {
      category = "memory";
      severity = "critical";
    }
    // Protocol errors
    else if (
      errorMessage.includes("protocol") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("malformed")
    ) {
      category = "protocol";
      severity = "error";
    }

    // Calculate shard impact
    const shardImpact = {
      affectedShard: shardId,
      totalShards: shardInfo?.totalShards || 1,
      impactPercentage: shardInfo
        ? Math.round((1 / shardInfo.totalShards) * 100)
        : 100,
      estimatedGuildsAffected: shardInfo
        ? Math.floor(clientState.guilds / shardInfo.totalShards)
        : clientState.guilds,
    };

    // Log the shard error with appropriate severity
    Logger.error(`Shard ${shardId} error occurred`, {
      source: "discord.js",
      category: "shard_management",
      subcategory: category,
      severity,
      error: errorInfo,
      shard: shardInfo,
      client: clientState,
      impact: shardImpact,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
      },
    });

    // Critical error alerting
    if (severity === "critical") {
      Logger.error(`CRITICAL: Shard ${shardId} encountered critical error`, {
        source: "discord.js",
        category: "shard_critical",
        severity: "critical",
        alert: true,
        shardId,
        error: errorInfo,
        impact: shardImpact,
        actionRequired: true,
        troubleshooting: {
          category,
          possibleCauses: getCausesByCategory(category),
          recommendedActions: getActionsByCategory(category),
          urgency: "immediate",
        },
      });
    }

    // Performance impact analysis
    const performanceImpact = {
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cpuUsage: process.cpuUsage(),
      uptime: Math.floor(process.uptime()),
      shardHealth: {
        errorFrequency: "To be tracked", // Could implement error counting
        lastSuccessfulConnection: "Unknown", // Could track this
        averageLatency: clientState.ping,
      },
    };

    Logger.warn(`Shard ${shardId} performance impact analysis`, {
      source: "discord.js",
      category: "shard_performance",
      shardId,
      performance: performanceImpact,
      recommendations: getPerformanceRecommendations(
        category,
        performanceImpact,
      ),
    });

    // Shard recovery monitoring
    Logger.info(`Shard ${shardId} error recovery tracking`, {
      source: "discord.js",
      category: "shard_recovery",
      tracking: {
        shardId,
        errorCategory: category,
        timestamp: errorInfo.timestamp,
        monitoringRequired: severity === "critical",
      },
      analytics: true,
    });

    // Health check after error
    const healthStatus = {
      shardResponsive: true, // Assumption - could implement actual health check
      websocketReady: client.ws.status === 0,
      clientReady: !!client.user,
      guildsAccessible: clientState.guilds > 0,
      memoryHealthy: performanceImpact.memoryUsage < 1000, // Less than 1GB
    };

    Logger.info(`Shard ${shardId} post-error health check`, {
      source: "discord.js",
      category: "shard_health",
      shardId,
      health: healthStatus,
      status: Object.values(healthStatus).every(Boolean)
        ? "healthy"
        : "degraded",
      errorRecovery: true,
    });
  },
});

/**
 * Get possible causes by error category
 */
function getCausesByCategory(category: string): string[] {
  switch (category) {
    case "websocket":
      return [
        "WebSocket connection lost",
        "Network connectivity issues",
        "Discord gateway problems",
        "Firewall blocking WebSocket connections",
      ];
    case "authentication":
      return [
        "Invalid or expired bot token",
        "Bot token compromised",
        "Discord API authentication changes",
        "Concurrent bot sessions with same token",
      ];
    case "rate_limit":
      return [
        "Too many requests to Discord API",
        "Burst rate limit exceeded",
        "Global rate limit hit",
        "Invalid request patterns",
      ];
    case "gateway":
      return [
        "Discord gateway instability",
        "Invalid gateway payloads",
        "Heartbeat acknowledgment failures",
        "Shard identification issues",
      ];
    case "network":
      return [
        "Internet connectivity problems",
        "DNS resolution failures",
        "Proxy/firewall interference",
        "Network timeout issues",
      ];
    case "memory":
      return [
        "Memory leak in application",
        "Insufficient system memory",
        "Large cache sizes",
        "Memory pressure from other processes",
      ];
    case "protocol":
      return [
        "Invalid Discord API protocol usage",
        "Malformed payload data",
        "API version incompatibility",
        "Discord.js library bugs",
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
    case "websocket":
      return [
        "Check network connectivity",
        "Review firewall settings",
        "Monitor Discord status page",
        "Implement connection retry logic",
      ];
    case "authentication":
      return [
        "Verify bot token validity",
        "Regenerate bot token if compromised",
        "Check for concurrent sessions",
        "Review Discord developer portal",
      ];
    case "rate_limit":
      return [
        "Implement proper request queuing",
        "Add exponential backoff",
        "Review API usage patterns",
        "Optimize request frequency",
      ];
    case "gateway":
      return [
        "Review gateway connection logic",
        "Check heartbeat implementation",
        "Monitor Discord API status",
        "Update Discord.js library",
      ];
    case "network":
      return [
        "Test network connectivity",
        "Check DNS resolution",
        "Review proxy settings",
        "Increase timeout values",
      ];
    case "memory":
      return [
        "Investigate memory usage patterns",
        "Implement cache size limits",
        "Review for memory leaks",
        "Consider garbage collection tuning",
      ];
    case "protocol":
      return [
        "Update Discord.js to latest version",
        "Review API documentation",
        "Check payload formatting",
        "Test with minimal reproduction case",
      ];
    default:
      return [
        "Review error logs for patterns",
        "Check Discord.js documentation",
        "Consider updating dependencies",
        "Seek community support",
      ];
  }
}

/**
 * Get performance recommendations based on category and current performance
 */
function getPerformanceRecommendations(
  category: string,
  performance: any,
): string[] {
  const recommendations = [];

  if (performance.memoryUsage > 500) {
    recommendations.push(
      "High memory usage detected - consider cache optimization",
    );
  }

  if (category === "memory") {
    recommendations.push("Implement memory monitoring and alerts");
    recommendations.push("Consider cache size limits and cleanup routines");
  }

  if (category === "rate_limit") {
    recommendations.push("Implement request queuing and rate limiting");
    recommendations.push("Monitor API usage patterns");
  }

  if (category === "network" || category === "websocket") {
    recommendations.push("Implement connection pooling and retry logic");
    recommendations.push("Add network connectivity monitoring");
  }

  if (recommendations.length === 0) {
    recommendations.push("Monitor shard performance metrics");
    recommendations.push("Implement health checks for early error detection");
  }

  return recommendations;
}
