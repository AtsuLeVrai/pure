import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schemas",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
