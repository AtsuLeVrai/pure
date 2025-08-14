import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { o, protectedProcedure } from "../lib/orpc";
import {
  exchangeCodeForTokens,
  getDiscordOAuthURL,
  getDiscordUser,
  refreshDiscordTokens,
} from "../utils/discord";
import { signJWT } from "../utils/jwt";

const authCallbackSchema = z.object({
  code: z.string(),
});

export const authRouter = {
  // Get Discord OAuth login URL
  login: o.handler(() => {
    const url = getDiscordOAuthURL();
    return { url };
  }),

  // Handle Discord OAuth callback
  callback: o.input(authCallbackSchema).handler(async ({ input, context }) => {
    try {
      // Exchange code for tokens
      const discordTokens = await exchangeCodeForTokens(input.code);

      // Get user info from Discord
      const discordUser = await getDiscordUser(discordTokens.accessToken);

      // Generate JWT
      const jwtToken = await signJWT({
        userId: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar || undefined,
        discordTokens,
      });

      // Set httpOnly cookie
      setCookie(context.context, "auth-token", jwtToken, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        token: jwtToken,
        user: {
          id: discordUser.id,
          username: discordUser.username,
          avatar: discordUser.avatar,
          discriminator: discordUser.discriminator || "0000",
        },
      };
    } catch (error) {
      console.error("Auth callback error:", error);
      throw new Error("Authentication failed");
    }
  }),

  // Get current user from JWT
  me: protectedProcedure.handler(async ({ context }) => {
    // If token was refreshed, set new cookie
    if (context.context.get("tokenRefreshed")) {
      const newToken = await signJWT({
        userId: context.session.user.id,
        username: context.session.user.username,
        avatar: context.session.user.avatar || undefined,
        discordTokens: context.session.tokens,
      });

      setCookie(context.context, "auth-token", newToken, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return context.session.user;
  }),

  // Refresh JWT token
  refresh: protectedProcedure.handler(async ({ context }) => {
    try {
      // Force refresh Discord tokens
      const refreshedTokens = await refreshDiscordTokens(
        context.session.tokens.refreshToken,
      );

      // Generate new JWT
      const newToken = await signJWT({
        userId: context.session.user.id,
        username: context.session.user.username,
        avatar: context.session.user.avatar || undefined,
        discordTokens: refreshedTokens,
      });

      // Set new cookie
      setCookie(context.context, "auth-token", newToken, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return { token: newToken };
    } catch (error) {
      console.error("Token refresh error:", error);
      throw new Error("Token refresh failed");
    }
  }),

  // Logout - clear cookie
  logout: o.handler(async ({ context }) => {
    deleteCookie(context.context, "auth-token");

    return { success: true };
  }),
} as const;
