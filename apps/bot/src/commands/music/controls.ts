import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "controls",
    description: "Control music playback (pause, resume, skip, stop, etc.)",
    options: [
      {
        name: "action",
        description: "Playback action to perform",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "⏸️ Pause", value: "pause" },
          { name: "▶️ Resume", value: "resume" },
          { name: "⏭️ Skip", value: "skip" },
          { name: "⏮️ Previous", value: "previous" },
          { name: "⏹️ Stop", value: "stop" },
          { name: "🔄 Replay", value: "replay" },
          { name: "🎵 Now Playing", value: "nowplaying" },
        ],
      },
      {
        name: "skip_count",
        description: "Number of tracks to skip (default: 1)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 50,
      },
      {
        name: "seek_time",
        description: "Time to seek to (format: mm:ss or seconds)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement playback controls with discord-player
    await interaction.reply({
      content: "🎮 Playback controls will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
});
