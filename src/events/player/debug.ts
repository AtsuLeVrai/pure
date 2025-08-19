import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "debug",
  async execute(_client, queue, message) {
    Logger.debug("Player debug message", {
      guildId: queue.guild.id,
      message: message,
    });
  },
});
