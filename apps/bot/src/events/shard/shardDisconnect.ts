import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardDisconnect",
  execute: async (client, closeEvent, shardId) => {
    // Extract close event information
    const disconnectInfo = {
      shardId,
      code: closeEvent.code,
      timestamp: new Date().toISOString(),
    };

    // Get shard manager information if available
    const shardManager = client.shard;
    const shardInfo = shardManager
      ? {
          totalShards: shardManager.count,
          shardIds: shardManager.ids,
          mode: shardManager.mode,
        }
      : null;

    // Categorize disconnect reason based on close code
    let category = "unknown";
    let severity = "warning";
    let isReconnectable = true;
    let description = "Shard disconnected";

    switch (closeEvent.code) {
      case 1000: // Normal closure
        category = "normal_closure";
        severity = "info";
        description = "Shard disconnected normally";
        break;
      case 1001: // Going away
        category = "going_away";
        severity = "info";
        description = "Shard endpoint going away";
        break;
      case 1006: // Abnormal closure
        category = "abnormal_closure";
        severity = "error";
        description = "Shard disconnected abnormally";
        break;
      case 4000: // Unknown error
        category = "unknown_error";
        severity = "error";
        description = "Unknown error caused shard disconnect";
        break;
      case 4001: // Unknown opcode
        category = "protocol_error";
        severity = "error";
        description = "Invalid opcode sent to Discord";
        break;
      case 4002: // Decode error
        category = "protocol_error";
        severity = "error";
        description = "Invalid payload sent to Discord";
        break;
      case 4003: // Not authenticated
        category = "authentication";
        severity = "critical";
        description = "Shard not authenticated";
        break;
      case 4004: // Authentication failed
        category = "authentication";
        severity = "critical";
        isReconnectable = false;
        description = "Invalid bot token";
        break;
      case 4005: // Already authenticated
        category = "protocol_error";
        severity = "error";
        description = "Shard already authenticated";
        break;
      case 4007: // Invalid seq
        category = "protocol_error";
        severity = "error";
        description = "Invalid sequence number";
        break;
      case 4008: // Rate limited
        category = "rate_limit";
        severity = "warning";
        description = "Shard rate limited";
        break;
      case 4009: // Session timed out
        category = "session_timeout";
        severity = "warning";
        description = "Session timed out";
        break;
      case 4010: // Invalid shard
        category = "invalid_shard";
        severity = "critical";
        isReconnectable = false;
        description = "Invalid shard configuration";
        break;
      case 4011: // Sharding required
        category = "sharding_required";
        severity = "critical";
        isReconnectable = false;
        description = "Bot requires sharding";
        break;
      case 4012: // Invalid API version
        category = "api_version";
        severity = "critical";
        isReconnectable = false;
        description = "Invalid Discord API version";
        break;
      case 4013: // Invalid intent(s)
        category = "invalid_intents";
        severity = "critical";
        isReconnectable = false;
        description = "Invalid bot intents";
        break;
      case 4014: // Disallowed intent(s)
        category = "disallowed_intents";
        severity = "critical";
        isReconnectable = false;
        description = "Bot lacks required intent permissions";
        break;
      default:
        if (closeEvent.code >= 4000) {
          category = "discord_error";
          severity = "error";
        } else {
          category = "websocket_error";
          severity = "warning";
        }
    }

    // Log the disconnect event
    Logger[
      severity === "critical" || severity === "error"
        ? "error"
        : severity === "warning"
          ? "warn"
          : "info"
    ](`Shard ${shardId} disconnected`, {
      source: "discord.js",
      category: "shard_management",
      subcategory: category,
      severity,
      shard: disconnectInfo,
      shardManager: shardInfo,
      reconnectable: isReconnectable,
      description,
      impact: {
        affectedShard: shardId,
        guildImpact: shardInfo
          ? `Affects ~${Math.floor(client.guilds.cache.size / shardInfo.totalShards)} guilds`
          : "Unknown",
        userImpact: isReconnectable ? "Temporary" : "Permanent until fixed",
      },
    });

    // Critical alerts for non-reconnectable errors
    if (!isReconnectable) {
      Logger.error(
        `CRITICAL: Shard ${shardId} cannot reconnect - immediate action required`,
        {
          source: "discord.js",
          category: "shard_critical",
          severity: "critical",
          alert: true,
          shardId,
          closeCode: closeEvent.code,
          description,
          actionRequired: true,
          troubleshooting: getTroubleshootingByCategory(category),
        },
      );
    }

    // Track shard stability metrics
    Logger.info(`Shard ${shardId} disconnect tracking`, {
      source: "discord.js",
      category: "shard_analytics",
      tracking: {
        shardId,
        closeCode: closeEvent.code,
        timestamp: disconnectInfo.timestamp,
        category,
        reconnectable: isReconnectable,
      },
      analytics: true,
    });
  },
});

/**
 * Get troubleshooting steps by disconnect category
 */
function getTroubleshootingByCategory(category: string): string[] {
  switch (category) {
    case "authentication":
      return [
        "Verify bot token is valid and not expired",
        "Check bot permissions in Discord Developer Portal",
        "Ensure bot is not being used elsewhere simultaneously",
        "Regenerate token if necessary",
      ];
    case "invalid_shard":
      return [
        "Check shard configuration in bot startup",
        "Verify shard count matches Discord requirements",
        "Review shard ID assignments",
        "Consult Discord API documentation for sharding",
      ];
    case "sharding_required":
      return [
        "Implement sharding for bot (required for 2500+ guilds)",
        "Configure ShardingManager properly",
        "Update bot architecture to support multiple shards",
        "Review Discord sharding guidelines",
      ];
    case "invalid_intents":
    case "disallowed_intents":
      return [
        "Review bot intents in Discord Developer Portal",
        "Update code to use only allowed intents",
        "Apply for privileged intents if needed",
        "Remove unused intent requirements",
      ];
    case "api_version":
      return [
        "Update Discord.js to latest version",
        "Check API version compatibility",
        "Review breaking changes in Discord API",
        "Update gateway connection code if needed",
      ];
    default:
      return [
        "Monitor shard reconnection attempts",
        "Check network connectivity",
        "Review Discord status page",
        "Investigate recent code changes",
      ];
  }
}
