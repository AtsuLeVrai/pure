import { MusicEmbedController } from "@/controllers/musicEmbed.js";
import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "playerSkip",
  async execute(client, queue, track) {
    try {
      Logger.debug("Track skipped", {
        guildId: queue.guild.id,
        skippedTrack: track.cleanTitle || track.title,
        nextTrack:
          queue.tracks.at(0)?.cleanTitle || queue.tracks.at(0)?.title || "None",
        queueSize: queue.tracks.size,
      });

      // If there's a next track, update the embed
      const nextTrack = queue.tracks.at(0);
      if (nextTrack) {
        const channel = queue.metadata?.channel;
        const requestedBy = queue.metadata?.requestedBy;

        if (channel && requestedBy && channel.isTextBased()) {
          const embedController = new MusicEmbedController(
            queue.guild.id,
            channel,
          );
          await embedController.createOrUpdateEmbed(
            client,
            queue,
            nextTrack,
            requestedBy,
          );
        }
      }

      // Check if the skip might be due to streaming issues
      const progress = queue.node.getTimestamp();
      if (progress && track.durationMS) {
        const playedPercentage =
          ((progress.current?.value || 0) / track.durationMS) * 100;

        if (playedPercentage < 10) {
          Logger.warn("Track skipped very early - possible streaming issue", {
            guildId: queue.guild.id,
            trackTitle: track.cleanTitle || track.title,
            playedPercentage: Math.round(playedPercentage),
            playedMs: progress.current?.value || 0,
            totalMs: track.durationMS,
          });
        }
      }
    } catch (error) {
      Logger.error("Error in playerSkip event", {
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
