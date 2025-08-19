import { MusicEmbedController } from "@/controllers/musicEmbed.js";
import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "emptyQueue",
  async execute(_client, queue) {
    try {
      Logger.debug("Queue became empty, deleting music embed", {
        guildId: queue.guild.id,
      });

      // Delete the music embed when queue is empty
      await MusicEmbedController.deleteEmbedForGuild(queue.guild.id);
    } catch (error) {
      Logger.error("Error in emptyQueue event", {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : String(error),
        guildId: queue.guild.id,
      });
    }
  },
});
