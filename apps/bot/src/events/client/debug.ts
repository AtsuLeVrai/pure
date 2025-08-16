import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "debug",
  execute: async (client, info) => {
    Logger.debug("Discord.js debug information", {
      message: info,
      clientStatus: client.ws.status,
      ping: client.ws.ping,
    });
  },
});
