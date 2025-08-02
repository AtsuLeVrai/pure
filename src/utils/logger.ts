import path from "node:path";
import winston from "winston";
import { isDev, isProd } from "@/utils/registry.js";

// Define custom log levels and colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    verbose: "grey",
    debug: "blue",
    silly: "rainbow",
  },
} as const;

// Add colors to winston
winston.addColors(logLevels.colors);

// Custom format for console (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Handle different message types
    let msg = message;
    if (typeof message === "object") {
      msg = JSON.stringify(message, null, 2);
    }

    // Add metadata if present
    const metaStr =
      Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : "";

    // Handle stack traces
    const stackStr = stack ? `\n${stack}` : "";

    return `${timestamp} [${level}]: ${msg}${metaStr}${stackStr}`;
  }),
);

// Custom format for files (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Logs directory
const logsDir = path.join(process.cwd(), "logs");

// Create transports based on environment
function createTransports(): winston.transport[] {
  const transports: winston.transport[] = [];

  if (isDev) {
    // Console transport for development
    transports.push(
      new winston.transports.Console({
        level: "debug",
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
      }),
    );
  }

  if (isProd || isDev) {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        format: fileFormat,
        handleExceptions: true,
        handleRejections: true,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5,
        tailable: true,
      }),
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "combined.log"),
        level: isDev ? "debug" : "info",
        format: fileFormat,
        maxsize: 100 * 1024 * 1024, // 100MB
        maxFiles: 10,
        tailable: true,
      }),
    );

    // HTTP requests log
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "http.log"),
        level: "http",
        format: fileFormat,
        maxsize: 25 * 1024 * 1024, // 25MB
        maxFiles: 3,
        tailable: true,
      }),
    );
  }

  return transports;
}

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  level: isDev ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  transports: createTransports(),
  exitOnError: false,
});

// Function to wrap messages for consistent formatting
function messageWrapper(message: string | Error | object): string {
  if (message instanceof Error) {
    return message.stack || message.message;
  }

  if (typeof message === "object") {
    return JSON.stringify(message, null, 2);
  }

  return message;
}

// Add custom log levels to the logger
export const Logger = {
  error(message: string | Error | object, meta?: Record<string, any>): void {
    logger.error(messageWrapper(message), meta);
  },

  warn(message: string | object, meta?: Record<string, any>): void {
    logger.warn(messageWrapper(message), meta);
  },

  info(message: string | object, meta?: Record<string, any>): void {
    logger.info(messageWrapper(message), meta);
  },

  http(message: string | object, meta?: Record<string, any>): void {
    logger.http(messageWrapper(message), meta);
  },

  verbose(message: string | object, meta?: Record<string, any>): void {
    logger.verbose(messageWrapper(message), meta);
  },

  debug(message: string | object, meta?: Record<string, any>): void {
    logger.debug(messageWrapper(message), meta);
  },
} as const;
