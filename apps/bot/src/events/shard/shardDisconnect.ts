import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardDisconnect",
  execute: async (_client, closeEvent, shardId) => {
    Logger.info(`Shard ${shardId} disconnected`, {
      shardId,
      code: closeEvent.code,
    });
  },
});
