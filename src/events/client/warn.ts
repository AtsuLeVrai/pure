import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "warn",
  execute: async (_client, message) => {
    Logger.warn("Discord.js warning occurred", {
      message,
    });
  },
});
