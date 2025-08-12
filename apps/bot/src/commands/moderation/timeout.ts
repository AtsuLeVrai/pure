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

// Define the structure for timeout result
interface TimeoutResult {
  success: boolean;
  error?: string;
  member?: GuildMember;
  user?: User;
  duration?: number;
  isRemoval?: boolean;
}

// Duration presets in minutes
const DURATION_PRESETS = {
  "1m": 1,
  "5m": 5,
  "10m": 10,
  "1h": 60,
  "1d": 1440,
  "1w": 10080,
} as const;

// Utility function to parse duration string
function parseDuration(duration: string): number | null {
  const preset = DURATION_PRESETS[duration as keyof typeof DURATION_PRESETS];
  if (preset) return preset;

  // Parse custom duration like "30m", "2h", "3d"
  const match = duration.match(/^(\d+)([mhd])$/);
  if (!match) return null;

  const value = parseInt(match[1] as string);
  const unit = match[2];

  switch (unit) {
    case "m":
      return value;
    case "h":
      return value * 60;
    case "d":
      return value * 1440;
    default:
      return null;
  }
}

// Utility function to format duration for display
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  return `${days}d ${remainingHours}h`;
}

// Utility function to validate timeout permissions and target
async function validateTimeoutPermissions(
  executor: GuildMember,
  target: GuildMember | null,
): Promise<{ canTimeout: boolean; reason?: string }> {
  // Check if target is in the guild
  if (!target) {
    return {
      canTimeout: false,
      reason: "User is not in this server",
    };
  }

  // Check if target is moderatable
  if (!target.moderatable) {
    return {
      canTimeout: false,
      reason: "This member cannot be timed out (higher role or bot owner)",
    };
  }

  // Check role hierarchy
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return {
      canTimeout: false,
      reason: "You cannot timeout someone with equal or higher role",
    };
  }

  // Check if target is guild owner
  if (target.id === target.guild.ownerId) {
    return {
      canTimeout: false,
      reason: "Cannot timeout the guild owner",
    };
  }

  // Check if trying to timeout self
  if (target.id === executor.id) {
    return {
      canTimeout: false,
      reason: "You cannot timeout yourself",
    };
  }

  return { canTimeout: true };
}

// Utility function to execute timeout
async function executeTimeout(
  targetMember: GuildMember,
  executor: GuildMember,
  reason: string,
  durationMinutes?: number,
): Promise<TimeoutResult> {
  try {
    const isRemoval = !durationMinutes;

    if (isRemoval) {
      // Remove timeout
      await targetMember.timeout(
        null,
        `${reason} | Timeout removed by: ${executor.user.tag} (${executor.id})`,
      );

      Logger.info("Member timeout removed successfully", {
        targetId: targetMember.id,
        targetTag: targetMember.user.tag,
        executorId: executor.id,
        executorTag: executor.user.tag,
        guildId: executor.guild.id,
        reason,
      });
    } else {
      // Apply timeout
      const timeoutUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
      await targetMember.timeout(
        timeoutUntil.getTime(),
        `${reason} | Timed out by: ${executor.user.tag} (${executor.id})`,
      );

      Logger.info("Member timed out successfully", {
        targetId: targetMember.id,
        targetTag: targetMember.user.tag,
        executorId: executor.id,
        executorTag: executor.user.tag,
        guildId: executor.guild.id,
        reason,
        durationMinutes,
        timeoutUntil: timeoutUntil.toISOString(),
      });
    }

    return {
      success: true,
      member: targetMember,
      user: targetMember.user,
      duration: durationMinutes,
      isRemoval,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to timeout member", {
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      error: errorMessage,
      reason,
      durationMinutes,
    });

    return { success: false, error: errorMessage };
  }
}

