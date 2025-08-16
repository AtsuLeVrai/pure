import { MessageFlags } from "discord-api-types/v10";
import { defineSlashCommand, styledEmbed } from "@/utils/index.js";

export default defineSlashCommand({
  data: {
    name: "help",
    description: "Get help with available commands",
  },
  category: "utility",
  execute: async (client, interaction) => {
    await interaction.reply({
      embeds: [styledEmbed(client)],
      flags: MessageFlags.Ephemeral,
    });
  },
});
