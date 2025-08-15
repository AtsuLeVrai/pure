import { describe, expect, it } from "vitest";
import type { DiscordTokens } from "@/types/auth";
import { isDiscordTokenExpired, signJWT, verifyJWT } from "./jwt";

describe("JWT Utils", () => {
  const mockDiscordTokens: DiscordTokens = {
    accessToken: "discord_access_token_123",
    refreshToken: "discord_refresh_token_456",
    expiresAt: Date.now() + 3600000, // 1 hour from now
  };

  const mockPayload = {
    userId: "123456789",
    username: "testuser",
    avatar: "avatar_hash",
    discordTokens: mockDiscordTokens,
  };

  describe("signJWT", () => {
    it("should create a valid JWT token", async () => {
      const token = await signJWT(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should handle payload without avatar", async () => {
      const payloadWithoutAvatar = {
        userId: "123456789",
        username: "testuser",
        discordTokens: mockDiscordTokens,
      };

      const token = await signJWT(payloadWithoutAvatar);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

  describe("verifyJWT", () => {
    it("should verify and decode a valid JWT token", async () => {
      const token = await signJWT(mockPayload);
      const decoded = await verifyJWT(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
      expect(decoded?.avatar).toBe(mockPayload.avatar);
      expect(decoded?.discordTokens.accessToken).toBe(
        mockDiscordTokens.accessToken,
      );
      expect(decoded?.discordTokens.refreshToken).toBe(
        mockDiscordTokens.refreshToken,
      );
      expect(decoded?.discordTokens.expiresAt).toBe(
        mockDiscordTokens.expiresAt,
      );
    });

    it("should return null for invalid token", async () => {
      const invalidToken = "invalid.jwt.token";
      const decoded = await verifyJWT(invalidToken);

      expect(decoded).toBeNull();
    });

    it("should return null for empty token", async () => {
      const decoded = await verifyJWT("");

      expect(decoded).toBeNull();
    });

    it("should verify token created without avatar", async () => {
      const payloadWithoutAvatar = {
        userId: "123456789",
        username: "testuser",
        discordTokens: mockDiscordTokens,
      };

      const token = await signJWT(payloadWithoutAvatar);
      const decoded = await verifyJWT(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payloadWithoutAvatar.userId);
      expect(decoded?.username).toBe(payloadWithoutAvatar.username);
      expect(decoded?.avatar).toBeUndefined();
    });
  });

  describe("isDiscordTokenExpired", () => {
    it("should return false for future expiration time", () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      const isExpired = isDiscordTokenExpired(futureTime);

      expect(isExpired).toBe(false);
    });

    it("should return true for past expiration time", () => {
      const pastTime = Date.now() - 3600000; // 1 hour ago
      const isExpired = isDiscordTokenExpired(pastTime);

      expect(isExpired).toBe(true);
    });

    it("should return true for current time", () => {
      const currentTime = Date.now();
      const isExpired = isDiscordTokenExpired(currentTime);

      expect(isExpired).toBe(true);
    });
  });

  describe("JWT round-trip", () => {
    it("should maintain data integrity through sign and verify", async () => {
      const token = await signJWT(mockPayload);
      const decoded = await verifyJWT(token);

      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
      expect(decoded?.avatar).toBe(mockPayload.avatar);
      expect(decoded?.discordTokens.accessToken).toBe(
        mockPayload.discordTokens.accessToken,
      );
      expect(decoded?.discordTokens.refreshToken).toBe(
        mockPayload.discordTokens.refreshToken,
      );
      expect(decoded?.discordTokens.expiresAt).toBe(
        mockPayload.discordTokens.expiresAt,
      );
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });
  });
});
