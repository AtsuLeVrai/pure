import { config as dotenv } from "@dotenvx/dotenvx";
import { ActivityType, Client, GatewayIntentBits, Partials } from "discord.js";
import { z } from "zod";
import { Logger } from "@/utils/index.js";

// Define the schema for environment variables using zod
const dotenvConfig = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
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
const config = dotenv({ debug: process.env.NODE_ENV === "development" });
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
  presence: {
    status: "online",
    activities: [
      {
        name: "/help • Pure Discord Bot",
        type: ActivityType.Playing,
      },
    ],
  },
});

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

    // Login to Discord
    Logger.info("Logging in to Discord...");
    await client.login(env.DISCORD_TOKEN);

    // Log successful login
    Logger.info("Logged in to Discord", {
      id: client.user.id,
      username: client.user.username,
      discriminator: client.user.discriminator,
    });
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
