import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "playerError",
  async execute(_client, queue, error, track) {
    try {
      const isStreamingError =
        error.message.includes("ECONNRESET") ||
        error.message.includes("timeout") ||
        error.message.includes("EPIPE") ||
        error.message.includes("ffmpeg") ||
        error.message.includes("stream");

      Logger.error("Player error occurred", {
        error: {
          message: error.message,
          stack: error.stack,
        },
        guildId: queue.guild.id,
        trackTitle: track?.cleanTitle || track?.title || "Unknown",
        trackUrl: track?.url || "Unknown",
        isStreamingError,
      });

      // For streaming errors, try to recover automatically
      if (isStreamingError && track && queue.tracks.size >= 0) {
        Logger.debug("Attempting to recover from streaming error", {
          guildId: queue.guild.id,
          trackTitle: track.cleanTitle || track.title,
        });

        try {
          // Wait a moment then try to skip to next track or replay current
          setTimeout(async () => {
            if (queue.tracks.size > 0) {
              // Skip to next track
              queue.node.skip();
              Logger.debug("Skipped to next track after streaming error", {
                guildId: queue.guild.id,
              });
            } else {
              // Try to replay current track
              Logger.debug(
                "Attempting to replay current track after streaming error",
                {
                  guildId: queue.guild.id,
                  trackTitle: track.cleanTitle || track.title,
                },
              );
            }
          }, 2000);

          return; // Don't send error message for auto-recoverable errors
        } catch (recoveryError) {
          Logger.error("Failed to recover from streaming error", {
            error:
              recoveryError instanceof Error
                ? {
                    message: recoveryError.message,
                    stack: recoveryError.stack,
                  }
                : String(recoveryError),
            guildId: queue.guild.id,
          });
        }
      }

      // Only notify the channel for non-recoverable errors or if recovery failed
      const channel = queue.metadata?.channel;
      if (channel?.isTextBased()) {
        const errorMessage = isStreamingError
          ? `🔄 Connection issue with **${track?.cleanTitle || track?.title || "track"}**. Attempting to recover...`
          : `❌ Error playing **${track?.cleanTitle || track?.title || "track"}**: ${error.message}`;

        await channel.send({
          content: errorMessage,
        });
      }
    } catch (err) {
      Logger.error("Error in playerError event handler", {
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
              }
            : String(err),
        guildId: queue.guild.id,
      });
    }
  },
});
