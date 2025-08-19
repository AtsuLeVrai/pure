import { MusicEmbedController } from "@/controllers/musicEmbed.js";
import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "audioTrackAdd",
  async execute(client, queue, track) {
    try {
      const channel = queue.metadata?.channel;
      const requestedBy = queue.metadata?.requestedBy || track.requestedBy;

      if (!channel || !requestedBy || !channel.isTextBased()) {
        return;
      }

      // If music is currently playing, update the embed to show new queue info
      if (queue.isPlaying()) {
        const currentTrack = queue.currentTrack;
        if (currentTrack) {
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
      }

      Logger.debug("Track added to queue", {
        guildId: queue.guild.id,
        trackTitle: track.cleanTitle || track.title,
        queueSize: queue.tracks.size,
      });
    } catch (error) {
      Logger.error("Error in audioTrackAdd event", {
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
