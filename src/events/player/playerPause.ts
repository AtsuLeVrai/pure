import { MusicEmbedController } from "@/controllers/musicEmbed.js";
import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "playerPause",
  async execute(client, queue) {
    const currentTrack = queue.currentTrack;

    try {
      Logger.debug("Player paused", {
        guildId: queue.guild.id,
        trackTitle:
          currentTrack?.cleanTitle || currentTrack?.title || "Unknown",
        isPaused: queue.node.isPaused(),
      });

      // Update the music embed to show paused state
      const channel = queue.metadata?.channel;
      const requestedBy = queue.metadata?.requestedBy;

      if (channel && requestedBy && channel.isTextBased() && currentTrack) {
        const embedController = new MusicEmbedController(
          queue.guild.id,
          channel,
        );
        await embedController.createOrUpdateEmbed(
          client,
          queue,
          currentTrack,
          requestedBy,
        );
      }

      // If the pause wasn't intended (potential streaming issue), log it as a warning
      if (!queue.node.isPlaying() && queue.tracks.size > 0) {
        Logger.warn(
          "Unexpected player pause detected - possible streaming issue",
          {
            guildId: queue.guild.id,
            trackTitle:
              currentTrack?.cleanTitle || currentTrack?.title || "Unknown",
            queueSize: queue.tracks.size,
          },
        );
      }
    } catch (error) {
      Logger.error("Error in playerPause event", {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : String(error),
        guildId: queue.guild.id,
        trackTitle:
          currentTrack?.cleanTitle || currentTrack?.title || "Unknown",
      });
    }
  },
});
