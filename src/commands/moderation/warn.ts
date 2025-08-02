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

  // Ajouter le log de modération
  await prisma.moderationLog.create({
    data: {
      log_id: v7(),
      type: "warn",
      target_user_id: userId,
      moderator_id: moderatorId,
      guild_id: guildId,
      reason,
    },
  });

  return warning;
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

export default defineSlashCommand({
  data: {
    name: "warn",
    description: "Issue a warning to a member",
    defaultMemberPermissions: "ModerateMembers",
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
    const reason = interaction.options.getString("reason", true);
    const silent = interaction.options.getBoolean("silent") ?? false;

    // Get guild member objects
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    // Validate permissions
    const validation = await validateWarnPermissions(executor, targetMember);
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
    const result = await executeWarn(targetMember!, executor, reason);

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
          value: `${result.user!} (${result.user?.tag})`,
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
      .setThumbnail(result.user?.displayAvatarURL())
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
    Logger.info("Warn command executed", {
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
  },
});
