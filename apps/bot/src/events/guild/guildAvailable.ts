import type { Guild } from "discord.js";
import { prisma } from "@/index.js";
import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "guildAvailable",
  async execute(_client, guild) {
    const startTime = Date.now();

    try {
      Logger.info("🟢 Guild became available", {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
      });

      // Check if guild exists in database
      const existingGuild = await prisma.guildConfig.findUnique({
        where: { guild_id: guild.id },
        select: {
          id: true,
          created_at: true,
          language: true,
        },
      });

      if (existingGuild) {
        Logger.info("Guild available - existing configuration found", {
          guildId: guild.id,
          configId: existingGuild.id,
          language: existingGuild.language,
          originalJoinDate: existingGuild.created_at,
        });

        // Update last seen timestamp
        await prisma.guildConfig.update({
          where: { guild_id: guild.id },
          data: {
            updated_at: new Date(),
          },
        });
      } else {
        Logger.info(
          "Guild available but no config found - this might be a new guild",
          {
            guildId: guild.id,
            guildName: guild.name,
          },
        );

        // Create basic configuration since guild is available but not in DB
        const guildConfig = await prisma.guildConfig.create({
          data: {
            guild_id: guild.id,
            language: guild.preferredLocale || "en-US",
          },
        });

        Logger.info("New guild configuration created from guildAvailable", {
          guildId: guild.id,
          configId: guildConfig.id,
          language: guildConfig.language,
        });
      }

      // Update analytics
      await updateGuildAnalytics(guild, "available");

      const executionTime = Date.now() - startTime;
      Logger.debug("GuildAvailable event processed successfully", {
        guildId: guild.id,
        executionTime: `${executionTime}ms`,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      Logger.error("Failed to process guildAvailable event", {
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
 * Update guild analytics for guild availability
 */
async function updateGuildAnalytics(
  guild: Guild,
  action: "available" | "unavailable",
) {
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
        // We can track availability events if needed
      },
      create: {
        guild_id: guild.id,
        date: today,
        member_count: guild.memberCount,
        joins: 0,
        leaves: 0,
      },
    });
  } catch (error) {
    Logger.error("Failed to update guild analytics for availability", {
      guildId: guild.id,
      action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
