import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardReady",
  execute: async (_client, shardId, unavailableGuilds) => {
    Logger.info(`Shard ${shardId} is ready`, {
      shardId,
      unavailableGuilds: unavailableGuilds?.size,
    });
  },
});
