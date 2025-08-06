import type {
  APIGuild,
  APIUser,
  RESTGetAPICurrentUserGuildsResult,
  RESTGetAPIGuildMemberResult,
  RESTGetAPIGuildResult,
} from "discord-api-types/v10";

const baseUrl = "https://discord.com/api/v10";
const rateLimitMap = new Map<
  string,
  { resetTime: number; remaining: number }
>();
const cache = new Map<string, { data: any; expires: number }>();

interface RateLimitData {
  resetTime: number;
  remaining: number;
}

// Check if an endpoint is rate limited
function isRateLimited(endpoint: string): boolean {
  const rateLimitData = rateLimitMap.get(endpoint);
  if (!rateLimitData) return false;

  if (Date.now() >= rateLimitData.resetTime) {
    rateLimitMap.delete(endpoint);
    return false;
  }

  return rateLimitData.remaining <= 0;
}

// Get cached data if still valid
function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() >= cached.expires) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

// Set cached data with expiration
function setCachedData<T>(key: string, data: T, ttlMs = 30000): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
}

// Sleep function for exponential backoff
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Handle the response from Discord API
async function handleResponse<T>(
  response: Response,
  endpoint: string,
): Promise<T> {
  // Update rate limit info from headers
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  const retryAfter = response.headers.get("retry-after");

  if (remaining && reset) {
    rateLimitMap.set(endpoint, {
      remaining: parseInt(remaining),
      resetTime: parseInt(reset) * 1000,
    });
  }

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
    rateLimitMap.set(endpoint, {
      remaining: 0,
      resetTime: Date.now() + retryAfterMs,
    });
    throw new Error(
      `Rate limited on ${endpoint}. Retry after ${Math.ceil(retryAfterMs / 1000)}s`,
    );
  }

  // Handle other errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Make a request to the Discord API with error handling, rate limiting, and exponential backoff
async function makeRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
  retryCount = 0,
  maxRetries = 3,
): Promise<T> {
  // Check cache first
  const cacheKey = `${endpoint}:${accessToken}`;
  const cached = getCachedData<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if we're rate limited
  if (isRateLimited(endpoint)) {
    if (retryCount >= maxRetries) {
      throw new Error(`Rate limited for endpoint: ${endpoint}`);
    }

    // Exponential backoff: 2^retryCount * 1000ms + jitter
    const backoffMs = 2 ** retryCount * 1000 + Math.random() * 1000;
    await sleep(backoffMs);

    return makeRequest(
      endpoint,
      accessToken,
      options,
      retryCount + 1,
      maxRetries,
    );
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Pure Bot (https://github.com/AtsuLeVrai/pure, 1.0.0)",
        ...options.headers,
      },
    });

    const data = await handleResponse<T>(response, endpoint);

    // Cache successful responses for 30 seconds
    setCachedData(cacheKey, data, 30000);

    return data;
  } catch (error) {
    // If rate limited and we have retries left, try again with exponential backoff
    if (
      error instanceof Error &&
      error.message.includes("Rate limited") &&
      retryCount < maxRetries
    ) {
      const backoffMs = 2 ** retryCount * 1000 + Math.random() * 1000;
      await sleep(backoffMs);
      return makeRequest(
        endpoint,
        accessToken,
        options,
        retryCount + 1,
        maxRetries,
      );
    }

    throw error;
  }
}

// Get bot guilds to check presence
async function getBotGuilds(): Promise<APIGuild[]> {
  // This would require the bot token to be available
  // For now, return empty array - this should be implemented with bot token
  return [];
}

/**
 * Enhanced guild interface with bot presence
 */
export interface EnhancedGuild extends APIGuild {
  botInGuild: boolean;
  memberCount: number;
}

/**
 * Utility functions for Discord data processing
 */
