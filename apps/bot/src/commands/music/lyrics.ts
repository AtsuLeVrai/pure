import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "lyrics",
    description: "Get lyrics for songs",
    options: [
      {
        name: "song",
        description:
          "Song to get lyrics for (leave empty for current playing track)",
        type: ApplicationCommandOptionType.String,
        required: false,
        autocomplete: true,
      },
      {
        name: "artist",
        description: "Artist name (helps with accuracy)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "format",
        description: "Lyrics display format",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "📄 Full Lyrics", value: "full" },
          { name: "📝 Current Section", value: "current" },
          { name: "🎵 Synchronized", value: "synced" },
          { name: "🔗 Link Only", value: "link" },
        ],
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement lyrics search with discord-player lyrics feature
    await interaction.reply({
      content:
        "📝 Lyrics search will be implemented with discord-player lyrics API",
      flags: MessageFlags.Ephemeral,
    });
  },
});
