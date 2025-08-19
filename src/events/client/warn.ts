import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "warn",
  execute: async (_client, message) => {
    Logger.warn("Discord.js warning occurred", {
      message,
    });
  },
});
