import { PrismaClient } from "@pure/database";
import { env } from "@/env";

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error", "warn"],
});
