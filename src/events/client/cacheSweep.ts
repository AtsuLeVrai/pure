import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "cacheSweep",
  execute: async (_client, message) => {
    Logger.debug("Cache sweep event triggered", {
      message,
    });
  },
});
