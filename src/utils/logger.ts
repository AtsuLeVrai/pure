import { env } from "@/index.js";

// Logger for structured logging
export const Logger = {
  error(message: string | Error | object, meta?: Record<string, any>): void {
    if (env.NODE_ENV === "production") {
      console.error(
        typeof message === "object" && !(message instanceof Error)
          ? JSON.stringify({ message, ...meta })
          : message instanceof Error
            ? `${message.message}${meta ? ` | ${JSON.stringify(meta)}` : ""}`
            : `${message}${meta ? ` | ${JSON.stringify(meta)}` : ""}`,
      );
    } else {
      console.error(`[ERROR] ${new Date().toISOString()}:`, message, meta);
    }
  },

  debug(message: string | object, meta?: Record<string, any>): void {
    if (env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${new Date().toISOString()}:`, message, meta);
    }
  },

  warn(message: string | object, meta?: Record<string, any>): void {
    if (env.NODE_ENV === "production") {
      console.warn(
        typeof message === "object" && !(message instanceof Error)
          ? JSON.stringify({ message, ...meta })
          : message instanceof Error
            ? `${message.message}${meta ? ` | ${JSON.stringify(meta)}` : ""}`
            : `${message}${meta ? ` | ${JSON.stringify(meta)}` : ""}`,
      );
    } else {
      console.warn(`[WARN] ${new Date().toISOString()}:`, message, meta);
    }
  },
} as const;
