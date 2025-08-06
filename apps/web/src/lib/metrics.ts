import { env } from "@/env";
import { logger } from "@/lib/logger";

const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

/**
 * Metric types for different measurements
 */
export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

/**
 * Counter metric for incrementing values
 */
export interface Counter extends Omit<Metric, "value"> {
  increment: (value?: number) => void;
  get: () => number;
}

/**
 * Histogram metric for duration measurements
 */
export interface Histogram extends Omit<Metric, "value"> {
  observe: (value: number) => void;
  summary: () => {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  };
}

// Utility function to generate a unique key for metrics based on name and labels
function generateKey(name: string, labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) {
    return name;
  }

  const labelString = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${value}"`)
    .join(",");

  return `${name}{${labelString}}`;
}

/**
 * In-memory metrics store
 * In production, this should be replaced with Prometheus/OpenTelemetry
 */
export const MetricsStore = {
  getCounter(name: string, labels?: Record<string, string>): Counter {
    const key = generateKey(name, labels);

    return {
      name,
      labels,
      increment: (value = 1) => {
        const current = counters.get(key) || 0;
        counters.set(key, current + value);

        // Log metric update in development
        if (env.NODE_ENV === "development") {
          logger.debug("Counter incremented", {
            metric: name,
            value: current + value,
            labels,
          });
        }
      },
      get: () => counters.get(key) || 0,
    };
  },

  getHistogram(name: string, labels?: Record<string, string>): Histogram {
    const key = generateKey(name, labels);

    return {
      name,
      labels,
      observe: (value: number) => {
        const current = histograms.get(key) || [];
        current.push(value);
        histograms.set(key, current);

        // Log metric update in development
        if (env.NODE_ENV === "development") {
          logger.debug("Histogram observed", {
            metric: name,
            value,
            labels,
          });
        }
      },
      summary: () => {
        const values = histograms.get(key) || [];

        if (values.length === 0) {
          return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
        }

        const sum = values.reduce((a, b) => a + b, 0);
        const count = values.length;
        const avg = sum / count;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { count, sum, avg, min, max };
      },
    };
  },

  /**
   * Get all metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Counters
    for (const [key, value] of counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Histograms
    for (const [key, _values] of histograms.entries()) {
      const summary = this.getHistogram(key.split("{")[0]).summary();
      lines.push(`${key}_count ${summary.count}`);
      lines.push(`${key}_sum ${summary.sum}`);
      lines.push(`${key}_avg ${summary.avg}`);
      lines.push(`${key}_min ${summary.min}`);
      lines.push(`${key}_max ${summary.max}`);
    }

    return lines.join("\n");
  },

  /**
   * Reset all metrics
   */
  reset(): void {
    counters.clear();
    histograms.clear();
  },
} as const;

/**
 * Application metrics
 */
export const metrics = {
  // HTTP request metrics
  httpRequests: MetricsStore.getCounter("http_requests_total"),
  httpDuration: MetricsStore.getHistogram("http_request_duration_ms"),
  httpErrors: MetricsStore.getCounter("http_errors_total"),

  // Authentication metrics
  authAttempts: MetricsStore.getCounter("auth_attempts_total"),
  authSuccesses: MetricsStore.getCounter("auth_successes_total"),
  authFailures: MetricsStore.getCounter("auth_failures_total"),

  // Discord API metrics
  discordApiRequests: MetricsStore.getCounter("discord_api_requests_total"),
  discordApiErrors: MetricsStore.getCounter("discord_api_errors_total"),
  discordApiDuration: MetricsStore.getHistogram("discord_api_duration_ms"),

  // Rate limiting metrics
  rateLimitHits: MetricsStore.getCounter("rate_limit_hits_total"),
  rateLimitBlocked: MetricsStore.getCounter("rate_limit_blocked_total"),

  // Security metrics
  csrfAttempts: MetricsStore.getCounter("csrf_attempts_total"),
  invalidTokens: MetricsStore.getCounter("invalid_tokens_total"),

  // Database metrics
  dbQueries: MetricsStore.getCounter("db_queries_total"),
  dbErrors: MetricsStore.getCounter("db_errors_total"),
  dbDuration: MetricsStore.getHistogram("db_query_duration_ms"),

  // Application metrics
  activeUsers: MetricsStore.getCounter("active_users"),
  guildsFetched: MetricsStore.getCounter("guilds_fetched_total"),
};

/**
 * Utility functions for common metric operations
 */
export const MetricsUtils = {
  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
  ): void {
    const _labels = { method, path, status: statusCode.toString() };

    metrics.httpRequests.increment();
    metrics.httpDuration.observe(duration);

    if (statusCode >= 400) {
      metrics.httpErrors.increment();
    }
  },

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(success: boolean, method = "discord"): void {
    const _labels = { method };

    metrics.authAttempts.increment();

    if (success) {
      metrics.authSuccesses.increment();
    } else {
      metrics.authFailures.increment();
    }
  },

  /**
   * Record Discord API call
   */
  recordDiscordApiCall(
    endpoint: string,
    success: boolean,
    duration: number,
  ): void {
    const _labels = { endpoint, success: success.toString() };

    metrics.discordApiRequests.increment();
    metrics.discordApiDuration.observe(duration);

    if (!success) {
      metrics.discordApiErrors.increment();
    }
  },

  /**
   * Record rate limit event
   */
  recordRateLimit(endpoint: string, blocked: boolean): void {
    const _labels = { endpoint };

    metrics.rateLimitHits.increment();

    if (blocked) {
      metrics.rateLimitBlocked.increment();
    }
  },

  /**
   * Record security event
   */
  recordSecurityEvent(type: "csrf" | "invalid_token", endpoint?: string): void {
    const _labels = endpoint ? { endpoint } : {};

    switch (type) {
      case "csrf":
        metrics.csrfAttempts.increment();
        break;
      case "invalid_token":
        metrics.invalidTokens.increment();
        break;
    }
  },

  /**
   * Record database operation
   */
  recordDatabaseOperation(
    operation: string,
    success: boolean,
    duration: number,
  ): void {
    const _labels = { operation, success: success.toString() };

    metrics.dbQueries.increment();
    metrics.dbDuration.observe(duration);

    if (!success) {
      metrics.dbErrors.increment();
    }
  },

  /**
   * Get all metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    return {
      http: {
        requests: metrics.httpRequests.get(),
        errors: metrics.httpErrors.get(),
        avgDuration: metrics.httpDuration.summary().avg,
      },
      auth: {
        attempts: metrics.authAttempts.get(),
        successes: metrics.authSuccesses.get(),
        failures: metrics.authFailures.get(),
        successRate:
          metrics.authAttempts.get() > 0
            ? (metrics.authSuccesses.get() / metrics.authAttempts.get()) * 100
            : 0,
      },
      discord: {
        requests: metrics.discordApiRequests.get(),
        errors: metrics.discordApiErrors.get(),
        avgDuration: metrics.discordApiDuration.summary().avg,
      },
      security: {
        rateLimitHits: metrics.rateLimitHits.get(),
        rateLimitBlocked: metrics.rateLimitBlocked.get(),
        csrfAttempts: metrics.csrfAttempts.get(),
        invalidTokens: metrics.invalidTokens.get(),
      },
      database: {
        queries: metrics.dbQueries.get(),
        errors: metrics.dbErrors.get(),
        avgDuration: metrics.dbDuration.summary().avg,
      },
    };
  },
};
