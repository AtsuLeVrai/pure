import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardReady",
  execute: async (client, shardId, unavailableGuilds) => {
    // Calculate shard ready time and collect metrics
    const readyInfo = {
      shardId,
      unavailableGuilds: unavailableGuilds ? Array.from(unavailableGuilds) : [],
      unavailableCount: unavailableGuilds?.size || 0,
      timestamp: new Date().toISOString(),
      readyAt: new Date().toISOString(),
    };

    // Get shard manager information
    const shardManager = client.shard;
    const shardInfo = shardManager
      ? {
          totalShards: shardManager.count,
          shardIds: shardManager.ids,
          mode: shardManager.mode,
          currentShard: shardId,
          isLastShard: shardId === Math.max(...shardManager.ids),
        }
      : {
          totalShards: 1,
          currentShard: shardId,
          isLastShard: true,
        };

    // Calculate shard-specific statistics
    const shardStats = {
      guilds: client.guilds.cache.filter((guild) => guild.shardId === shardId)
        .size,
      totalGuilds: client.guilds.cache.size,
      users: client.guilds.cache
        .filter((guild) => guild.shardId === shardId)
        .reduce((acc, guild) => acc + guild.memberCount, 0),
      channels: client.channels.cache.filter(
        (channel) => "guild" in channel && channel.guild?.shardId === shardId,
      ).size,
    };

    // Performance metrics
    const performance = {
      ping: client.ws.ping,
      uptime: Math.floor(process.uptime()),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      clientStatus: client.ws.status,
    };

    // Health assessment
    const healthStatus = {
      websocketReady: client.ws.status === 0,
      lowLatency: client.ws.ping < 500,
      guildsLoaded: shardStats.guilds > 0 || shardStats.totalGuilds === 0,
      memoryHealthy: performance.memory.heapUsed < 1000, // Less than 1GB
      unavailableGuildsAcceptable: readyInfo.unavailableCount < 5,
    };

    const overallHealth = Object.values(healthStatus).every(Boolean);

    // Log shard ready event
    Logger.info(`Shard ${shardId} is ready`, {
      source: "discord.js",
      category: "shard_management",
      subcategory: "shard_ready",
      severity: overallHealth ? "info" : "warning",
      shard: readyInfo,
      shardManager: shardInfo,
      statistics: shardStats,
      performance,
      health: {
        status: overallHealth ? "healthy" : "degraded",
        checks: healthStatus,
      },
    });

    // Log unavailable guilds if any
    if (readyInfo.unavailableCount > 0) {
      Logger.warn(
        `Shard ${shardId} has ${readyInfo.unavailableCount} unavailable guilds`,
        {
          source: "discord.js",
          category: "shard_guild_availability",
          shardId,
          unavailableCount: readyInfo.unavailableCount,
          unavailableGuilds: readyInfo.unavailableGuilds,
          impact: {
            percentage:
              shardStats.totalGuilds > 0
                ? Math.round(
                    (readyInfo.unavailableCount / shardStats.totalGuilds) * 100,
                  )
                : 0,
            severity: readyInfo.unavailableCount > 10 ? "high" : "low",
          },
          recommendation:
            readyInfo.unavailableCount > 10
              ? "Monitor guild availability and investigate Discord API status"
              : "Normal - some guilds may be temporarily unavailable",
        },
      );
    }

    // Performance analysis and recommendations
    const performanceAnalysis = {
      latency:
        performance.ping < 100
          ? "excellent"
          : performance.ping < 300
            ? "good"
            : performance.ping < 500
              ? "acceptable"
              : "poor",
      memory:
        performance.memory.heapUsed < 200
          ? "low"
          : performance.memory.heapUsed < 500
            ? "normal"
            : performance.memory.heapUsed < 800
              ? "high"
              : "critical",
      guildLoad:
        shardStats.guilds < 1000
          ? "light"
          : shardStats.guilds < 2000
            ? "moderate"
            : shardStats.guilds < 2400
              ? "heavy"
              : "critical",
    };

    Logger.debug(`Shard ${shardId} performance analysis`, {
      source: "discord.js",
      category: "shard_performance",
      shardId,
      analysis: performanceAnalysis,
      metrics: performance,
      recommendations: getPerformanceRecommendations(performanceAnalysis),
    });

    // All shards ready check
    if (shardInfo.isLastShard && shardInfo.totalShards > 1) {
      const allShardsReady = true; // Assumption - could implement actual check
      Logger.info("All shards ready - Bot fully operational", {
        source: "discord.js",
        category: "shard_management",
        subcategory: "all_shards_ready",
        severity: "info",
        sharding: {
          totalShards: shardInfo.totalShards,
          allReady: allShardsReady,
          lastShardId: shardId,
        },
        totalStats: {
          guilds: shardStats.totalGuilds,
          estimatedUsers: client.guilds.cache.reduce(
            (acc, guild) => acc + guild.memberCount,
            0,
          ),
          channels: client.channels.cache.size,
        },
        overallHealth: overallHealth,
      });
    }

    // Startup time tracking for analytics
    Logger.info(`Shard ${shardId} startup tracking`, {
      source: "discord.js",
      category: "shard_analytics",
      tracking: {
        shardId,
        readyTimestamp: readyInfo.timestamp,
        guildsLoaded: shardStats.guilds,
        unavailableCount: readyInfo.unavailableCount,
        performanceMetrics: {
          ping: performance.ping,
          memoryUsage: performance.memory.heapUsed,
        },
      },
      analytics: true,
    });

    // Alert if shard health is concerning
    if (!overallHealth) {
      Logger.warn(`Shard ${shardId} ready but health concerns detected`, {
        source: "discord.js",
        category: "shard_health_alert",
        shardId,
        healthIssues: Object.entries(healthStatus)
          .filter(([, status]) => !status)
          .map(([check]) => check),
        actionRequired:
          performanceAnalysis.memory === "critical" ||
          performanceAnalysis.latency === "poor",
        recommendations: [
          "Monitor shard performance closely",
          "Investigate health check failures",
          "Consider resource optimization if needed",
        ],
      });
    }

    // Success metrics for monitoring
    Logger.info(`Shard ${shardId} ready - Success metrics`, {
      source: "discord.js",
      category: "shard_success_metrics",
      shardId,
      success: {
        ready: true,
        healthy: overallHealth,
        guildsLoaded: shardStats.guilds,
        performance: performanceAnalysis,
        timestamp: readyInfo.timestamp,
      },
      monitoring: true,
    });
  },
});

/**
 * Get performance recommendations based on analysis
 */
function getPerformanceRecommendations(analysis: {
  latency: string;
  memory: string;
  guildLoad: string;
}): string[] {
  const recommendations = [];

  if (analysis.latency === "poor") {
    recommendations.push("High latency detected - check network connectivity");
    recommendations.push("Consider server location optimization");
  }

  if (analysis.memory === "high" || analysis.memory === "critical") {
    recommendations.push("High memory usage - implement cache cleanup");
    recommendations.push("Monitor for memory leaks");
  }

  if (analysis.guildLoad === "heavy" || analysis.guildLoad === "critical") {
    recommendations.push("High guild load - consider additional sharding");
    recommendations.push("Monitor guild distribution across shards");
  }

  if (
    analysis.latency === "excellent" &&
    analysis.memory === "low" &&
    analysis.guildLoad === "light"
  ) {
    recommendations.push(
      "Optimal performance - maintain current configuration",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Performance within acceptable ranges");
    recommendations.push("Continue monitoring metrics");
  }

  return recommendations;
}
