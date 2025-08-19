import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardReconnecting",
  execute: async (_client, shardId) => {
    Logger.info(`Shard ${shardId} reconnection impact assessment`, {
      shardId,
    });
  },
});