export const DiscordUtils = {
  /**
   * Get current user information
   */
  async getCurrentUser(accessToken: string): Promise<APIUser> {
    return makeRequest<APIUser>("/users/@me", accessToken);
  },

  /**
   * Get user's guilds with bot presence information
   */
  async getUserGuilds(accessToken: string): Promise<EnhancedGuild[]> {
    const cacheKey = `user-guilds:${accessToken}`;
    const cached = getCachedData<EnhancedGuild[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const guilds = await makeRequest<RESTGetAPICurrentUserGuildsResult>(
      "/users/@me/guilds",
      accessToken,
    );

    // Get bot guilds to check presence
    const botGuilds = await getBotGuilds();
    const botGuildIds = new Set(botGuilds.map((g) => g.id));

    const enhancedGuilds = guilds.map(
      (guild) =>
        ({
          ...guild,
          botInGuild: botGuildIds.has(guild.id),
          memberCount: guild.approximate_member_count || 0,
        }) as EnhancedGuild,
    );

    // Cache for 60 seconds
    setCachedData(cacheKey, enhancedGuilds, 60000);

    return enhancedGuilds;
  },

  /**
   * Get detailed guild information using user's access token
   */
  async getGuild(
    guildId: string,
    accessToken: string,
  ): Promise<RESTGetAPIGuildResult> {
    return makeRequest<RESTGetAPIGuildResult>(
      `/guilds/${guildId}`,
      accessToken,
    );
  },

  /**
   * Get guild member information using user's access token
   */
  async getGuildMember(
    guildId: string,
    userId: string,
    accessToken: string,
  ): Promise<RESTGetAPIGuildMemberResult> {
    return makeRequest<RESTGetAPIGuildMemberResult>(
      `/guilds/${guildId}/members/${userId}`,
      accessToken,
    );
  },

  /**
   * Check if user has administrative permissions in guild
   */
  async userHasAdminPermissions(
    guildId: string,
    userId: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      const member = await this.getGuildMember(guildId, userId, accessToken);

      // Check if user has administrator permission (bit 3)
      const adminPermission = BigInt("0x8"); // ADMINISTRATOR

      // If member has roles, we'd need to fetch role permissions
      // For now, this is a simplified check
      return "permissions" in member &&
        typeof member.permissions === "bigint" &&
        member.permissions
        ? (BigInt(member.permissions) & adminPermission) === adminPermission
        : false;
    } catch {
      return false;
    }
  },

  /**
   * Get user's manageable guilds (where they have admin permissions)
   */
  async getManageableGuilds(
    accessToken: string,
    userId: string,
  ): Promise<EnhancedGuild[]> {
    const cacheKey = `manageable-guilds:${userId}:${accessToken}`;
    const cached = getCachedData<EnhancedGuild[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const guilds = await this.getUserGuilds(accessToken);

    // Filter guilds based on permissions from the guild data itself
    // Check for ADMINISTRATOR (0x8) or MANAGE_GUILD (0x20) permissions
    const manageableGuilds = guilds.filter((guild) => {
      if (!guild.permissions) return false;

      const permissions = BigInt(guild.permissions);
      const adminPermission = BigInt("0x8"); // ADMINISTRATOR
      const manageGuildPermission = BigInt("0x20"); // MANAGE_GUILD

      return (
        (permissions & adminPermission) === adminPermission ||
        (permissions & manageGuildPermission) === manageGuildPermission
      );
    });

    // Cache for 60 seconds since permissions don't change frequently
    setCachedData(cacheKey, manageableGuilds, 60000);

    return manageableGuilds;
  },

  /**
   * Get guild with enhanced information
   */
  async getEnhancedGuild(
    guildId: string,
    userId: string,
    accessToken: string,
  ): Promise<EnhancedGuild | null> {
    try {
      const [guild, hasPermissions] = await Promise.all([
        this.getGuild(guildId, accessToken),
        this.userHasAdminPermissions(guildId, userId, accessToken),
      ]);

      if (!hasPermissions) {
        return null;
      }

      return {
        ...guild,
        botInGuild: true, // If we can fetch it, bot is likely present
        memberCount: guild.approximate_member_count || 0,
      };
    } catch {
      return null;
    }
  },
} as const;
