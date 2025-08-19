import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "debug",
  execute: async (_client, message) => {
    Logger.debug("Discord.js debug message", {
      message,
    });
  },
});
