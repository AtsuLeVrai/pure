import { MusicEmbedController } from "@/controllers/musicEmbed.js";
import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "playerStart",
  async execute(client, queue, track) {
    try {
      const channel = queue.metadata?.channel;
      const requestedBy = queue.metadata?.requestedBy;

      if (!channel || !requestedBy || !channel.isTextBased()) {
        Logger.warn("Missing metadata for playerStart event", {
          guildId: queue.guild.id,
          hasChannel: !!channel,
          hasRequestedBy: !!requestedBy,
        });
        return;
      }

      Logger.debug("Track started playing", {
        guildId: queue.guild.id,
        trackTitle: track.cleanTitle || track.title,
        requestedBy: requestedBy.id,
      });

      // Create or update the music embed
      const embedController = new MusicEmbedController(queue.guild.id, channel);
      await embedController.createOrUpdateEmbed(
        client,
        queue,
        track,
        requestedBy,
      );
    } catch (error) {
      Logger.error("Error in playerStart event", {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : String(error),
        guildId: queue.guild.id,
        trackTitle: track.cleanTitle || track.title,
      });
    }
  },
});
