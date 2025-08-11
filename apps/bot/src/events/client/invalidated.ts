import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "invalidated",
  execute: async (client) => {
    // Capture client state at time of invalidation
    const clientState = {
      id: client.user?.id,
      tag: client.user?.tag,
      status: client.ws.status,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      readyAt: client.readyAt?.toISOString(),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    // Capture system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };

    // Log the invalidation event - this is a critical event
    Logger.error("Discord.js client session invalidated", {
      source: "discord.js",
      category: "session_management",
      severity: "critical",
      event: "invalidated",
      client: clientState,
      system: systemInfo,
      impact: {
        description:
          "Bot session has been invalidated and will need to reconnect",
        expectedBehavior: "Automatic reconnection should occur",
        userImpact: "Temporary service interruption",
      },
      troubleshooting: {
        possibleCauses: [
          "Token invalidation or rotation",
          "Network connectivity issues",
          "Discord API changes",
          "Rate limiting violations",
          "Authentication problems",
        ],
        immediateActions: [
          "Monitor reconnection attempts",
          "Verify token validity",
          "Check network connectivity",
          "Review recent API usage",
        ],
      },
    });

    // Performance impact analysis
    const performanceMetrics = {
      uptimeBeforeInvalidation: Math.floor(process.uptime()),
      memorUsage: systemInfo.memory.heapUsed,
      guildCount: clientState.guilds,
      lastPing: clientState.ping,
    };

    Logger.warn("Session invalidation performance impact", {
      source: "discord.js",
      category: "performance_monitoring",
      event: "invalidated",
      metrics: performanceMetrics,
      analysis: {
        uptimeCategory:
          performanceMetrics.uptimeBeforeInvalidation < 3600
            ? "short"
            : performanceMetrics.uptimeBeforeInvalidation < 86400
              ? "medium"
              : "long",
        memoryPressure: performanceMetrics.memorUsage > 500 ? "high" : "normal",
        guildSize: performanceMetrics.guildCount > 100 ? "large" : "small",
      },
    });

    // Alert monitoring systems
    Logger.error(
      "ALERT: Discord bot session invalidated - immediate attention required",
      {
        source: "discord.js",
        category: "alerts",
        severity: "critical",
        alert: true,
        event: "session_invalidated",
        botId: clientState.id,
        timestamp: clientState.timestamp,
        actionRequired: true,
        monitoringTags: ["session", "critical", "invalidated", "reconnection"],
      },
    );

    // Track invalidation frequency (could be used for pattern analysis)
    Logger.info("Session invalidation tracking", {
      source: "discord.js",
      category: "session_analytics",
      event: "invalidated",
      tracking: {
        timestamp: clientState.timestamp,
        uptime: performanceMetrics.uptimeBeforeInvalidation,
        sessionId: `${clientState.id}-${Date.now()}`,
      },
      analytics: true,
    });
  },
});
