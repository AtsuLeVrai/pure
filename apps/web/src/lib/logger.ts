import pino from "pino";
import { env } from "@/env";

/**
 * Enterprise-grade structured logging system
 */
export type LogContext = {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  guildId?: string;
  action?: string;
  duration?: number;
  error?: Error | string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional custom fields
};

/**
 * Log levels for different environments
 */
const LOG_LEVELS = {
  development: "debug",
  production: "info",
  test: "warn",
} as const;

/**
 * Create Pino logger instance with appropriate configuration
 */
const createLogger = () => {
  const isDevelopment = env.NODE_ENV === "development";

  if (isDevelopment) {
    // Use console.log in development to avoid pino-pretty worker thread issues
    return {
      level: LOG_LEVELS[env.NODE_ENV],
      info: (obj: any, msg?: string) => console.log(`[INFO] ${msg || ""}`, obj),
      warn: (obj: any, msg?: string) =>
        console.warn(`[WARN] ${msg || ""}`, obj),
      error: (obj: any, msg?: string) =>
        console.error(`[ERROR] ${msg || ""}`, obj),
      debug: (obj: any, msg?: string) =>
        console.log(`[DEBUG] ${msg || ""}`, obj),
      child: (_bindings: any) => createLogger(),
    } as any;
  }

  return pino({
    level: LOG_LEVELS[env.NODE_ENV],
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
};

/**
 * Main logger instance
 */
const baseLogger = createLogger();

/**
 * Enhanced logger with context and structured logging
 */
export class Logger {
  private logger: pino.Logger;

  constructor(context?: Record<string, unknown>) {
    this.logger = context ? baseLogger.child(context) : baseLogger;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    return new Logger({ ...context });
  }

  /**
   * Log info message with context
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(context, message);
  }

  /**
   * Log warning message with context
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(context, message);
  }

  /**
   * Log error message with context
   */
  error(message: string, context?: LogContext): void {
    const { error, ...rest } = context || {};

    if (error instanceof Error) {
      this.logger.error(
        {
          ...rest,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
        message,
      );
    } else if (typeof error === "string") {
      this.logger.error({ ...rest, error }, message);
    } else {
      this.logger.error(rest, message);
    }
  }

  /**
   * Log debug message with context (only in development)
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(context, message);
  }

  /**
   * Log authentication events
   */
  auth(
    event: "login" | "logout" | "refresh" | "failed",
    context: LogContext,
  ): void {
    this.info(`Authentication ${event}`, {
      ...context,
      action: `auth.${event}`,
    });
  }

  /**
   * Log API requests with performance metrics
   */
  apiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    context?: LogContext,
  ): void {
    const level = statusCode >= 400 ? "warn" : "info";

    this.logger[level](
      {
        ...context,
        action: "api.request",
        method,
        endpoint,
        statusCode,
      },
      `${method} ${endpoint} - ${statusCode}`,
    );
  }

  /**
   * Log Discord API interactions
   */
  discordAPI(
    operation: string,
    success: boolean,
    context?: LogContext & { guildId?: string; endpoint?: string },
  ): void {
    const level = success ? "info" : "warn";

    this.logger[level](
      {
        ...context,
        action: "discord.api",
        operation,
        success,
      },
      `Discord API ${operation} ${success ? "succeeded" : "failed"}`,
    );
  }

  /**
   * Log security events
   */
  security(
    event:
      | "rate_limit"
      | "invalid_token"
      | "unauthorized_access"
      | "csrf_attempt",
    context: LogContext,
  ): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      action: `security.${event}`,
    });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      action: "performance",
      operation,
      duration,
    });
  }

  /**
   * Log database operations
   */
  database(operation: string, success: boolean, context?: LogContext): void {
    const level = success ? "debug" : "error";

    this.logger[level](
      {
        ...context,
        action: "database",
        operation,
        success,
      },
      `Database ${operation} ${success ? "succeeded" : "failed"}`,
    );
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  service: "pure-web",
  version: process.env.npm_package_version || "unknown",
});

/**
 * Request logger for Next.js middleware
 */
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

/**
 * User-scoped logger
 */
export const createUserLogger = (userId: string) => {
  return logger.child({ userId });
};

/**
 * Guild-scoped logger
 */
export const createGuildLogger = (guildId: string) => {
  return logger.child({ guildId });
};
