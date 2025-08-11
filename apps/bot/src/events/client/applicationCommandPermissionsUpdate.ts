import { ApplicationCommandPermissionType } from "discord.js";
import { defineEvent } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

export default defineEvent({
  name: "applicationCommandPermissionsUpdate",
  execute: async (client, data) => {
    // Extract permission update information
    const updateInfo = {
      applicationId: data.applicationId,
      guildId: data.guildId,
      commandId: data.id,
      permissions: data.permissions,
      timestamp: new Date().toISOString(),
    };

    // Get guild and command information for context
    const guild = client.guilds.cache.get(data.guildId);
    const guildInfo = guild
      ? {
          name: guild.name,
          memberCount: guild.memberCount,
          ownerId: guild.ownerId,
        }
      : null;

    // Analyze permission changes
    const permissionAnalysis = {
      totalPermissions: data.permissions.length,
      rolePermissions: data.permissions.filter(
        (p) => p.type === ApplicationCommandPermissionType.Role,
      ).length,
      userPermissions: data.permissions.filter(
        (p) => p.type === ApplicationCommandPermissionType.User,
      ).length,
      channelPermissions: data.permissions.filter(
        (p) => p.type === ApplicationCommandPermissionType.Channel,
      ).length,
      allowedPermissions: data.permissions.filter((p) => p.permission).length,
      deniedPermissions: data.permissions.filter((p) => !p.permission).length,
    };

    // Determine if this is a security-relevant change
    const securityRelevant =
      permissionAnalysis.deniedPermissions > 0 ||
      permissionAnalysis.userPermissions > 0;

    Logger.info("Application command permissions updated", {
      source: "discord.js",
      category: "command_permissions",
      severity: securityRelevant ? "warning" : "info",
      update: updateInfo,
      guild: guildInfo,
      analysis: permissionAnalysis,
      security: {
        relevant: securityRelevant,
        hasRestrictions: permissionAnalysis.deniedPermissions > 0,
        userSpecificPermissions: permissionAnalysis.userPermissions > 0,
      },
    });

    // Log detailed permission breakdown for audit purposes
    if (data.permissions.length > 0) {
      const permissionDetails = data.permissions.map((permission) => ({
        id: permission.id,
        type:
          permission.type === ApplicationCommandPermissionType.Role
            ? "role"
            : permission.type === ApplicationCommandPermissionType.User
              ? "user"
              : "channel",
        permission: permission.permission ? "allow" : "deny",
      }));

      Logger.debug("Command permission details", {
        source: "discord.js",
        category: "command_permissions_audit",
        commandId: data.id,
        guildId: data.guildId,
        permissions: permissionDetails,
        audit: true,
      });
    }

    // Alert on significant permission restrictions
    if (permissionAnalysis.deniedPermissions > 5) {
      Logger.warn("High number of command permission restrictions applied", {
        source: "discord.js",
        category: "command_security",
        commandId: data.id,
        guildId: data.guildId,
        guildName: guildInfo?.name,
        deniedCount: permissionAnalysis.deniedPermissions,
        totalCount: permissionAnalysis.totalPermissions,
        recommendation:
          "Review command accessibility and ensure intended users can access commands",
      });
    }
  },
});
