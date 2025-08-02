import { ModerationType, type Warning } from "@pure/database";
import {
  ApplicationCommandOptionType,
  blockQuote,
  bold,
  Colors,
  EmbedBuilder,
  type GuildMember,
  MessageFlags,
  type User,
} from "discord.js";
import { v7 } from "uuid";
import { prisma } from "@/index.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Define the structure for warn result
interface WarnResult {
  success: boolean;
  error?: string;
  member?: GuildMember;
  user?: User;
  warnId?: string;
}

// Utility function to add warning
async function addWarning(
  userId: string,
  guildId: string,
  moderatorId: string,
  reason: string,
) {
  const warning = await prisma.warning.create({
    data: {
      warn_id: v7(),
      user_id: userId,
      guild_id: guildId,
      moderator_id: moderatorId,
      reason,
    },
  });

  // Add moderation log
  await prisma.moderationLog.create({
    data: {
      log_id: v7(),
      type: ModerationType.WARN,
      target_user_id: userId,
      moderator_id: moderatorId,
      guild_id: guildId,
      reason,
    },
  });

  return warning;
}

// Utility function to clear all warnings for a user
async function clearAllWarnings(
  userId: string,
  guildId: string,
  moderatorId: string,
  reason: string,
): Promise<number> {
  const warnings = await prisma.warning.findMany({
    where: {
      user_id: userId,
      guild_id: guildId,
    },
    orderBy: {
      timestamp: "desc",
    },
  });
  const count = warnings.length;

  if (count > 0) {
    // Delete all warnings
    await prisma.warning.deleteMany({
      where: {
        user_id: userId,
        guild_id: guildId,
      },
    });

    // Add moderation log
    await prisma.moderationLog.create({
      data: {
        log_id: v7(),
        type: ModerationType.CLEAR_WARNINGS,
        target_user_id: userId,
        moderator_id: moderatorId,
        guild_id: guildId,
        reason,
        metadata: { cleared_count: count },
      },
    });
  }

  return count;
}

// Utility function to clear specific warning by ID
async function clearWarningById(
  userId: string,
  guildId: string,
  warningId: string,
  moderatorId: string,
  reason: string,
): Promise<{ success: boolean; warning?: Warning }> {
  const warning = await prisma.warning.findFirst({
    where: {
      warn_id: warningId,
      user_id: userId,
      guild_id: guildId,
    },
  });

  if (!warning) {
    return { success: false };
  }

  // Delete the warning
  await prisma.warning.delete({
    where: {
      id: warning.id,
    },
  });

  // Add moderation log
  await prisma.moderationLog.create({
    data: {
      log_id: v7(),
      type: ModerationType.CLEAR_WARNINGS,
      target_user_id: userId,
      moderator_id: moderatorId,
      guild_id: guildId,
      reason,
      metadata: { warning_id: warningId, original_reason: warning.reason },
    },
  });

  return { success: true, warning };
}

// Utility function to validate warn permissions and target
async function validateWarnPermissions(
  executor: GuildMember,
  target: GuildMember | null,
): Promise<{ canWarn: boolean; reason?: string }> {
  // Check if target is in the guild
  if (!target) {
    return {
      canWarn: false,
      reason: "User is not in this server",
    };
  }

  // Check role hierarchy (can't warn equal or higher roles)
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return {
      canWarn: false,
      reason: "You cannot warn someone with equal or higher role",
    };
  }

  // Check if target is guild owner
  if (target.id === target.guild.ownerId) {
    return {
      canWarn: false,
      reason: "Cannot warn the guild owner",
    };
  }

  // Check if trying to warn self
  if (target.id === executor.id) {
    return {
      canWarn: false,
      reason: "You cannot warn yourself",
    };
  }

  // Check if target is a bot (optional restriction)
  if (target.user.bot) {
    return {
      canWarn: false,
      reason: "Cannot warn bots",
    };
  }

  return { canWarn: true };
}

