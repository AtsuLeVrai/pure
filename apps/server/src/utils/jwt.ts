import { sign, verify } from "hono/jwt";
import type { DiscordTokens, JWTPayload } from "../types/auth";
import { decrypt, encrypt } from "./encryption";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-here";
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

if (!process.env.JWT_SECRET) {
  console.warn(
    "JWT_SECRET not set. Using default secret for development only!",
  );
}

export async function signJWT(payload: {
  userId: string;
  username: string;
  avatar?: string;
  discordTokens: DiscordTokens;
}): Promise<string> {
  const encryptedTokens = {
    accessToken: encrypt(payload.discordTokens.accessToken),
    refreshToken: encrypt(payload.discordTokens.refreshToken),
    expiresAt: payload.discordTokens.expiresAt,
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload: JWTPayload = {
    userId: payload.userId,
    username: payload.username,
    avatar: payload.avatar,
    discordTokens: encryptedTokens,
    iat: now,
    exp: now + JWT_EXPIRES_IN,
  };

  return await sign(jwtPayload, JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = await verify(token, JWT_SECRET);

    // Vérifier que le payload a la structure attendue
    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.username !== "string" ||
      !decoded.discordTokens ||
      typeof decoded.discordTokens !== "object" ||
      typeof decoded.discordTokens.accessToken !== "string" ||
      typeof decoded.discordTokens.refreshToken !== "string" ||
      typeof decoded.discordTokens.expiresAt !== "number"
    ) {
      return null;
    }

    const typedDecoded = decoded as JWTPayload;
    const decryptedTokens = {
      accessToken: decrypt(typedDecoded.discordTokens.accessToken),
      refreshToken: decrypt(typedDecoded.discordTokens.refreshToken),
      expiresAt: typedDecoded.discordTokens.expiresAt,
    };

    return {
      ...typedDecoded,
      discordTokens: decryptedTokens,
    };
  } catch (_error) {
    return null;
  }
}

export function isDiscordTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}
