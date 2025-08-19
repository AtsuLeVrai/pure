import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "applicationCommandPermissionsUpdate",
  execute: async (_client, data) => {
    Logger.info("Application command permissions updated", {
      data,
    });
  },
});
