import { eq } from "drizzle-orm";
import { db } from "@/index.js";
import { guildConfigs } from "@/schemas/guild-config.js";
import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "guildAvailable",
  execute: async (_client, guild) => {
    try {
      // Check if guild configuration already exists
      const existingConfig = await db
        .select()
        .from(guildConfigs)
        .where(eq(guildConfigs.guildId, guild.id))
        .limit(1);

      // Skip if configuration already exists
      if (existingConfig.length > 0) {
        Logger.debug("Guild configuration already exists", {
          guildId: guild.id,
          guildName: guild.name,
          memberCount: guild.memberCount,
        });
        return;
      }

      // Create default guild configuration
      await db.insert(guildConfigs).values({
        guildId: guild.id,
        language: guild.preferredLocale,
        eventLoggingEnabled: false, // Disabled by default
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Logger.debug("Guild configuration initialized", {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        features: guild.features,
      });
    } catch (error) {
      Logger.error("Failed to initialize guild configuration", {
        guildId: guild.id,
        guildName: guild.name,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : String(error),
        operation: "guild_available",
        critical: true,
      });

      // Don't throw - this is a safety net operation
      // The bot should continue functioning even if this fails
    }
  },
});
