import { z } from "zod";
import { protectedProcedure } from "../lib/orpc";
import { getDiscordGuild, getDiscordGuilds } from "../utils/discord";

const guildParamsSchema = z.object({
  guildId: z.string(),
});

export const discordRouter = {
  // Get user's Discord guilds (admin only)
  guilds: protectedProcedure.handler(async ({ context }) => {
    try {
      return getDiscordGuilds(context.session.tokens.accessToken);
    } catch (error) {
      console.error("Failed to fetch guilds:", error);
      throw new Error("Failed to fetch guilds");
    }
  }),

  // Get specific guild info
  guild: protectedProcedure
    .input(guildParamsSchema)
    .handler(async ({ input, context }) => {
      try {
        const guild = await getDiscordGuild(
          input.guildId,
          context.session.tokens.accessToken,
        );

        if (!guild) {
          throw new Error("Guild not found or no admin access");
        }

        return guild;
      } catch (error) {
        console.error("Failed to fetch guild:", error);
        throw new Error("Failed to fetch guild");
      }
    }),
} as const;
