import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { AuthSession } from "@/types/auth";
import { refreshDiscordTokens } from "@/utils/discord";
import { isDiscordTokenExpired, verifyJWT } from "@/utils/jwt";

export async function jwtMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const cookieToken = getCookie(c, "session");
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) {
    c.set("session", null);
    await next();
    return;
  }

  try {
    const payload = await verifyJWT(token);

    if (!payload) {
      c.set("session", null);
      await next();
      return;
    }

    // Check if Discord token needs refresh
    if (isDiscordTokenExpired(payload.discordTokens.expiresAt)) {
      try {
        const refreshedTokens = await refreshDiscordTokens(
          payload.discordTokens.refreshToken,
        );

        // Update session with new tokens
        const session: AuthSession = {
          user: {
            id: payload.userId,
            username: payload.username,
            avatar: payload.avatar || null,
            discriminator: "0000", // Modern Discord doesn't use discriminators
          },
          tokens: refreshedTokens,
        };

        c.set("session", session);
        c.set("tokenRefreshed", true);
      } catch (_error) {
        // Refresh failed, session is invalid
        c.set("session", null);
      }
    } else {
      // Token is still valid
      const session: AuthSession = {
        user: {
          id: payload.userId,
          username: payload.username,
          avatar: payload.avatar || null,
          discriminator: "0000",
        },
        tokens: payload.discordTokens,
      };

      c.set("session", session);
    }
  } catch (_error) {
    c.set("session", null);
  }

  await next();
}

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const session = c.get("session") as AuthSession | null;

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  };
}