// Utility function to execute warn
async function executeWarn(
  targetMember: GuildMember,
  executor: GuildMember,
  reason: string,
): Promise<WarnResult> {
  try {
    // Store warning in database
    const warning = await addWarning(
      targetMember.id,
      targetMember.guild.id,
      executor.id,
      reason,
    );

    Logger.info("Member warned successfully", {
      warnId: warning.warn_id,
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      reason,
    });

    return {
      success: true,
      member: targetMember,
      user: targetMember.user,
      warnId: warning.warn_id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to warn member", {
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

// Utility function to send warn notification to user
async function sendWarnNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  reason: string,
  executor: GuildMember,
  warnCount: number,
  warnId: string,
): Promise<void> {
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("⚠️ You have received a warning")
      .setDescription(`You have been warned in **${guild.name}**`)
      .setColor(Colors.Yellow)
      .addFields(
        {
          name: "Reason",
          value: reason,
          inline: false,
        },
        {
          name: "Moderator",
          value: executor.user.tag,
          inline: true,
        },
        {
          name: "Warning Count",
          value: `${warnCount} warning${warnCount !== 1 ? "s" : ""} total`,
          inline: true,
        },
        {
          name: "Warning ID",
          value: `\`${warnId}\``,
          inline: false,
        },
        {
          name: "Note",
          value: "Multiple warnings may result in further action",
          inline: false,
        },
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Warn notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
      warnId,
    });
  } catch (error) {
    Logger.debug("Could not send warn notification to user", {
      userId: user.id,
      warnId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Utility function to send clear warnings notification to user
async function sendClearWarningsNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  executor: GuildMember,
  clearedCount: number,
  specificWarning?: Warning,
): Promise<void> {
  try {
    const isSpecific = !!specificWarning;

    const dmEmbed = new EmbedBuilder()
      .setTitle("🗑️ Warning(s) Cleared")
      .setDescription(
        isSpecific
          ? `A warning has been removed from your record in **${guild.name}**`
          : `All warnings have been cleared from your record in **${guild.name}**`,
      )
      .setColor(Colors.Green)
      .addFields(
        {
          name: "Moderator",
          value: executor.user.tag,
          inline: true,
        },
        {
          name: isSpecific ? "Warning Removed" : "Warnings Cleared",
          value: isSpecific
            ? "1 warning"
            : `${clearedCount} warning${clearedCount !== 1 ? "s" : ""}`,
          inline: true,
        },
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    if (specificWarning) {
      dmEmbed.addFields({
        name: "Cleared Warning",
        value: `**Reason:** ${specificWarning.reason}\n**ID:** \`${specificWarning.warn_id}\``,
        inline: false,
      });
    }

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Clear warnings notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
      clearedCount,
      isSpecific,
    });
  } catch (error) {
    Logger.debug("Could not send clear warnings notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Utility function to format warning for display
function formatWarning(warning: Warning, index: number): string {
  const date = warning.timestamp.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    `**${index + 1}.** ${warning.reason}\n` +
    `└ ID: \`${warning.warn_id}\` | ${date} | <@${warning.moderator_id}>`
  );
}

// Utility function to create warnings embed
async function createWarningsEmbed(
  targetUser: User,
  warnings: Warning[],
  executor: GuildMember,
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
    .setColor(warnings.length > 0 ? Colors.Yellow : Colors.Green)
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp()
    .setFooter({
      text: `Requested by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

  if (warnings.length === 0) {
    embed.setDescription("This user has no warnings").addFields({
      name: "Clean Record",
      value: "✅ No infractions found",
      inline: false,
    });
  } else {
    embed
      .setDescription(
        `Found **${warnings.length}** warning${warnings.length !== 1 ? "s" : ""}`,
      )
      .addFields({
        name: "User Information",
        value: `${targetUser} (${targetUser.tag})\nID: \`${targetUser.id}\``,
        inline: false,
      });

    // Split warnings into chunks if there are too many
    const maxWarningsPerField = 5;
    const warningChunks: any[][] = [];

    for (let i = 0; i < warnings.length; i += maxWarningsPerField) {
      warningChunks.push(warnings.slice(i, i + maxWarningsPerField));
    }

    for (let chunkIndex = 0; chunkIndex < warningChunks.length; chunkIndex++) {
      const chunk = warningChunks[chunkIndex] || [];
      const startIndex = chunkIndex * maxWarningsPerField;

      const warningsList = chunk
        .map((warning, index) => formatWarning(warning, startIndex + index))
        .join("\n\n");

      const fieldName =
        warningChunks.length === 1
          ? "Warnings"
          : `Warnings (${startIndex + 1}-${startIndex + chunk.length})`;

      embed.addFields({
        name: fieldName,
        value: warningsList,
        inline: false,
      });
    }

    // Add summary field for multiple warnings
    if (warnings.length > 3) {
      const oldestWarning = warnings[0] as Warning;
      const newestWarning = warnings[warnings.length - 1] as Warning;

      embed.addFields({
        name: "Summary",
        value:
          `📊 Total: **${warnings.length}** warnings\n` +
          `📅 First: ${oldestWarning.timestamp.toLocaleDateString()}\n` +
          `🕐 Latest: ${newestWarning.timestamp.toLocaleDateString()}`,
        inline: true,
      });
    }

    // Add warning level indicator
    let warningLevel = "Low";
    let levelEmoji = "🟢";

    if (warnings.length >= 5) {
      warningLevel = "High";
      levelEmoji = "🔴";
    } else if (warnings.length >= 3) {
      warningLevel = "Medium";
      levelEmoji = "🟡";
    }

    embed.addFields({
      name: "Warning Level",
      value: `${levelEmoji} ${warningLevel}`,
      inline: true,
    });
  }

  return embed;
}

export default defineSlashCommand({
  data: {
    name: "warn",
    description: "Warning management commands",
    defaultMemberPermissions: "ModerateMembers",
    options: [
      {
        name: "add",
        description: "Issue a warning to a member",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to warn",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "reason",
            description: "Reason for the warning",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 512,
          },
          {
            name: "silent",
            description: "Don't send a DM notification to the warned user",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a specific warning by ID",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to remove warning from",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "warning_id",
            description: "The specific warning ID to remove",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "reason",
            description: "Reason for removing the warning",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 512,
          },
          {
            name: "silent",
            description: "Don't send a DM notification to the user",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: "clear",
        description: "Clear all warnings for a user",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to clear warnings for",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "reason",
            description: "Reason for clearing all warnings",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 512,
          },
          {
            name: "silent",
            description: "Don't send a DM notification to the user",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: "list",
        description: "View warnings for a user",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to check warnings for",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "show_details",
            description: "Show detailed information for each warning",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
    ],
  },
  category: "moderation",
  execute: async (_client, interaction) => {
    // Ensure command is used in a guild
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({
        content: blockQuote(
          bold("❌ This command can only be used in a server"),
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const executor = interaction.member as GuildMember;

    switch (subcommand) {
      case "add": {
        // Get options
        const targetUser = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        const silent = interaction.options.getBoolean("silent") ?? false;

        // Get guild member objects
        const targetMember = await interaction.guild.members
          .fetch(targetUser.id)
          .catch(() => null);

        // Validate permissions
        const validation = await validateWarnPermissions(
          executor,
          targetMember,
        );
        if (!validation.canWarn) {
          await interaction.reply({
            content: blockQuote(bold(`❌ ${validation.reason}`)),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // Defer reply as warn operation might involve database writes
        await interaction.deferReply();

        // Execute warn (we know targetMember exists due to validation)
        const result = await executeWarn(
          targetMember as GuildMember,
          executor,
          reason,
        );

        if (!result.success) {
          const embed = new EmbedBuilder()
            .setTitle("❌ Warning Failed")
            .setDescription("Failed to warn the specified user")
            .setColor(Colors.Red)
            .addFields({
              name: "Error",
              value: result.error || "Unknown error occurred",
              inline: false,
            })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
          return;
        }

        // Get user's warning count
        const userWarnings = await prisma.warning.findMany({
          where: {
            user_id: targetUser.id,
            guild_id: interaction.guild.id,
          },
          orderBy: {
            timestamp: "desc",
          },
        });

        const warnCount = userWarnings.length;

        // Send notification to user (if not silent)
        if (!silent && targetMember && result.warnId) {
          await sendWarnNotification(
            targetUser,
            {
              name: interaction.guild.name,
              iconURL: () => interaction.guild?.iconURL() ?? null,
            },
            reason,
            executor,
            warnCount,
            result.warnId,
          );
        }

        // Create and send response embed
        const embed = new EmbedBuilder()
          .setTitle("⚠️ Member Warned")
          .setDescription(`**${result.user?.tag}** has been issued a warning`)
          .setColor(Colors.Yellow)
          .addFields(
            {
              name: "User",
              value: `${result.user} (${result.user?.tag})`,
              inline: true,
            },
            {
              name: "User ID",
              value: `\`${result.user?.id}\``,
              inline: true,
            },
            {
              name: "Warning Count",
              value: `${warnCount} warning${warnCount !== 1 ? "s" : ""} total`,
              inline: true,
            },
            {
              name: "Reason",
              value: reason,
              inline: false,
            },
            {
              name: "Warning ID",
              value: `\`${result.warnId}\``,
              inline: true,
            },
            {
              name: "Moderator",
              value: `${executor.user} (${executor.user.tag})`,
              inline: true,
            },
          )
          .setThumbnail(result.user?.displayAvatarURL() as string)
          .setTimestamp()
          .setFooter({
            text: `Warned by ${executor.user.tag}`,
            iconURL: executor.user.displayAvatarURL(),
          });

        // Add warning about escalation if user has multiple warnings
        if (warnCount >= 3) {
          embed.addFields({
            name: "⚠️ Notice",
            value: `This user has **${warnCount}** warnings. Consider escalating to timeout/kick/ban.`,
            inline: false,
          });
          embed.setColor(Colors.Orange);
        }

        await interaction.editReply({
          embeds: [embed],
        });

        // Log the command usage
        Logger.info("Warn add command executed", {
          success: result.success,
          warnId: result.warnId,
          targetId: targetUser.id,
          targetTag: targetUser.tag,
          executorId: executor.id,
          executorTag: executor.user.tag,
          guildId: interaction.guild.id,
          reason,
          warnCount,
          silent,
        });
        break;
      }

      case "remove": {
        // Get options
        const targetUser = interaction.options.getUser("user", true);
        const warningId = interaction.options.getString("warning_id", true);
        const reason =
          interaction.options.getString("reason") ?? "No reason provided";
        const silent = interaction.options.getBoolean("silent") ?? false;

        // Check role hierarchy (can't remove warnings for equal or higher roles)
        const targetMember = await interaction.guild.members
          .fetch(targetUser.id)
          .catch(() => null);
        if (
          targetMember &&
          targetMember.roles.highest.position >= executor.roles.highest.position
        ) {
          await interaction.reply({
            content: blockQuote(
              bold(
                "❌ You cannot remove warnings for someone with equal or higher role",
              ),
            ),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // Defer reply as this operation might take time
        await interaction.deferReply();

        try {
          const result = await clearWarningById(
            targetUser.id,
            interaction.guild.id,
            warningId,
            executor.id,
            reason,
          );

          if (!result.success) {
            const embed = new EmbedBuilder()
              .setTitle("❌ Warning Not Found")
              .setDescription(
                "The specified warning ID was not found for this user",
              )
              .setColor(Colors.Red)
              .addFields(
                {
                  name: "User",
                  value: `${targetUser} (${targetUser.tag})`,
                  inline: true,
                },
                {
                  name: "Warning ID",
                  value: `\`${warningId}\``,
                  inline: true,
                },
              )
              .setTimestamp()
              .setFooter({
                text: `Checked by ${executor.user.tag}`,
                iconURL: executor.user.displayAvatarURL(),
              });

            await interaction.editReply({ embeds: [embed] });
            return;
          }

          // Send notification to user (if not silent)
          if (!silent) {
            await sendClearWarningsNotification(
              targetUser,
              {
                name: interaction.guild.name,
                iconURL: () => interaction.guild?.iconURL() ?? null,
              },
              executor,
              1,
              result.warning,
            );
          }

          // Create and send response embed
          const embed = new EmbedBuilder()
            .setTitle("🗑️ Warning Removed")
            .setDescription(`Removed 1 warning for **${targetUser.tag}**`)
            .setColor(Colors.Green)
            .addFields(
              {
                name: "User",
                value: `${targetUser} (${targetUser.tag})`,
                inline: true,
              },
              {
                name: "User ID",
                value: `\`${targetUser.id}\``,
                inline: true,
              },
              {
                name: "Removed",
                value: "1 warning",
                inline: true,
              },
              {
                name: "Reason",
                value: reason,
                inline: false,
              },
              {
                name: "Moderator",
                value: `${executor.user} (${executor.user.tag})`,
                inline: true,
              },
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp()
            .setFooter({
              text: `Removed by ${executor.user.tag}`,
              iconURL: executor.user.displayAvatarURL(),
            });

          if (result.warning) {
            embed.addFields({
              name: "Removed Warning Details",
              value: `**ID:** \`${result.warning.warn_id}\`\n**Reason:** ${result.warning.reason}\n**Date:** ${result.warning.timestamp.toLocaleDateString()}`,
              inline: false,
            });
          }

          await interaction.editReply({
            embeds: [embed],
          });

          // Log the command usage
          Logger.info("Warn remove command executed", {
            targetId: targetUser.id,
            targetTag: targetUser.tag,
            executorId: executor.id,
            executorTag: executor.user.tag,
            guildId: interaction.guild.id,
            warningId,
            reason,
            silent,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";

          Logger.error("Failed to remove warning", {
            targetId: targetUser.id,
            executorId: executor.id,
            guildId: interaction.guild.id,
            error: errorMessage,
            warningId,
          });

          const errorEmbed = new EmbedBuilder()
            .setTitle("❌ Error Removing Warning")
            .setDescription("Failed to remove warning for the specified user")
            .setColor(Colors.Red)
            .addFields({
              name: "Error",
              value: errorMessage,
              inline: false,
            })
            .setTimestamp();

          await interaction.editReply({
            embeds: [errorEmbed],
          });
        }
        break;
      }

      case "clear": {
        // Get options
        const targetUser = interaction.options.getUser("user", true);
        const reason =
          interaction.options.getString("reason") ?? "No reason provided";
        const silent = interaction.options.getBoolean("silent") ?? false;

        // Check role hierarchy (can't clear warnings for equal or higher roles)
        const targetMember = await interaction.guild.members
          .fetch(targetUser.id)
          .catch(() => null);
        if (
          targetMember &&
          targetMember.roles.highest.position >= executor.roles.highest.position
        ) {
          await interaction.reply({
            content: blockQuote(
              bold(
                "❌ You cannot clear warnings for someone with equal or higher role",
              ),
            ),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // Defer reply as this operation might take time
        await interaction.deferReply();

        try {
          // Check if user has warnings
          const currentWarnings = await prisma.warning.findMany({
            where: {
              user_id: targetUser.id,
              guild_id: interaction.guild.id,
            },
            orderBy: {
              timestamp: "desc",
            },
          });

          if (currentWarnings.length === 0) {
            const embed = new EmbedBuilder()
              .setTitle("⚠️ No Warnings Found")
              .setDescription("This user has no warnings to clear")
              .setColor(Colors.Yellow)
              .addFields({
                name: "User",
                value: `${targetUser} (${targetUser.tag})`,
                inline: true,
              })
              .setTimestamp()
              .setFooter({
                text: `Checked by ${executor.user.tag}`,
                iconURL: executor.user.displayAvatarURL(),
              });

            await interaction.editReply({ embeds: [embed] });
            return;
          }

          const clearedCount = await clearAllWarnings(
            targetUser.id,
            interaction.guild.id,
            executor.id,
            reason,
          );

          // Send notification to user (if not silent)
          if (!silent) {
            await sendClearWarningsNotification(
              targetUser,
              {
                name: interaction.guild.name,
                iconURL: () => interaction.guild?.iconURL() ?? null,
              },
              executor,
              clearedCount,
            );
          }

          // Create and send response embed
          const embed = new EmbedBuilder()
            .setTitle("🗑️ Warnings Cleared")
            .setDescription(
              `Cleared **${clearedCount}** warning${clearedCount !== 1 ? "s" : ""} for **${targetUser.tag}**`,
            )
            .setColor(Colors.Green)
            .addFields(
              {
                name: "User",
                value: `${targetUser} (${targetUser.tag})`,
                inline: true,
              },
              {
                name: "User ID",
                value: `\`${targetUser.id}\``,
                inline: true,
              },
              {
                name: "Cleared",
                value: `${clearedCount} warning${clearedCount !== 1 ? "s" : ""}`,
                inline: true,
              },
              {
                name: "Reason",
                value: reason,
                inline: false,
              },
              {
                name: "Moderator",
                value: `${executor.user} (${executor.user.tag})`,
                inline: true,
              },
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp()
            .setFooter({
              text: `Cleared by ${executor.user.tag}`,
              iconURL: executor.user.displayAvatarURL(),
            });

          await interaction.editReply({
            embeds: [embed],
          });

          // Log the command usage
          Logger.info("Warn clear command executed", {
            targetId: targetUser.id,
            targetTag: targetUser.tag,
            executorId: executor.id,
            executorTag: executor.user.tag,
            guildId: interaction.guild.id,
            clearedCount,
            reason,
            silent,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";

          Logger.error("Failed to clear warnings", {
            targetId: targetUser.id,
            executorId: executor.id,
            guildId: interaction.guild.id,
            error: errorMessage,
          });

          const errorEmbed = new EmbedBuilder()
            .setTitle("❌ Error Clearing Warnings")
            .setDescription("Failed to clear warnings for the specified user")
            .setColor(Colors.Red)
            .addFields({
              name: "Error",
              value: errorMessage,
              inline: false,
            })
            .setTimestamp();

          await interaction.editReply({
            embeds: [errorEmbed],
          });
        }
        break;
      }

      case "list": {
        // Get options
        const targetUser = interaction.options.getUser("user", true);
        const showDetails =
          interaction.options.getBoolean("show_details") ?? false;

        // Defer reply as this might take time for users with many warnings
        await interaction.deferReply();

        try {
          // Get user warnings
          const warnings = await prisma.warning.findMany({
            where: {
              user_id: targetUser.id,
              guild_id: interaction.guild.id,
            },
            orderBy: {
              timestamp: "desc",
            },
          });

          // Sort warnings by timestamp (newest first)
          warnings.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
          );

          // Create embed
          const embed = await createWarningsEmbed(
            targetUser,
            warnings,
            executor,
          );

          await interaction.editReply({
            embeds: [embed],
          });

          // Log the command usage
          Logger.info("Warn list command executed", {
            targetId: targetUser.id,
            targetTag: targetUser.tag,
            executorId: executor.id,
            executorTag: executor.user.tag,
            guildId: interaction.guild.id,
            warningCount: warnings.length,
            showDetails,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";

          Logger.error("Failed to fetch warnings", {
            targetId: targetUser.id,
            executorId: executor.id,
            guildId: interaction.guild.id,
            error: errorMessage,
          });

          const errorEmbed = new EmbedBuilder()
            .setTitle("❌ Error Fetching Warnings")
            .setDescription(
              "Failed to retrieve warnings for the specified user",
            )
            .setColor(Colors.Red)
            .addFields({
              name: "Error",
              value: errorMessage,
              inline: false,
            })
            .setTimestamp();

          await interaction.editReply({
            embeds: [errorEmbed],
          });
        }
        break;
      }
    }
  },
});
