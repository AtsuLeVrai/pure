import { NextResponse } from "next/server";
import { env } from "@/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Health check status levels
 */
type HealthStatus = "healthy" | "degraded" | "unhealthy";

interface HealthCheck {
  name: string;
  status: HealthStatus;
  duration: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface HealthResponse {
  status: HealthStatus;
  timestamp: number;
  uptime: number;
  environment: string;
  version: string;
  checks: HealthCheck[];
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    return {
      name: "database",
      status: duration < 1000 ? "healthy" : "degraded",
      duration,
      metadata: {
        connectionPool: "active",
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      name: "database",
      status: "unhealthy",
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check Discord API connectivity
 */
async function checkDiscordAPI(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Make a simple request to Discord API
    const response = await fetch("https://discord.com/api/v10/gateway", {
      method: "GET",
      headers: {
        "User-Agent":
          "Pure Bot Health Check (https://github.com/AtsuLeVrai/pure, 1.0.0)",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        name: "discord_api",
        status: duration < 2000 ? "healthy" : "degraded",
        duration,
        metadata: {
          gateway: data.url,
          responseStatus: response.status,
        },
      };
    }
    return {
      name: "discord_api",
      status: "degraded",
      duration,
      error: `HTTP ${response.status}`,
      metadata: {
        responseStatus: response.status,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      name: "discord_api",
      status: "unhealthy",
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const memUsage = process.memoryUsage();
    const duration = Date.now() - startTime;

    // Convert bytes to MB
    const rss = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
    const external = Math.round(memUsage.external / 1024 / 1024);

    // Consider memory unhealthy if heap usage is over 500MB
    // or degraded if over 250MB
    let status: HealthStatus = "healthy";
    if (heapUsed > 500) {
      status = "unhealthy";
    } else if (heapUsed > 250) {
      status = "degraded";
    }

    return {
      name: "memory",
      status,
      duration,
      metadata: {
        rss: `${rss}MB`,
        heapUsed: `${heapUsed}MB`,
        heapTotal: `${heapTotal}MB`,
        external: `${external}MB`,
        heapUtilization: `${Math.round((heapUsed / heapTotal) * 100)}%`,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      name: "memory",
      status: "unhealthy",
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Determine overall health status based on individual checks
 */
function getOverallStatus(checks: HealthCheck[]): HealthStatus {
  const statuses = checks.map((check) => check.status);

  if (statuses.includes("unhealthy")) {
    return "unhealthy";
  }

  if (statuses.includes("degraded")) {
    return "degraded";
  }

  return "healthy";
}

/**
 * GET /api/health - Application health check endpoint
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [databaseCheck, discordCheck, memoryCheck] = await Promise.all([
      checkDatabase(),
      checkDiscordAPI(),
      checkMemory(),
    ]);

    const checks = [databaseCheck, discordCheck, memoryCheck];
    const overallStatus = getOverallStatus(checks);
    const totalDuration = Date.now() - startTime;

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: Math.round(process.uptime()),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || "unknown",
      checks,
    };

    // Log health check results
    logger.info("Health check completed", {
      status: overallStatus,
      duration: totalDuration,
      checks: checks.map((check) => ({
        name: check.name,
        status: check.status,
        duration: check.duration,
      })),
    });

    // Return appropriate HTTP status code based on health
    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    logger.error("Health check failed", {
      error: error instanceof Error ? error : String(error),
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: Date.now(),
        uptime: Math.round(process.uptime()),
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || "unknown",
        checks: [],
        error: "Health check system failure",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      },
    );
  }
}
