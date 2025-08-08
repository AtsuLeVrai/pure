import { NextResponse } from "next/server";
import { env } from "@/env";
import { MetricsStore, MetricsUtils } from "@/lib/metrics";

/**
 * GET /api/metrics - Export application metrics
 *
 * This endpoint provides metrics in both JSON and Prometheus formats
 * for monitoring and observability systems.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";
    const auth = request.headers.get("authorization");

    // Simple API key auth for metrics endpoint (in production, use proper auth)
    const metricsApiKey = process.env.METRICS_API_KEY;
    if (env.NODE_ENV === "production" && metricsApiKey) {
      if (!auth || !auth.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const token = auth.split(" ")[1];
      if (token !== metricsApiKey) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }
    }

    if (format === "prometheus") {
      // Return metrics in Prometheus format
      const prometheusMetrics = MetricsStore.getPrometheusMetrics();

      return new Response(prometheusMetrics, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }
    // Return metrics summary in JSON format
    const summary = MetricsUtils.getMetricsSummary();

    return NextResponse.json(
      {
        timestamp: Date.now(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        metrics: summary,
      },
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      },
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/metrics/reset - Reset all metrics (development only)
 */
export async function POST(_request: Request) {
  if (env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not allowed in production" },
      { status: 403 },
    );
  }

  try {
    MetricsStore.reset();

    return NextResponse.json({ message: "Metrics reset successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
