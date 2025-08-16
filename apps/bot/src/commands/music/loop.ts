import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const loop: SlashSubCommand = {
  data: {
    name: "loop",
    description: "Control loop and repeat settings",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "mode",
        description: "Loop mode to set",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "🚫 Off", value: "off" },
          { name: "🔂 Track", value: "track" },
          { name: "🔁 Queue", value: "queue" },
        ],
      },
    ],
  },
  async execute(_client, interaction) {
    // TODO: Implement loop controls with discord-player
    await interaction.reply({
      content: "🔁 Loop controls will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
};
