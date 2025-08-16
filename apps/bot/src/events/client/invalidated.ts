import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "invalidated",
  execute: async (_client) => {
    Logger.error("Discord.js client session invalidated");
  },
});
