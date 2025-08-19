import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const save: SlashSubCommand = {
  data: {
    name: "save",
    description: "Save and manage favorite tracks",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "action",
        description: "Save action to perform",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "💾 Save Current", value: "current" },
          { name: "📋 My Saved", value: "list" },
          { name: "▶️ Play Saved", value: "play" },
          { name: "❌ Remove", value: "remove" },
          { name: "📤 Share", value: "share" },
          { name: "📥 Import", value: "import" },
        ],
      },
      {
        name: "name",
        description: "Custom name for saved track",
        type: ApplicationCommandOptionType.String,
        required: false,
        max_length: 100,
      },
      {
        name: "category",
        description: "Category to save track in",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "❤️ Favorites", value: "favorites" },
          { name: "🎵 Chill", value: "chill" },
          { name: "🎉 Party", value: "party" },
          { name: "💼 Work", value: "work" },
          { name: "🏃 Workout", value: "workout" },
          { name: "😴 Sleep", value: "sleep" },
          { name: "📚 Study", value: "study" },
        ],
      },
      {
        name: "position",
        description: "Position in saved list (for removal)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
      },
    ],
  },
  async execute(_client, interaction) {
    // TODO: Implement track saving with database
    await interaction.reply({
      content: "💾 Track saving will be implemented with personal collections",
      flags: MessageFlags.Ephemeral,
    });
  },
};
