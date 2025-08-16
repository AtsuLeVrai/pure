import {
  ApplicationCommandOptionType,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "voice",
    description: "Voice channel controls and management",
    options: [
      {
        name: "action",
        description: "Voice action to perform",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "🔗 Join Channel", value: "join" },
          { name: "👋 Leave Channel", value: "leave" },
          { name: "🚶 Move to Channel", value: "move" },
          { name: "📞 Summon User", value: "summon" },
          { name: "🔇 Disconnect All", value: "disconnect" },
          { name: "ℹ️ Voice Info", value: "info" },
        ],
      },
      {
        name: "channel",
        description: "Voice channel to join/move to",
        type: ApplicationCommandOptionType.Channel,
        required: false,
        channel_types: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
      },
      {
        name: "user",
        description: "User to summon to your voice channel",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "force",
        description: "Force action (admin only)",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement voice channel management with discord-player
    await interaction.reply({
      content:
        "🔊 Voice channel controls will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
});
