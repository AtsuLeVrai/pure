import { styledMessage } from "@/utils/formatters.js";
import { defineSlashCommand } from "@/utils/registry.js";

export default defineSlashCommand({
  data: {
    name: "help",
    description: "Get help with available commands",
  },
  category: "utility",
  execute: async (_client, interaction) => {
    await interaction.reply(
      styledMessage(
        ":wave: Here is a list of available commands. Use `/help <command>` for more details on a specific command.",
      ),
    );
  },
});
