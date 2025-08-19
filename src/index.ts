import { neon, neonConfig } from "@neondatabase/serverless";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { Player } from "discord-player";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import { z } from "zod";
import { initializeI18n } from "@/utils/i18n.js";
import { Logger } from "@/utils/logger.js";
import {
  loadModules,
  registerEvents,
  registerPlayerEvents,
} from "@/utils/registry.js";

// Define the schema for environment variables using zod
const dotenvConfig = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DATABASE_URL: z.url(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

// Export the type for the environment variables
export type DotenvConfig = z.infer<typeof dotenvConfig>;

// Function to load and validate the environment variables
function loadConfig(config: unknown): DotenvConfig {
  const parsed = dotenvConfig.safeParse(config);
  if (!parsed.success) {
    Logger.error("Invalid environment variables", {
      error: z.treeifyError(parsed.error),
    });
    process.exit(1);
  }

  return parsed.data;
}

// Load environment variables from .env file
export const env = loadConfig(process.env);

// Initialize the Discord client
const client = new Client<true>({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.GuildMessagePolls,
    GatewayIntentBits.DirectMessagePolls,
  ],
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.ThreadMember,
    Partials.SoundboardSound,
  ],
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: false,
  },
});

// Import the Player class for music functionality
// @ts-expect-error - The `client` type is not compatible with the Player constructor (it expects a Client<boolean> type)
export const player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25, // 32MB buffer
    requestOptions: {
      timeout: 10000, // 10 second timeout
    },
  },
  skipFFmpeg: false,
  connectionTimeout: 20000, // 20 second connection timeout
  useLegacyFFmpeg: false,
  smoothVolume: true, // Smooth volume transitions
});

// Neon database configuration
neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
neonConfig.poolQueryViaFetch = true;

// Initialize the database connection using Drizzle ORM
const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql);

// Graceful shutdown
async function gracefulShutdown() {
  try {
    await client.destroy();
  } catch (error) {
    Logger.error("Error during client shutdown", { error });
  }

  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown());
process.on("SIGTERM", () => gracefulShutdown());
process.on("beforeExit", () => gracefulShutdown());

// Global error handling
process.on("unhandledRejection", (reason, promise) => {
  Logger.error("Unhandled Promise Rejection", {
    reason:
      reason instanceof Error
        ? {
            message: reason.message,
            stack: reason.stack,
          }
        : reason,
    promise: promise.toString(),
  });
});

process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception", {
    error: {
      message: error.message,
      stack: error.stack,
    },
  });

  // Give time for logs to flush
  setTimeout(() => process.exit(1), 1000);
});

// Main function to start the bot
async function main(): Promise<void> {
  try {
    // Load modules dynamically
    await loadModules();

    // Initialize i18n system
    await initializeI18n();

    // Register events
    registerEvents(client);
    registerPlayerEvents(client);

    // Login to Discord
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    Logger.error("Failed to start bot", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    process.exit(1);
  }
}

// Start the bot
main().catch((error) => {
  Logger.error("Unhandled error in main function", {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : error,
  });

  process.exit(1);
});
