import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "warn",
  execute: async (client, warning) => {
    // Parse the warning message to extract useful information
    const warningInfo = {
      message: warning,
      timestamp: new Date().toISOString(),
      clientId: client.user?.id,
      clientStatus: client.ws.status,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      uptime: Math.floor(process.uptime()),
    };

    // Categorize warnings for better monitoring
    let category = "general";
    const lowercaseWarning = warning.toLowerCase();

    if (
      lowercaseWarning.includes("ratelimit") ||
      lowercaseWarning.includes("rate limit")
    ) {
      category = "ratelimit";
    } else if (
      lowercaseWarning.includes("websocket") ||
      lowercaseWarning.includes("gateway")
    ) {
      category = "connection";
    } else if (lowercaseWarning.includes("shard")) {
      category = "sharding";
    } else if (lowercaseWarning.includes("voice")) {
      category = "voice";
    } else if (lowercaseWarning.includes("permission")) {
      category = "permissions";
    } else if (lowercaseWarning.includes("audit")) {
      category = "audit_log";
    }

    Logger.warn("Discord.js warning received", {
      source: "discord.js",
      category,
      warning: warningInfo,
      severity: "warning",
    });

    // Additional handling for critical warnings
    const criticalPatterns = [
      "connection lost",
      "failed to reconnect",
      "shard disconnect",
      "heartbeat timeout",
      "authentication failed",
    ];

    const isCritical = criticalPatterns.some((pattern) =>
      lowercaseWarning.includes(pattern),
    );

    if (isCritical) {
      Logger.error("Critical Discord.js warning detected", {
        source: "discord.js",
        category,
        warning: warningInfo,
        severity: "critical",
        action_required: true,
      });
    }
  },
});
