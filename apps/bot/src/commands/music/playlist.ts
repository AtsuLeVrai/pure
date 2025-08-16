import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "playlist",
    description: "Manage personal and server playlists",
    options: [
      {
        name: "action",
        description: "Playlist action to perform",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "📋 List Playlists", value: "list" },
          { name: "➕ Create New", value: "create" },
          { name: "▶️ Play Playlist", value: "play" },
          { name: "📝 Add Current Track", value: "add" },
          { name: "❌ Remove Track", value: "remove" },
          { name: "🗑️ Delete Playlist", value: "delete" },
          { name: "📤 Share Playlist", value: "share" },
          { name: "📥 Import External", value: "import" },
          { name: "ℹ️ Info", value: "info" },
          { name: "✏️ Rename", value: "rename" },
        ],
      },
      {
        name: "name",
        description: "Playlist name",
        type: ApplicationCommandOptionType.String,
        required: false,
        autocomplete: true,
        max_length: 50,
      },
      {
        name: "description",
        description: "Playlist description",
        type: ApplicationCommandOptionType.String,
        required: false,
        max_length: 200,
      },
      {
        name: "position",
        description: "Track position to remove (1-based index)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
      },
      {
        name: "url",
        description: "External playlist URL to import (Spotify, YouTube, etc.)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "public",
        description: "Make playlist public/private",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
      {
        name: "collaborative",
        description: "Allow others to edit playlist",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement playlist management with database integration
    await interaction.reply({
      content:
        "💾 Playlist management will be implemented with database integration",
      flags: MessageFlags.Ephemeral,
    });
  },
});
