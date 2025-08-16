import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "karaoke",
    description: "Enable/disable karaoke mode (vocal removal)",
    options: [
      {
        name: "enabled",
        description: "Enable or disable karaoke mode",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
      {
        name: "intensity",
        description: "Vocal removal intensity (1-10)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 10,
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement karaoke mode with discord-player filters
    await interaction.reply({
      content: "🎤 Karaoke mode will be implemented with vocal removal filters",
      flags: MessageFlags.Ephemeral,
    });
  },
});
