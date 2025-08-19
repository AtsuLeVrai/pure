import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "invalidated",
  execute: async (_client) => {
    Logger.error("Discord.js client session invalidated");
  },
});
