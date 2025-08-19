import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "disconnect",
  async execute(_client, queue) {
    try {
      Logger.warn("Player disconnected from voice channel", {
        guildId: queue.guild.id,
      });

      // If there are tracks in queue and the disconnect wasn't intentional, try to reconnect
      if (queue.tracks.size > 0 && !queue.deleted) {
        Logger.debug("Attempting to reconnect player", {
          guildId: queue.guild.id,
          tracksInQueue: queue.tracks.size,
        });

        // Note: Automatic reconnection is not implemented as VoiceConnection.channel is not available
        // Manual reconnection would be needed through bot commands
        Logger.debug("Queue has tracks but cannot auto-reconnect", {
          guildId: queue.guild.id,
          tracksInQueue: queue.tracks.size,
        });
      }
    } catch (error) {
      Logger.error("Error in disconnect event", {
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
