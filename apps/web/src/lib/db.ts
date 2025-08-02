import { PrismaClient } from "@pure/database";
import { env } from "@/env";

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error", "warn"],
});

prisma.$on("query", (event) => {
  if (env.NODE_ENV === "development") {
    console.log(`Query: ${event.query}`);
    console.log(`Params: ${event.params}`);
    console.log(`Duration: ${event.duration}ms`);
  }
});