// Utility function to send timeout notification to user
async function sendTimeoutNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  reason: string,
  executor: GuildMember,
  durationMinutes?: number,
): Promise<void> {
  try {
    const isRemoval = !durationMinutes;

    const dmEmbed = new EmbedBuilder()
      .setTitle(
        isRemoval
          ? "🔓 Your timeout has been removed"
          : "⏰ You have been timed out",
      )
      .setDescription(
        `Your timeout status in **${guild.name}** has been ${isRemoval ? "removed" : "updated"}`,
      )
      .setColor(isRemoval ? Colors.Green : Colors.Yellow)
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
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    if (!isRemoval) {
      dmEmbed.addFields({
        name: "Duration",
        value: formatDuration(durationMinutes),
        inline: true,
      });
    }

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Timeout notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
      isRemoval,
    });
  } catch (error) {
    Logger.debug("Could not send timeout notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default defineSlashCommand({
  data: {
    name: "timeout",
    description: "Timeout a member or remove their timeout",
    defaultMemberPermissions: "ModerateMembers",
    options: [
      {
        name: "user",
        description: "The user to timeout",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "duration",
        description:
          "Duration of timeout (1m, 5m, 10m, 1h, 1d, 1w, custom: 30m, 2h, 3d)",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Remove timeout", value: "remove" },
          { name: "1 minute", value: "1m" },
          { name: "5 minutes", value: "5m" },
          { name: "10 minutes", value: "10m" },
          { name: "1 hour", value: "1h" },
          { name: "1 day", value: "1d" },
          { name: "1 week", value: "1w" },
        ],
      },
      {
        name: "custom_duration",
        description:
          "Custom duration (e.g., 30m, 2h, 3d) - only if duration not selected",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "reason",
        description: "Reason for the timeout",
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
    const duration = interaction.options.getString("duration");
    const customDuration = interaction.options.getString("custom_duration");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const silent = interaction.options.getBoolean("silent") ?? false;

    // Parse duration
    let durationMinutes: number | undefined;

    if (duration === "remove") {
      durationMinutes = undefined; // Remove timeout
    } else if (duration) {
      durationMinutes = parseDuration(duration) || undefined;
    } else if (customDuration) {
      durationMinutes = parseDuration(customDuration) || undefined;
      if (!durationMinutes) {
        await interaction.reply({
          content: blockQuote(
            bold("❌ Invalid duration format. Use format like: 30m, 2h, 3d"),
          ),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    } else {
      await interaction.reply({
        content: blockQuote(
          bold("❌ Please specify a duration or select 'Remove timeout'"),
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Validate duration limits (Discord max is 28 days)
    if (durationMinutes && durationMinutes > 40320) {
      // 28 days in minutes
      await interaction.reply({
        content: blockQuote(bold("❌ Timeout duration cannot exceed 28 days")),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get guild member objects
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    // Validate permissions
    const validation = await validateTimeoutPermissions(executor, targetMember);
    if (!validation.canTimeout) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as timeout operation might take time
    await interaction.deferReply();

    // Send notification to user before timing out (if not silent)
    if (!silent && targetMember) {
      await sendTimeoutNotification(
        targetUser,
        {
          name: interaction.guild.name,
          iconURL: () => interaction.guild?.iconURL() ?? null,
        },
        reason,
        executor,
        durationMinutes,
      );
    }

    // Execute timeout (we know targetMember exists due to validation)
    const result = await executeTimeout(
      targetMember as GuildMember,
      executor,
      reason,
      durationMinutes,
    );

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Action by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.user) {
      const isRemoval = result.isRemoval;

      embed
        .setTitle(isRemoval ? "🔓 Timeout Removed" : "⏰ Member Timed Out")
        .setDescription(
          `**${result.user.tag}** has been ${isRemoval ? "released from timeout" : "timed out"}`,
        )
        .setColor(isRemoval ? Colors.Green : Colors.Yellow)
        .addFields(
          {
            name: "User",
            value: `${result.user} (${result.user.tag})`,
            inline: true,
          },
          {
            name: "User ID",
            value: `\`${result.user.id}\``,
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
        .setThumbnail(result.user.displayAvatarURL());

      if (!isRemoval && result.duration) {
        embed.addFields({
          name: "Duration",
          value: formatDuration(result.duration),
          inline: true,
        });
      }
    } else {
      embed
        .setTitle("❌ Timeout Failed")
        .setDescription("Failed to timeout the specified user")
        .setColor(Colors.Red)
        .addFields({
          name: "Error",
          value: result.error || "Unknown error occurred",
          inline: false,
        });
    }

    await interaction.editReply({
      embeds: [embed],
    });

    // Log the command usage
    Logger.info("Timeout command executed", {
      success: result.success,
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      reason,
      durationMinutes,
      isRemoval: result.isRemoval,
      silent,
    });
  },
});
