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

// Define the structure for nickname result
interface NicknameResult {
  success: boolean;
  error?: string;
  member?: GuildMember;
  user?: User;
  previousNickname?: string | null;
  newNickname?: string | null;
  wasReset?: boolean;
}

// Utility function to validate nickname permissions
function validateNicknamePermissions(
  executor: GuildMember,
  target: GuildMember | null,
): { canChangeNickname: boolean; reason?: string } {
  // Check if target is in the guild
  if (!target) {
    return {
      canChangeNickname: false,
      reason: "User is not in this server",
    };
  }

  // Check if target nickname is manageable
  if (!target.manageable) {
    return {
      canChangeNickname: false,
      reason:
        "This member's nickname cannot be changed (higher role or bot owner)",
    };
  }

  // Check role hierarchy
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return {
      canChangeNickname: false,
      reason:
        "You cannot change the nickname of someone with equal or higher role",
    };
  }

  // Check if target is guild owner
  if (target.id === target.guild.ownerId) {
    return {
      canChangeNickname: false,
      reason: "Cannot change the guild owner's nickname",
    };
  }

  return { canChangeNickname: true };
}

// Utility function to validate nickname content
function validateNickname(nickname: string): {
  isValid: boolean;
  reason?: string;
} {
  // Check length (Discord limit is 32 characters)
  if (nickname.length > 32) {
    return {
      isValid: false,
      reason: "Nickname cannot be longer than 32 characters",
    };
  }

  // Check for empty nickname after trimming
  const trimmed = nickname.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      reason: "Nickname cannot be empty or only whitespace",
    };
  }

  // Check for Discord markdown characters that could be problematic
  const problematicChars = ["@", "#", ":", "```"];
  const hasProblematicChars = problematicChars.some((char) =>
    trimmed.includes(char),
  );

  if (hasProblematicChars) {
    return {
      isValid: false,
      reason: "Nickname cannot contain @, #, :, or ``` characters",
    };
  }

  return { isValid: true };
}

// Utility function to execute nickname change
async function executeNicknameChange(
  targetMember: GuildMember,
  executor: GuildMember,
  newNickname: string | null,
  reason: string,
): Promise<NicknameResult> {
  try {
    const previousNickname = targetMember.nickname;
    const isReset = newNickname === null;

    // Set the new nickname (null resets to username)
    await targetMember.setNickname(
      newNickname,
      `${reason} | ${isReset ? "Reset" : "Changed"} by: ${executor.user.tag} (${executor.id})`,
    );

    Logger.info("Member nickname changed successfully", {
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      previousNickname,
      newNickname,
      isReset,
      reason,
    });

    return {
      success: true,
      member: targetMember,
      user: targetMember.user,
      previousNickname,
      newNickname,
      wasReset: isReset,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Logger.error("Failed to change member nickname", {
      targetId: targetMember.id,
      targetTag: targetMember.user.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: executor.guild.id,
      newNickname,
      error: errorMessage,
      reason,
    });

    return { success: false, error: errorMessage };
  }
}

// Utility function to send nickname change notification to user
async function sendNicknameNotification(
  user: User,
  guild: { name: string; iconURL: () => string | null },
  previousNickname: string | null,
  newNickname: string | null,
  reason: string,
  executor: GuildMember,
): Promise<void> {
  try {
    const isReset = newNickname === null;

    const dmEmbed = new EmbedBuilder()
      .setTitle("📝 Your nickname has been changed")
      .setDescription(
        `Your nickname in **${guild.name}** has been ${isReset ? "reset" : "changed"}`,
      )
      .setColor(Colors.Blue)
      .addFields(
        {
          name: "Previous Nickname",
          value: previousNickname || user.username,
          inline: true,
        },
        {
          name: "New Nickname",
          value: newNickname || user.username,
          inline: true,
        },
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

    await user.send({ embeds: [dmEmbed] });

    Logger.debug("Nickname change notification sent to user", {
      userId: user.id,
      guildId: executor.guild.id,
    });
  } catch (error) {
    Logger.debug("Could not send nickname change notification to user", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default defineSlashCommand({
  data: {
    name: "nickname",
    description: "Change or reset a member's nickname",
    defaultMemberPermissions: "ManageNicknames",
    options: [
      {
        name: "user",
        description: "The user whose nickname to change",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "nickname",
        description: "New nickname (leave empty to reset to username)",
        type: ApplicationCommandOptionType.String,
        required: false,
        maxLength: 32,
      },
      {
        name: "reason",
        description: "Reason for changing the nickname",
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
    const newNickname = interaction.options.getString("nickname");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const silent = interaction.options.getBoolean("silent") ?? false;

    // Validate nickname if provided
    if (newNickname) {
      const nicknameValidation = validateNickname(newNickname);
      if (!nicknameValidation.isValid) {
        await interaction.reply({
          content: blockQuote(bold(`❌ ${nicknameValidation.reason}`)),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    // Get guild member objects
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    // Validate permissions
    const validation = validateNicknamePermissions(executor, targetMember);
    if (!validation.canChangeNickname) {
      await interaction.reply({
        content: blockQuote(bold(`❌ ${validation.reason}`)),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if nickname is actually changing
    const currentNickname = targetMember?.nickname;
    if (currentNickname === newNickname) {
      await interaction.reply({
        content: blockQuote(
          bold(`❌ ${targetUser.tag} already has that nickname`),
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer reply as nickname operation might take time
    await interaction.deferReply();

    // Execute nickname change (we know targetMember exists due to validation)
    const result = await executeNicknameChange(
      targetMember as GuildMember,
      executor,
      newNickname?.trim() || null,
      reason,
    );

    // Send notification to user (if not silent and change was successful)
    if (!silent && result.success && result.user) {
      await sendNicknameNotification(
        result.user,
        {
          name: interaction.guild.name,
          iconURL: () => interaction.guild?.iconURL() ?? null,
        },
        result.previousNickname || null,
        result.newNickname || null,
        reason,
        executor,
      );
    }

    // Create and send response embed
    const embed = new EmbedBuilder().setTimestamp().setFooter({
      text: `Changed by ${executor.user.tag}`,
      iconURL: executor.user.displayAvatarURL(),
    });

    if (result.success && result.user) {
      const isReset = result.wasReset;

      embed
        .setTitle(isReset ? "📝 Nickname Reset" : "📝 Nickname Changed")
        .setDescription(
          `**${result.user.tag}**'s nickname has been ${isReset ? "reset" : "changed"}`,
        )
        .setColor(Colors.Blue)
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
            name: "Previous Nickname",
            value: result.previousNickname || result.user.username,
            inline: true,
          },
          {
            name: "New Nickname",
            value: result.newNickname || result.user.username,
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
    } else {
      embed
        .setTitle("❌ Nickname Change Failed")
        .setDescription("Failed to change the specified user's nickname")
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
    Logger.info("Nickname command executed", {
      success: result.success,
      targetId: targetUser.id,
      targetTag: targetUser.tag,
      executorId: executor.id,
      executorTag: executor.user.tag,
      guildId: interaction.guild.id,
      previousNickname: result.previousNickname,
      newNickname: result.newNickname,
      wasReset: result.wasReset,
      reason,
      silent,
    });
  },
});
