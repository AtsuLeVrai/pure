import type { Guild } from "discord.js";
import { prisma } from "@/index.js";
import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "guildDelete",
  async execute(_client, guild: Guild) {
    const startTime = Date.now();

    try {
      Logger.info("Guild left or became unavailable", {
        guildId: guild.id,
        guildName: guild.name,
        available: guild.available,
        memberCount: guild.memberCount,
      });

      // Check if guild exists in database
      const guildConfig = await prisma.guildConfig.findUnique({
        where: { guild_id: guild.id },
        select: {
          id: true,
          created_at: true,
          _count: {
            select: {
              warnings: true,
              user_metrics: true,
              user_economy: true,
              tickets: true,
            },
          },
        },
      });

      if (!guildConfig) {
        Logger.warn("Guild left but no configuration found in database", {
          guildId: guild.id,
          guildName: guild.name,
        });
        return;
      }

      // If guild is unavailable (outage), don't delete data immediately
      if (!guild.available) {
        Logger.warn("Guild became unavailable - preserving data", {
          guildId: guild.id,
          guildName: guild.name,
          configAge: Date.now() - guildConfig.created_at.getTime(),
        });

        return;
      }

      // Update analytics before deletion
      await updateGuildAnalytics(guild, "leave");

      Logger.info("Performing guild data cleanup", {
        guildId: guild.id,
        guildName: guild.name,
      });

      // Perform cascading cleanup (Prisma will handle foreign key constraints)
      // This will delete all related data due to onDelete: Cascade
      await prisma.guildConfig.delete({
        where: { guild_id: guild.id },
      });

      Logger.info("Guild data cleanup completed", {
        guildId: guild.id,
        guildName: guild.name,
      });

      const executionTime = Date.now() - startTime;
      Logger.debug("GuildDelete event processed successfully", {
        guildId: guild.id,
        executionTime: `${executionTime}ms`,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      Logger.error("Failed to process guildDelete event", {
        guildId: guild.id,
        guildName: guild.name,
        available: guild.available,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTime: `${executionTime}ms`,
      });
    }
  },
});

/**
 * Update guild analytics for guild leave
 */
async function updateGuildAnalytics(guild: Guild, action: "join" | "leave") {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: {
        guild_id_date_hour: {
          guild_id: guild.id,
          date: today,
          hour: -1,
        },
      },
      update: {
        member_count: guild.memberCount,
        joins: action === "join" ? { increment: 1 } : undefined,
        leaves: action === "leave" ? { increment: 1 } : undefined,
      },
      create: {
        guild_id: guild.id,
        date: today,
        member_count: guild.memberCount,
        joins: action === "join" ? 1 : 0,
        leaves: action === "leave" ? 1 : 0,
      },
    });
  } catch (error) {
    Logger.error("Failed to update guild analytics", {
      guildId: guild.id,
      action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
