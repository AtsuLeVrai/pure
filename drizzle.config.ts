import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schemas",
  out: "./src/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "pure.sqlite",
  },
  verbose: true,
  strict: true,
});
