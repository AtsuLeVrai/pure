import { DefaultExtractors } from "@discord-player/extractor";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { Player } from "discord-player";
import { config as dotenv } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import { z } from "zod";
import {
  initializeI18n,
  isDev,
  Logger,
  loadModules,
  registerEvents,
} from "@/utils/index.js";

// Define the schema for environment variables using zod
const dotenvConfig = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DATABASE_URL: z.url(),
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
const config = dotenv({ debug: isDev });
export const env = loadConfig(config.parsed);

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
export const player = new Player(client);

// Neon database configuration
neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
neonConfig.poolQueryViaFetch = true;

// Initialize the database connection using Drizzle ORM
const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql);

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  Logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await client.destroy();
    Logger.info("Discord client destroyed successfully");
  } catch (error) {
    Logger.error("Error during client shutdown", { error });
  }

  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("beforeExit", () => gracefulShutdown("beforeExit"));

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
    Logger.info("Starting Discord Bot...");

    // Load modules dynamically
    Logger.info("Loading modules...");
    await loadModules();

    // Initialize i18n system
    Logger.info("Initializing i18n system...");
    await initializeI18n();

    // Register events
    registerEvents(client);

    // Initialize the Player instance
    await player.extractors.loadMulti(DefaultExtractors);

    // Login to Discord
    Logger.info("Logging in to Discord...");
    await client.login(env.DISCORD_TOKEN);

    // Finish client setup
    Logger.info("Setting up Discord client...");
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
