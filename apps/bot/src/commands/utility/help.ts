import { blockQuote, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "help",
    description: "Get help with the bot commands",
  },
  category: "utility",
  async execute(_client, interaction) {
    await interaction.reply({
      content: `🔧 **Pure Help System**\n${blockQuote("Help command is currently under development.\nUse \`/ping\` to test basic functionality.")}\n\n*More commands coming soon!*`,
      flags: MessageFlags.Ephemeral,
    });
  },
});
