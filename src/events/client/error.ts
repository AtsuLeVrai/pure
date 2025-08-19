import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "error",
  execute: async (_client, error) => {
    Logger.error("Discord.js error occurred", {
      error: error.message,
      stack: error.stack,
    });
  },
});
