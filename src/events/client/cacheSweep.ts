import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "cacheSweep",
  execute: async (_client, message) => {
    Logger.debug("Cache sweep event triggered", {
      message,
    });
  },
});
