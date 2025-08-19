import { defineEvent, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "applicationCommandPermissionsUpdate",
  execute: async (_client, data) => {
    Logger.debug(`Application command permissions updated: ${data.id}`, {
      data,
    });
  },
});
