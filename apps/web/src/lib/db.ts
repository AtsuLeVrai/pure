import { PrismaClient } from "@pure/database";
import { env } from "@/env";
import { logger } from "@/lib/logger";

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error", "warn"],
});

prisma.$on("query", (event) => {
  logger.database("query", true, {
    duration: event.duration,
    metadata: {
      query: event.query,
      params: event.params,
    },
  });
});

prisma.$on("error", (event) => {
  logger.database("error", false, {
    error: event.message,
    metadata: {
      target: event.target,
    },
  });
});
