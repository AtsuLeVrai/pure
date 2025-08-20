import { eq } from "drizzle-orm";
import { db } from "@/index.js";
import { eventLogConfigs } from "@/schemas/event-logs.js";
import { guildConfigs } from "@/schemas/guild-config.js";
import { Logger } from "@/utils/logger.js";
import { defineEvent } from "@/utils/registry.js";

export default defineEvent({
  name: "guildDelete",
  execute: async (_client, guild) => {
    try {
      // Log the guild removal event
      Logger.debug("Bot removed from guild or guild became unavailable", {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
        unavailable: !guild.available, // Important: if true, might be temporary
      });

      // IMPORTANT: Only perform cleanup if guild is truly deleted/bot was removed
      // If guild.unavailable is true, this might be a temporary Discord outage
      if (!guild.available) {
        Logger.warn("Guild unavailable - skipping data cleanup", {
          guildId: guild.id,
          guildName: guild.name,
          reason: "Guild marked as unavailable (possible Discord outage)",
        });
        return;
      }

      // Optional: Implement configurable data retention
      // For now, we'll keep the data for potential bot re-invitation
      // In production, you might want to:
      // 1. Mark records as inactive instead of deleting
      // 2. Implement a grace period before cleanup
      // 3. Export user data before deletion (GDPR compliance)

      const deletedConfigs = await db
        .delete(guildConfigs)
        .where(eq(guildConfigs.guildId, guild.id))
        .returning();

      const deletedEventConfigs = await db
        .delete(eventLogConfigs)
        .where(eq(eventLogConfigs.guildId, guild.id))
        .returning();

      Logger.debug("Guild data cleanup completed", {
        guildId: guild.id,
        guildName: guild.name,
        cleanupStats: {
          configsRemoved: deletedConfigs.length,
          eventConfigsRemoved: deletedEventConfigs.length,
        },
        operation: "guild_delete_cleanup",
      });
    } catch (error) {
      Logger.error("Failed to cleanup guild data", {
        guildId: guild.id,
        guildName: guild.name,
        unavailable: !guild.available,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : String(error),
        operation: "guild_delete",
        critical: false, // Not critical - data can be cleaned up manually
      });
    }
  },
});
