import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "error",
  execute: async (_client, error) => {
    Logger.error("Discord.js error occurred", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
  },
});
