import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const volume: SlashSubCommand = {
  data: {
    name: "volume",
    description: "Control playback volume",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "action",
        description: "Volume action to perform",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🔊 Set Volume", value: "set" },
          { name: "📈 Volume Up (+10)", value: "up" },
          { name: "📉 Volume Down (-10)", value: "down" },
          { name: "🔇 Mute", value: "mute" },
          { name: "🔉 Unmute", value: "unmute" },
        ],
      },
      {
        name: "level",
        description: "Volume level (0-200%)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 0,
        max_value: 200,
      },
    ],
  },
  async execute(_client, interaction) {
    // TODO: Implement volume controls with discord-player
    await interaction.reply({
      content: "🔊 Volume controls will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
};
