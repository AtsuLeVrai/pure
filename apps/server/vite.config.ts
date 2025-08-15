import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

function generateSecretKey(length = 32): string {
  if (length <= 0) {
    throw new Error("Key length must be positive");
  }

  return randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64")
    .slice(0, length)
    .replace(/[+/]/g, (char) => (char === "+" ? "-" : "_"));
}

export default defineConfig({
  test: {
    environment: "node",
    env: {
      JWT_SECRET: generateSecretKey(),
      ENCRYPTION_SECRET: generateSecretKey(),
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
