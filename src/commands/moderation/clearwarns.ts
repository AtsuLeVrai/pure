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
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Warning interface (should match warn.ts)
interface Warning {
  id: string;
  userId: string;
  guildId: string;
  moderatorId: string;
  reason: string;
  timestamp: Date;
}

// In-memory store for demo purposes - replace with database in production
// This should be shared with warn.ts and warnings.ts in a real implementation
const warningsStore = new Map<string, Warning[]>();

// Utility function to get user warnings
function getUserWarnings(userId: string, guildId: string): Warning[] {
  const key = `${guildId}:${userId}`;
  return warningsStore.get(key) || [];
}

// Utility function to clear all warnings for a user
function clearAllWarnings(userId: string, guildId: string): number {
  const key = `${guildId}:${userId}`;
  const warnings = warningsStore.get(key) || [];
  const count = warnings.length;

  warningsStore.delete(key);

  return count;
}

// Utility function to clear specific warning by ID
function clearWarningById(
  userId: string,
  guildId: string,
  warningId: string,
): { success: boolean; warning?: Warning } {
  const key = `${guildId}:${userId}`;
  const warnings = warningsStore.get(key) || [];

  const warningIndex = warnings.findIndex((w) => w.id === warningId);

  if (warningIndex === -1) {
    return { success: false };
  }

  const removedWarning = warnings.splice(warningIndex, 1)[0];

  if (warnings.length === 0) {
    warningsStore.delete(key);
  } else {
    warningsStore.set(key, warnings);
  }

  return { success: true, warning: removedWarning };
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
        value: `**Reason:** ${specificWarning.reason}\n**ID:** \`${specificWarning.id}\``,
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

export default defineSlashCommand({
  data: {
    name: "clearwarns",
    description: "Clear warnings for a user",
    defaultMemberPermissions: "ModerateMembers",
    options: [
      {
        name: "user",
        description: "The user to clear warnings for",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "warning_id",
        description:
          "Specific warning ID to clear (optional - leave empty to clear all)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "reason",
        description: "Reason for clearing the warning(s)",
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

    // Get options
    const targetUser = interaction.options.getUser("user", true);
    const warningId = interaction.options.getString("warning_id");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const silent = interaction.options.getBoolean("silent") ?? false;

    // Get guild member object
    const executor = interaction.member as GuildMember;

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
      let clearedCount = 0;
      let clearedWarning: Warning | undefined;
      let isSpecificClear = false;

      if (warningId) {
        // Clear specific warning
        const result = clearWarningById(
          targetUser.id,
          interaction.guild.id,
          warningId,
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

        clearedCount = 1;
        clearedWarning = result.warning;
        isSpecificClear = true;
      } else {
        // Clear all warnings
        const currentWarnings = getUserWarnings(
          targetUser.id,
          interaction.guild.id,
        );

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

        clearedCount = clearAllWarnings(targetUser.id, interaction.guild.id);
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
          clearedCount,
          clearedWarning,
        );
      }

      // Create and send response embed
      const embed = new EmbedBuilder()
        .setTitle("🗑️ Warning(s) Cleared")
        .setDescription(
          isSpecificClear
            ? `Cleared 1 warning for **${targetUser.tag}**`
            : `Cleared **${clearedCount}** warning${clearedCount !== 1 ? "s" : ""} for **${targetUser.tag}**`,
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

      if (isSpecificClear && clearedWarning) {
        embed.addFields({
          name: "Cleared Warning Details",
          value: `**ID:** \`${clearedWarning.id}\`\n**Reason:** ${clearedWarning.reason}\n**Date:** ${clearedWarning.timestamp.toLocaleDateString()}`,
          inline: false,
        });
      }

      await interaction.editReply({
        embeds: [embed],
      });

      // Log the command usage
      Logger.info("Clear warnings command executed", {
        targetId: targetUser.id,
        targetTag: targetUser.tag,
        executorId: executor.id,
        executorTag: executor.user.tag,
        guildId: interaction.guild.id,
        clearedCount,
        isSpecificClear,
        warningId: warningId || undefined,
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
        warningId,
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
  },
});
