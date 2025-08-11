import type { Guild } from "discord.js";
import { prisma } from "@/index.js";
import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "guildCreate",
  async execute(_client, guild) {
    const startTime = Date.now();

    try {
      Logger.info("Guild joined", {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
      });

      // Check if guild already exists in database
      const existingGuild = await prisma.guildConfig.findUnique({
        where: { guild_id: guild.id },
        select: { id: true, created_at: true },
      });

      if (existingGuild) {
        Logger.info("Guild rejoined - existing configuration found", {
          guildId: guild.id,
          configId: existingGuild.id,
          originalJoinDate: existingGuild.created_at,
        });

        // Update guild info without overriding existing settings
        await prisma.guildConfig.update({
          where: { guild_id: guild.id },
          data: {
            updated_at: new Date(),
          },
        });
      } else {
        // Create new guild configuration with defaults
        const guildConfig = await prisma.guildConfig.create({
          data: {
            guild_id: guild.id,
            language: guild.preferredLocale || "en-US",
          },
          include: {
            event_log_configs: {
              select: { category: true, enabled: true },
            },
          },
        });

        Logger.info("New guild configuration created", {
          guildId: guild.id,
          configId: guildConfig.id,
          language: guildConfig.language,
          eventConfigsCreated: guildConfig.event_log_configs.length,
        });
      }

      // Update analytics
      await updateGuildAnalytics(guild, "join");

      const executionTime = Date.now() - startTime;
      Logger.debug("GuildCreate event processed successfully", {
        guildId: guild.id,
        executionTime: `${executionTime}ms`,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      Logger.error("Failed to process guildCreate event", {
        guildId: guild.id,
        guildName: guild.name,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTime: `${executionTime}ms`,
      });
    }
  },
});

/**
 * Update guild analytics for guild join
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
