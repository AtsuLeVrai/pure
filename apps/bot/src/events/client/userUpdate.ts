import type { PartialUser, User } from "discord.js";
import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "userUpdate",
  execute: async (client, oldUser, newUser) => {
    // Extract user information for comparison
    const userInfo = {
      id: newUser.id,
      timestamp: new Date().toISOString(),
      partial: oldUser.partial,
    };

    // Detect what changed between old and new user
    const changes = detectUserChanges(oldUser, newUser);

    // Skip logging if no meaningful changes detected
    if (changes.length === 0) {
      return;
    }

    // Categorize the update type and severity
    const updateAnalysis = {
      changesDetected: changes.length,
      changeTypes: changes.map((c) => c.type),
      severity: determineUpdateSeverity(changes),
      securityRelevant: isSecurityRelevant(changes),
      auditRequired: requiresAudit(changes),
    };

    // Get user context information
    const userContext = {
      username: newUser.username,
      displayName: newUser.displayName,
      bot: newUser.bot,
      system: newUser.system,
      flags: newUser.flags?.toArray() || [],
      createdAt: newUser.createdAt?.toISOString(),
      mutualGuilds: client.guilds.cache.filter((guild) =>
        guild.members.cache.has(newUser.id),
      ).size,
    };

    // Performance and system context
    const systemContext = {
      clientGuilds: client.guilds.cache.size,
      clientUptime: Math.floor(process.uptime()),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cacheSize: client.users.cache.size,
    };

    // Log the user update with appropriate severity
    const logLevel =
      updateAnalysis.severity === "high"
        ? "warn"
        : updateAnalysis.severity === "critical"
          ? "error"
          : "info";

    Logger[logLevel](`User ${newUser.username} (${newUser.id}) updated`, {
      source: "discord.js",
      category: "user_management",
      subcategory: "user_update",
      severity: updateAnalysis.severity,
      user: userInfo,
      context: userContext,
      analysis: updateAnalysis,
      changes: changes,
      system: systemContext,
    });

    // Detailed change logging for audit purposes
    if (updateAnalysis.auditRequired) {
      Logger.info(
        `User update audit log for ${newUser.username} (${newUser.id})`,
        {
          source: "discord.js",
          category: "user_audit",
          audit: true,
          userId: newUser.id,
          timestamp: userInfo.timestamp,
          changes: changes.map((change) => ({
            type: change.type,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            significance: change.significance,
          })),
          userContext: {
            username: newUser.username,
            bot: newUser.bot,
            mutualGuilds: userContext.mutualGuilds,
          },
        },
      );
    }

    // Security-relevant updates
    if (updateAnalysis.securityRelevant) {
      Logger.warn(
        `Security-relevant user update detected for ${newUser.username}`,
        {
          source: "discord.js",
          category: "user_security",
          severity: "warning",
          userId: newUser.id,
          username: newUser.username,
          securityChanges: changes.filter((c) =>
            ["username", "discriminator", "flags", "avatar"].includes(c.field),
          ),
          recommendations: [
            "Monitor user activity for unusual behavior",
            "Verify user identity if suspicious changes detected",
            "Check for potential account compromise indicators",
          ],
          context: {
            mutualGuilds: userContext.mutualGuilds,
            bot: userContext.bot,
            flags: userContext.flags,
          },
        },
      );
    }

    // Performance impact analysis for high-volume updates
    if (systemContext.cacheSize > 10000 && changes.length > 3) {
      Logger.debug("High-volume user update performance impact", {
        source: "discord.js",
        category: "user_performance",
        userId: newUser.id,
        performance: {
          cacheSize: systemContext.cacheSize,
          memoryUsage: systemContext.memoryUsage,
          changesProcessed: changes.length,
          processingOverhead: "standard",
        },
        recommendations:
          changes.length > 5
            ? [
                "Monitor memory usage during bulk user updates",
                "Consider implementing update batching if needed",
              ]
            : [],
      });
    }

    // Analytics tracking for user behavior patterns
    Logger.debug("User update analytics", {
      source: "discord.js",
      category: "user_analytics",
      tracking: {
        userId: newUser.id,
        timestamp: userInfo.timestamp,
        changeTypes: updateAnalysis.changeTypes,
        changeCount: changes.length,
        userType: userContext.bot ? "bot" : "user",
        mutualGuilds: userContext.mutualGuilds,
      },
      analytics: true,
    });

    // Special handling for bot user updates
    if (userContext.bot) {
      Logger.info(`Bot user update detected: ${newUser.username}`, {
        source: "discord.js",
        category: "bot_user_update",
        botUser: {
          id: newUser.id,
          username: newUser.username,
          changes: updateAnalysis.changeTypes,
          mutualGuilds: userContext.mutualGuilds,
        },
        significance: updateAnalysis.severity,
        monitoring: userContext.mutualGuilds > 0 ? "required" : "optional",
      });
    }
  },
});

