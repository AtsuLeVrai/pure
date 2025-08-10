import type { APIUser } from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "@/env";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/encryption";

export interface SessionUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export interface AuthResult {
  user: SessionUser | null;
  error?: string;
}

export async function authenticateUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return { user: null, error: "No session found" };
    }

    // Decode JWT to get user ID (JWT only contains user identity, not tokens)
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(sessionCookie.value, env.JWT_SECRET);
    } catch {
      return { user: null, error: "Invalid session token" };
    }

    // Check if JWT is expired
    if (decodedToken.exp && Date.now() / 1000 > decodedToken.exp) {
      return { user: null, error: "Session expired" };
    }

    // Handle both old and new JWT formats during transition
    let userId: string;
    if (decodedToken.userId) {
      // New format - has userId field
      userId = decodedToken.userId;
    } else if (decodedToken.id) {
      // Old format - user data directly in JWT, migrate to new format
      userId = decodedToken.id;

      // For old format, we don't have database session, so create minimal user info
      // This will eventually be replaced when user logs in again with new format
      return {
        user: {
          id: decodedToken.id,
          username: decodedToken.username || "Unknown",
          global_name: decodedToken.global_name || null,
          avatar: decodedToken.avatar || null,
        },
      };
    } else {
      return { user: null, error: "Invalid token format" };
    }

    // Get user and session from database (only for new format)
    const userWithSession = await prisma.user.findUnique({
      where: { id: userId },
      include: { session: true },
    });

    if (!userWithSession) {
      return { user: null, error: "User not found" };
    }

    if (!userWithSession.session) {
      return { user: null, error: "Session not found in database" };
    }

    // Check if database session is expired
    if (userWithSession.session.session_expires_at < new Date()) {
      // Clean up expired session
      await prisma.userSession.delete({
        where: { user_id: userWithSession.id },
      });
      return { user: null, error: "Database session expired" };
    }

    // Update last used timestamp
    await prisma.userSession.update({
      where: { user_id: userWithSession.id },
      data: { last_used_at: new Date() },
    });

    return {
      user: {
        id: userWithSession.id,
        username: userWithSession.username,
        global_name: userWithSession.global_name,
        avatar: userWithSession.avatar,
      },
    };
  } catch {
    return { user: null, error: "Authentication failed" };
  }
}

export async function getDiscordToken(userId: string): Promise<string | null> {
  try {
    // First try to get from database (new format)
    const session = await prisma.userSession.findUnique({
      where: { user_id: userId },
    });

    if (session) {
      // Check if token is expired
      if (session.discord_token_expires_at < new Date()) {
        // Try to refresh the token
        return await refreshDiscordToken(userId);
      }

      // Decrypt and return the access token
      return await decrypt(session.discord_access_token);
    }

    // Fallback: try to get from JWT cookie (old format)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (sessionCookie?.value) {
      try {
        const decodedToken = jwt.verify(
          sessionCookie.value,
          env.JWT_SECRET,
        ) as any;

        // Check if this is old format with access_token
        if (decodedToken.access_token && decodedToken.id === userId) {
          // Check if token is expired
          if (
            decodedToken.token_expires_at &&
            Date.now() / 1000 > decodedToken.token_expires_at
          ) {
            return null; // Token expired, can't refresh from old format
          }

          return decodedToken.access_token;
        }
      } catch {
        // JWT decode failed, ignore
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function refreshDiscordToken(
  userId: string,
): Promise<string | null> {
  try {
    const session = await prisma.userSession.findUnique({
      where: { user_id: userId },
    });

    if (!session?.discord_refresh_token) {
      return null;
    }

    const refreshToken = await decrypt(session.discord_refresh_token);

    // Refresh the Discord token
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      // Refresh token is invalid, remove session
      await prisma.userSession.delete({
        where: { user_id: userId },
      });
      return null;
    }

    const tokenData = await response.json();

    // Encrypt and update tokens in database
    const encryptedAccessToken = await encrypt(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token
      ? await encrypt(tokenData.refresh_token)
      : session.discord_refresh_token;

    await prisma.userSession.update({
      where: { user_id: userId },
      data: {
        discord_access_token: encryptedAccessToken,
        discord_refresh_token: encryptedRefreshToken,
        discord_token_expires_at: new Date(
          Date.now() + tokenData.expires_in * 1000,
        ),
        last_used_at: new Date(),
      },
    });

    return tokenData.access_token;
  } catch {
    return null;
  }
}

export async function createUserSession(
  userData: APIUser,
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
): Promise<string> {
  // Encrypt tokens
  const encryptedAccessToken = await encrypt(accessToken);
  const encryptedRefreshToken = refreshToken
    ? await encrypt(refreshToken)
    : null;

  // Upsert user
  await prisma.user.upsert({
    where: { id: userData.id },
    create: {
      id: userData.id,
      username: userData.username,
      global_name: userData.global_name || null,
      avatar: userData.avatar || null,
    },
    update: {
      username: userData.username,
      global_name: userData.global_name || null,
      avatar: userData.avatar || null,
    },
  });

  // Create or update session
  await prisma.userSession.upsert({
    where: { user_id: userData.id },
    create: {
      user_id: userData.id,
      discord_access_token: encryptedAccessToken,
      discord_refresh_token: encryptedRefreshToken,
      discord_token_expires_at: new Date(Date.now() + expiresIn * 1000),
      session_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    update: {
      discord_access_token: encryptedAccessToken,
      discord_refresh_token: encryptedRefreshToken,
      discord_token_expires_at: new Date(Date.now() + expiresIn * 1000),
      session_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      last_used_at: new Date(),
    },
  });

  // Create JWT token with only user ID (no sensitive data)
  return jwt.sign(
    {
      userId: userData.id,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
    env.JWT_SECRET,
  );
}

export async function destroyUserSession(userId: string): Promise<void> {
  try {
    await prisma.userSession.delete({
      where: { user_id: userId },
    });
  } catch {
    // Session might not exist, ignore error
  }
}
