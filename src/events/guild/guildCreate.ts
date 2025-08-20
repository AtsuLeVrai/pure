import { eq } from "drizzle-orm";
import { db } from "@/index.js";
import { guildConfigs } from "@/schemas/guild-config.js";
import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "guildCreate",
  execute: async (_client, guild) => {
    try {
      // Check if guild configuration already exists (edge case protection)
      const existingConfig = await db
        .select()
        .from(guildConfigs)
        .where(eq(guildConfigs.guildId, guild.id))
        .limit(1);

      if (existingConfig.length > 0) {
        Logger.debug("Guild configuration already exists for new guild", {
          guildId: guild.id,
          guildName: guild.name,
          memberCount: guild.memberCount,
        });
        return;
      }

      // Initialize default guild configuration
      await db.insert(guildConfigs).values({
        guildId: guild.id,
        language: guild.preferredLocale,
        eventLoggingEnabled: false, // Security: disabled by default
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Logger.debug("New guild configuration created", {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        features: guild.features,
        preferredLocale: guild.preferredLocale,
        createdTimestamp: guild.createdTimestamp,
      });
    } catch (error) {
      Logger.error("Failed to initialize new guild configuration", {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : String(error),
        operation: "guild_create",
        critical: true,
      });

      // Continue execution - bot should still function even if config creation fails
    }
  },
});