/**
 * Detect changes between old and new user objects
 */
function detectUserChanges(
  oldUser: User | PartialUser,
  newUser: User,
): Array<{
  type: string;
  field: string;
  oldValue: any;
  newValue: any;
  significance: string;
}> {
  const changes = [];

  // Username changes
  if (oldUser.username !== newUser.username) {
    changes.push({
      type: "username_change",
      field: "username",
      oldValue: oldUser.username,
      newValue: newUser.username,
      significance: "high",
    });
  }

  // Display name changes
  if (oldUser.displayName !== newUser.displayName) {
    changes.push({
      type: "display_name_change",
      field: "displayName",
      oldValue: oldUser.displayName,
      newValue: newUser.displayName,
      significance: "medium",
    });
  }

  // Global name changes
  if (oldUser.globalName !== newUser.globalName) {
    changes.push({
      type: "global_name_change",
      field: "globalName",
      oldValue: oldUser.globalName,
      newValue: newUser.globalName,
      significance: "medium",
    });
  }

  // Avatar changes
  if (oldUser.avatar !== newUser.avatar) {
    changes.push({
      type: "avatar_change",
      field: "avatar",
      oldValue: oldUser.avatar,
      newValue: newUser.avatar,
      significance: "low",
    });
  }

  // Discriminator changes (legacy)
  if (oldUser.discriminator !== newUser.discriminator) {
    changes.push({
      type: "discriminator_change",
      field: "discriminator",
      oldValue: oldUser.discriminator,
      newValue: newUser.discriminator,
      significance: "high",
    });
  }

  // User flags changes
  const oldFlags = oldUser.flags?.toArray() || [];
  const newFlags = newUser.flags?.toArray() || [];
  if (JSON.stringify(oldFlags.sort()) !== JSON.stringify(newFlags.sort())) {
    changes.push({
      type: "flags_change",
      field: "flags",
      oldValue: oldFlags,
      newValue: newFlags,
      significance: "medium",
    });
  }

  // Banner changes
  if (oldUser.banner !== newUser.banner) {
    changes.push({
      type: "banner_change",
      field: "banner",
      oldValue: oldUser.banner,
      newValue: newUser.banner,
      significance: "low",
    });
  }

  // Accent color changes
  if (oldUser.accentColor !== newUser.accentColor) {
    changes.push({
      type: "accent_color_change",
      field: "accentColor",
      oldValue: oldUser.accentColor,
      newValue: newUser.accentColor,
      significance: "low",
    });
  }

  return changes;
}

/**
 * Determine the severity of the user update
 */
function determineUpdateSeverity(
  changes: Array<{ significance: string }>,
): string {
  const hasHigh = changes.some((c) => c.significance === "high");
  const hasMedium = changes.some((c) => c.significance === "medium");
  const hasMultiple = changes.length > 3;

  if (hasHigh) return "high";
  if (hasMedium && hasMultiple) return "medium";
  if (hasMedium || hasMultiple) return "low";
  return "minimal";
}

/**
 * Check if the update is security-relevant
 */
function isSecurityRelevant(changes: Array<{ field: string }>): boolean {
  const securityRelevantFields = ["username", "discriminator", "flags"];
  return changes.some((c) => securityRelevantFields.includes(c.field));
}

/**
 * Check if the update requires audit logging
 */
function requiresAudit(changes: Array<{ significance: string }>): boolean {
  return changes.some((c) => c.significance === "high") || changes.length > 2;
}
