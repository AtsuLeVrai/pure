import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "applicationCommandPermissionsUpdate",
  execute: async (_client, data) => {
    Logger.debug(`Application command permissions updated: ${data.id}`, {
      data,
    });
  },
});
