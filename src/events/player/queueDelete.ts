import type { Client } from "discord.js";
import type { GuildQueue } from "discord-player";
import { MusicEmbedController } from "@/controllers/musicEmbed.js";
import { Logger } from "@/utils/logger.js";
import { definePlayerEvent } from "@/utils/registry.js";

export default definePlayerEvent({
  name: "queueDelete",
  async execute(_client: Client<true>, queue: GuildQueue) {
    try {
      Logger.debug("Queue deleted, cleaning up music embed", {
        guildId: queue.guild.id,
      });

      // Clean up the music embed when queue is deleted
      MusicEmbedController.cleanup(queue.guild.id);
    } catch (error) {
      Logger.error("Error in queueDelete event", {
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
