import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "shardResume",
  execute: async (_client, shardId, replayedEvents) => {
    Logger.info(`Shard ${shardId} resumed successfully`, {
      shardId,
      replayedEvents,
    });
  },
});
