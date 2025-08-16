import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardError",
  execute: async (_client, error, shardId) => {
    Logger.error(`Shard ${shardId} error occurred`, {
      shardId,
      error: error.message,
      stack: error.stack,
    });
  },
});
