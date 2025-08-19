import {
  ApplicationCommandOptionType,
  ChannelType,
  MessageFlags,
} from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const settings: SlashSubCommand = {
  data: {
    name: "settings",
    description: "Configure music bot settings for this server",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "action",
        description: "Settings action to perform",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "📋 View Settings", value: "view" },
          { name: "🎵 Setup Music", value: "setup" },
          { name: "📝 Edit Setting", value: "edit" },
          { name: "🔄 Reset to Default", value: "reset" },
          { name: "📤 Export Config", value: "export" },
          { name: "📥 Import Config", value: "import" },
        ],
      },
      {
        name: "setting",
        description: "Setting to modify",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🎵 Music Channel", value: "music_channel" },
          { name: "🎧 DJ Role", value: "dj_role" },
          { name: "🔊 Default Volume", value: "default_volume" },
          { name: "🗳️ Vote Skip", value: "vote_skip" },
          { name: "📊 Vote Threshold", value: "vote_threshold" },
          { name: "📋 Max Queue Size", value: "max_queue" },
          { name: "⏰ Max Track Duration", value: "max_duration" },
          { name: "🚪 Auto Leave", value: "auto_leave" },
          { name: "⏱️ Leave Timeout", value: "leave_timeout" },
        ],
      },
      {
        name: "channel",
        description: "Channel for music commands",
        type: ApplicationCommandOptionType.Channel,
        required: false,
        channel_types: [ChannelType.GuildText, ChannelType.GuildVoice],
      },
      {
        name: "role",
        description: "DJ role for advanced commands",
        type: ApplicationCommandOptionType.Role,
        required: false,
      },
      {
        name: "value",
        description: "New value for the setting",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "enabled",
        description: "Enable/disable the setting",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  async execute(_client, interaction) {
    // TODO: Implement music settings with database integration
    await interaction.reply({
      content: "⚙️ Music settings will be implemented with database integration",
      flags: MessageFlags.Ephemeral,
    });
  },
};
