import { MusicEmbedController } from "@/controllers/musicEmbed.js";
import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "playerResume",
  async execute(client, queue) {
    const currentTrack = queue.currentTrack;

    try {
      Logger.debug("Player resumed", {
        guildId: queue.guild.id,
        trackTitle:
          currentTrack?.cleanTitle || currentTrack?.title || "Unknown",
        isPlaying: queue.node.isPlaying(),
      });

      // Update the music embed to show playing state
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

      // Log automatic resumes as they might indicate buffering recovery
      Logger.debug("Player resumed playback", {
        guildId: queue.guild.id,
        trackTitle:
          currentTrack?.cleanTitle || currentTrack?.title || "Unknown",
        timestamp: Date.now(),
      });
    } catch (error) {
      Logger.error("Error in playerResume event", {
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
