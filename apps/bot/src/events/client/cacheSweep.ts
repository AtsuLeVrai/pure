import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "cacheSweep",
  execute: async (_client, message) => {
    Logger.info("Discord.js cache sweep completed", {
      message,
    });
  },
});
