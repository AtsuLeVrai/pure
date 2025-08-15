import {
  analytics,
  guildConfigs,
  tickets,
  userEconomy,
  userMetrics,
  warnings,
} from "@pure/database";
import type { Guild } from "discord.js";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/index.js";
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
      const guildConfig = await db
        .select({
          id: guildConfigs.id,
          createdAt: guildConfigs.createdAt,
        })
        .from(guildConfigs)
        .where(eq(guildConfigs.guildId, guild.id))
        .limit(1)
        .then((rows) => rows[0] || null);

      if (!guildConfig) {
        Logger.warn("Guild left but no configuration found in database", {
          guildId: guild.id,
          guildName: guild.name,
        });
        return;
      }

      // Get counts for related data (equivalent to _count in Prisma)
      const [warningsCount, userMetricsCount, userEconomyCount, ticketsCount] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(warnings)
            .where(eq(warnings.guildId, guild.id)),
          db
            .select({ count: count() })
            .from(userMetrics)
            .where(eq(userMetrics.guildId, guild.id)),
          db
            .select({ count: count() })
            .from(userEconomy)
            .where(eq(userEconomy.guildId, guild.id)),
          db
            .select({ count: count() })
            .from(tickets)
            .where(eq(tickets.guildId, guild.id)),
        ]);

      const guildConfigWithCounts = {
        ...guildConfig,
        _count: {
          warnings: warningsCount[0]?.count || 0,
          user_metrics: userMetricsCount[0]?.count || 0,
          user_economy: userEconomyCount[0]?.count || 0,
          tickets: ticketsCount[0]?.count || 0,
        },
      };

      // If guild is unavailable (outage), don't delete data immediately
      if (!guild.available) {
        Logger.warn("Guild became unavailable - preserving data", {
          guildId: guild.id,
          guildName: guild.name,
          configAge: Date.now() - guildConfigWithCounts.createdAt.getTime(),
        });

        return;
      }

      // Update analytics before deletion
      await updateGuildAnalytics(guild, "leave");

      Logger.info("Performing guild data cleanup", {
        guildId: guild.id,
        guildName: guild.name,
      });

      // Perform cascading cleanup
      await db.transaction(async (tx) => {
        // Delete related data first (if no CASCADE set up in DB)
        await tx.delete(warnings).where(eq(warnings.guildId, guild.id));
        await tx.delete(userMetrics).where(eq(userMetrics.guildId, guild.id));
        await tx.delete(userEconomy).where(eq(userEconomy.guildId, guild.id));
        await tx.delete(tickets).where(eq(tickets.guildId, guild.id));

        // Delete main guild config
        await tx.delete(guildConfigs).where(eq(guildConfigs.guildId, guild.id));
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

    await db
      .insert(analytics)
      .values({
        guildId: guild.id,
        date: today,
        hour: -1,
        memberCount: guild.memberCount,
        joins: action === "join" ? 1 : 0,
        leaves: action === "leave" ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [analytics.guildId, analytics.date, analytics.hour],
        set: {
          memberCount: guild.memberCount,
          joins:
            action === "join"
              ? sql`${analytics.joins} + 1`
              : sql`${analytics.joins}`,
          leaves:
            action === "leave"
              ? sql`${analytics.leaves} + 1`
              : sql`${analytics.leaves}`,
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
