import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardReconnecting",
  execute: async (client, shardId) => {
    // Capture reconnection timestamp and context
    const reconnectInfo = {
      shardId,
      timestamp: new Date().toISOString(),
      attempt: Date.now(), // Could be used to track reconnection attempts
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

    // Current client state before reconnection
    const clientState = {
      status: client.ws.status,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      uptime: Math.floor(process.uptime()),
      readyAt: client.readyAt?.toISOString(),
      lastHeartbeat: "unknown", // Could implement heartbeat tracking
    };

    // Calculate potential impact
    const impact = {
      affectedShard: shardId,
      totalShards: shardInfo?.totalShards || 1,
      impactPercentage: shardInfo
        ? Math.round((1 / shardInfo.totalShards) * 100)
        : 100,
      estimatedGuildsAffected: shardInfo
        ? Math.floor(clientState.guilds / shardInfo.totalShards)
        : clientState.guilds,
      serviceInterruption: "temporary",
    };

    // Performance metrics at reconnection time
    const performanceMetrics = {
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      uptime: Math.floor(process.uptime()),
      latency: clientState.ping,
    };

    // Log the reconnection attempt
    Logger.warn(`Shard ${shardId} is reconnecting`, {
      source: "discord.js",
      category: "shard_management",
      subcategory: "shard_reconnecting",
      severity: "warning",
      reconnection: reconnectInfo,
      shard: shardInfo,
      client: clientState,
      impact,
      performance: performanceMetrics,
      expected: {
        duration: "Usually 5-30 seconds",
        behavior: "Automatic reconnection with session resume",
        userImpact: "Brief service interruption",
      },
    });

    // Analyze reconnection frequency (simplified - could implement actual tracking)
    const reconnectionAnalysis = {
      frequency: "normal", // Could track actual frequency
      pattern: "isolated", // Could detect patterns
      concern_level: "low", // Based on frequency and patterns
      lastReconnection: "unknown", // Could track previous reconnections
    };

    // Alert if reconnections are frequent
    if (reconnectionAnalysis.concern_level === "high") {
      Logger.error(
        `Shard ${shardId} reconnecting frequently - investigate underlying cause`,
        {
          source: "discord.js",
          category: "shard_stability",
          severity: "error",
          shardId,
          analysis: reconnectionAnalysis,
          actionRequired: true,
          troubleshooting: [
            "Check network connectivity stability",
            "Monitor Discord API status",
            "Review recent code changes",
            "Investigate memory leaks or resource issues",
            "Check for rate limiting violations",
          ],
        },
      );
    }

    // Performance impact assessment
    const performanceImpact = {
      memoryPressure:
        performanceMetrics.memory.heapUsed > 800 ? "high" : "normal",
      latencyIssues: clientState.ping > 1000 ? "yes" : "no",
      systemLoad: performanceMetrics.memory.rss > 1000 ? "high" : "normal",
      recommendations: getReconnectionRecommendations(
        performanceMetrics,
        reconnectionAnalysis,
      ),
    };

    Logger.info(`Shard ${shardId} reconnection impact assessment`, {
      source: "discord.js",
      category: "shard_performance_impact",
      shardId,
      impact: performanceImpact,
      metrics: performanceMetrics,
      analysis: reconnectionAnalysis,
    });

    // Monitoring and alerting for operations teams
    Logger.warn(`MONITORING: Shard ${shardId} reconnection event`, {
      source: "discord.js",
      category: "shard_monitoring",
      severity: "warning",
      alert: reconnectionAnalysis.concern_level === "high",
      monitoring: {
        shardId,
        event: "reconnecting",
        timestamp: reconnectInfo.timestamp,
        impactPercentage: impact.impactPercentage,
        expectedDuration: "5-30 seconds",
        actionRequired: reconnectionAnalysis.concern_level === "high",
      },
      tags: ["shard", "reconnection", "monitoring", shardId.toString()],
    });

    // Recovery expectations and tracking
    Logger.info(`Shard ${shardId} reconnection tracking`, {
      source: "discord.js",
      category: "shard_recovery",
      tracking: {
        shardId,
        event: "reconnection_started",
        timestamp: reconnectInfo.timestamp,
        expectedReconnection: true,
        monitorNextEvents: ["shardReady", "shardResume", "shardError"],
        timeoutThreshold: "60 seconds",
      },
      analytics: true,
    });

    // User experience impact logging
    const userExperienceImpact = {
      severity: impact.impactPercentage > 50 ? "high" : "low",
      affectedUsers: "estimated", // Could calculate actual affected users
      servicesDegraded: [
        "Command processing",
        "Event handling",
        "Real-time updates",
      ],
      estimatedRecoveryTime: "30 seconds or less",
    };

    Logger.info(`Shard ${shardId} user experience impact`, {
      source: "discord.js",
      category: "user_experience",
      shardId,
      impact: userExperienceImpact,
      mitigation: {
        automaticRecovery: true,
        userNotification: false, // Usually too brief to notify
        gracefulDegradation: "Commands may be temporarily unavailable",
      },
    });

    // System health check before reconnection
    const preReconnectionHealth = {
      memoryAvailable: performanceMetrics.memory.heapUsed < 1000,
      systemResponsive: true, // Could implement actual responsiveness check
      networkConnectivity: "assumed_good", // Could implement connectivity check
      discordApiStatus: "assumed_operational", // Could check Discord status
    };

    Logger.debug(`Shard ${shardId} pre-reconnection health check`, {
      source: "discord.js",
      category: "shard_health",
      shardId,
      health: preReconnectionHealth,
      readyForReconnection: Object.values(preReconnectionHealth)
        .filter((v) => typeof v === "boolean")
        .every(Boolean),
    });
  },
});

/**
 * Get reconnection recommendations based on performance metrics and analysis
 */
function getReconnectionRecommendations(
  performance: any,
  analysis: { frequency: string; concern_level: string },
): string[] {
  const recommendations = [];

  if (performance.memory.heapUsed > 800) {
    recommendations.push(
      "High memory usage - investigate potential memory leaks",
    );
    recommendations.push("Consider implementing cache cleanup routines");
  }

  if (analysis.frequency === "high") {
    recommendations.push(
      "Frequent reconnections detected - investigate root cause",
    );
    recommendations.push("Check network stability and Discord API status");
  }

  if (analysis.concern_level === "high") {
    recommendations.push("Monitor shard stability closely");
    recommendations.push("Consider implementing connection health checks");
  }

  if (performance.memory.rss > 1000) {
    recommendations.push(
      "High memory usage detected - monitor system resources",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Reconnection appears normal - continue monitoring");
    recommendations.push("Ensure automatic recovery completes successfully");
  }

  return recommendations;
}
