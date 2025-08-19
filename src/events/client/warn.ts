import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "warn",
  execute: async (_client, warning) => {
    Logger.warn("Discord.js warning received", {
      warning,
    });
  },
});
