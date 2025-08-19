import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const play: SlashSubCommand = {
  data: {
    name: "play",
    description:
      "Play music from various sources (YouTube, Spotify, SoundCloud, etc.)",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "query",
        description: "Song name, URL, or search query",
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
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
  async execute(_client, interaction) {
    // TODO: Implement play command with discord-player
    await interaction.reply({
      content: "🎶 The play command will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
};
