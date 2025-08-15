import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

interface ShardDisconnectLog {
  readonly source: "discord.js";
  readonly shardId: number;
  readonly closeCode: number;
  readonly timestamp: string;
  readonly severity: keyof typeof Logger;
  readonly isReconnectable: boolean;
  readonly description: string;
  readonly shardManager: {
    readonly totalShards: number;
    readonly shardIds: readonly number[];
    readonly mode: string;
  } | null;
  readonly guildImpact: string;
}

export default defineEvent({
  name: "shardDisconnect",
  execute: async (client, closeEvent, shardId) => {
    let severity: keyof typeof Logger = "warn";
    let isReconnectable = true;
    let description = "Shard disconnected";

    switch (closeEvent.code) {
      case 1000:
        severity = "info";
        description = "Shard disconnected normally";
        break;
      case 1001:
        severity = "info";
        description = "Shard endpoint going away";
        break;
      case 1006:
        severity = "error";
        description = "Shard disconnected abnormally";
        break;
      case 4000:
        severity = "error";
        description = "Unknown error caused shard disconnect";
        break;
      case 4001:
      case 4002:
      case 4005:
      case 4007:
        severity = "error";
        description = "Protocol error occurred";
        break;
      case 4003:
        severity = "error";
        description = "Shard not authenticated";
        break;
      case 4004:
        severity = "error";
        isReconnectable = false;
        description = "Invalid bot token";
        break;
      case 4008:
        description = "Shard rate limited";
        break;
      case 4009:
        description = "Session timed out";
        break;
      case 4010:
        severity = "error";
        isReconnectable = false;
        description = "Invalid shard configuration";
        break;
      case 4011:
        severity = "error";
        isReconnectable = false;
        description = "Bot requires sharding";
        break;
      case 4012:
        severity = "error";
        isReconnectable = false;
        description = "Invalid Discord API version";
        break;
      case 4013:
        severity = "error";
        isReconnectable = false;
        description = "Invalid bot intents";
        break;
      case 4014:
        severity = "error";
        isReconnectable = false;
        description = "Bot lacks required intent permissions";
        break;
      default:
        if (closeEvent.code >= 4000) {
          severity = "error";
          description = "Discord-specific error occurred";
        } else {
          description = "WebSocket error occurred";
        }
    }

    const logData: ShardDisconnectLog = {
      source: "discord.js",
      shardId,
      closeCode: closeEvent.code,
      timestamp: new Date().toISOString(),
      severity,
      isReconnectable,
      description,
      shardManager: client.shard
        ? {
            totalShards: client.shard.count,
            shardIds: client.shard.ids,
            mode: client.shard.mode,
          }
        : null,
      guildImpact: client.shard
        ? `Affects ~${Math.floor(client.guilds.cache.size / client.shard.count)} guilds`
        : "Unknown",
    };

    Logger[severity](`Shard ${shardId} disconnected`, logData);

    if (!isReconnectable) {
      Logger.error(`CRITICAL: Shard ${shardId} cannot reconnect`, {
        source: "discord.js",
        shardId,
        closeCode: closeEvent.code,
        description,
      });
    }
  },
});
