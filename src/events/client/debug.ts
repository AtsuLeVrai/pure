import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "debug",
  execute: async (_client, message) => {
    Logger.debug("Discord.js debug message", {
      message,
    });
  },
});
