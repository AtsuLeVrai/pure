import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const search: SlashSubCommand = {
  data: {
    name: "search",
    description: "Search for music with interactive selection",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "query",
        description: "Search query for music",
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
      {
        name: "source",
        description: "Source to search in",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🎵 YouTube", value: "youtube" },
          { name: "🎧 Spotify", value: "spotify" },
          { name: "🔊 SoundCloud", value: "soundcloud" },
          { name: "🍎 Apple Music", value: "apple" },
          { name: "🎪 Bandcamp", value: "bandcamp" },
          { name: "🎬 Vimeo", value: "vimeo" },
        ],
      },
      {
        name: "filter",
        description: "Search filter options",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🎵 Songs Only", value: "songs" },
          { name: "📀 Albums", value: "albums" },
          { name: "📋 Playlists", value: "playlists" },
          { name: "👤 Artists", value: "artists" },
          { name: "🎬 Videos", value: "videos" },
          { name: "🎧 Podcasts", value: "podcasts" },
        ],
      },
      {
        name: "limit",
        description: "Number of results to show (1-25)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 25,
      },
    ],
  },
  async execute(_client, interaction) {
    // TODO: Implement interactive search with discord-player
    await interaction.reply({
      content: "🔍 Interactive search will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
};
