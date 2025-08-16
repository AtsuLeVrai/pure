import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "play",
    description:
      "Play music from various sources (YouTube, Spotify, SoundCloud, etc.)",
    options: [
      {
        name: "query",
        description: "Song name, URL, or search query",
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
      {
        name: "source",
        description: "Preferred source for searching",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🎵 YouTube", value: "youtube" },
          { name: "🎧 Spotify", value: "spotify" },
          { name: "🔊 SoundCloud", value: "soundcloud" },
          { name: "🍎 Apple Music", value: "apple" },
          { name: "🎪 Bandcamp", value: "bandcamp" },
        ],
      },
      {
        name: "position",
        description: "Position to add the track in queue",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "⏭️ Play Next", value: "next" },
          { name: "▶️ Play Now (Skip Current)", value: "now" },
          { name: "📋 Add to Queue", value: "queue" },
        ],
      },
      {
        name: "playlist",
        description: "Add to a saved playlist",
        type: ApplicationCommandOptionType.String,
        required: false,
        autocomplete: true,
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement play command with discord-player
    await interaction.reply({
      content: "🎵 Play command will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
});
