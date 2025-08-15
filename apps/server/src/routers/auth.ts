import { ORPCError } from "@orpc/server";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { o } from "@/lib/orpc";
import {
  exchangeCodeForTokens,
  getDiscordOAuthURL,
  getDiscordUser,
  refreshDiscordTokens,
} from "@/utils/discord";
import { signJWT } from "@/utils/jwt";

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
      const cookieOptions = {
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      };

      if (process.env.NODE_ENV === "production") {
        Object.assign(cookieOptions, {
          httpOnly: true,
          sameSite: "Strict" as const,
          secure: true,
        });
      } else {
        Object.assign(cookieOptions, {
          httpOnly: false,
          sameSite: "Lax" as const,
          secure: false,
        });
      }

      setCookie(context.context, "session", jwtToken, cookieOptions);

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

  // Check authentication status (lightweight)
  status: o.input(z.object({})).handler(async ({ context }) => {
    return {
      isAuthenticated: !!context.session?.user,
    };
  }),

  // Get current user from JWT
  me: o.input(z.object({})).handler(async ({ context }) => {
    if (!context.session?.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active session found",
      });
    }

    return {
      id: context.session.user.id,
      username: context.session.user.username,
      avatar: context.session.user.avatar,
      discriminator: context.session.user.discriminator,
    };
  }),

  // Refresh JWT token
  refresh: o.handler(async ({ context }) => {
    if (!context.session?.tokens?.refreshToken) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No refresh token available",
      });
    }

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
      const cookieOptions = {
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      };

      if (process.env.NODE_ENV === "production") {
        Object.assign(cookieOptions, {
          httpOnly: true,
          sameSite: "Strict" as const,
          secure: true,
        });
      } else {
        Object.assign(cookieOptions, {
          httpOnly: false,
          sameSite: "Lax" as const,
          secure: false,
        });
      }

      setCookie(context.context, "session", newToken, cookieOptions);

      return { token: newToken };
    } catch (error) {
      console.error("Token refresh error:", error);
      throw new Error("Token refresh failed");
    }
  }),

  // Logout - clear cookie
  logout: o.handler(async ({ context }) => {
    deleteCookie(context.context, "session");

    return { success: true };
  }),
} as const;
