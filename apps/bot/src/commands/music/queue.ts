import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const queue: SlashSubCommand = {
  data: {
    name: "queue",
    description: "Manage the music queue",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "action",
        description: "Action to perform on the queue",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "📋 Show Queue", value: "show" },
          { name: "🔀 Shuffle", value: "shuffle" },
          { name: "🗑️ Clear All", value: "clear" },
          { name: "🔄 Reverse Order", value: "reverse" },
          { name: "💾 Save as Playlist", value: "save" },
          { name: "📊 Stats", value: "stats" },
        ],
      },
      {
        name: "page",
        description: "Page number for queue display (10 tracks per page)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 100,
      },
      {
        name: "remove",
        description: "Position of track to remove (use with show action)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
      },
      {
        name: "move_from",
        description: "Current position of track to move",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
      },
      {
        name: "move_to",
        description: "New position for the track",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
      },
      {
        name: "playlist_name",
        description: "Name for saved playlist (required when saving)",
        type: ApplicationCommandOptionType.String,
        required: false,
        max_length: 50,
      },
    ],
  },
  async execute(_client, interaction) {
    // TODO: Implement queue management with discord-player
    await interaction.reply({
      content: "📋 Queue management will be implemented with discord-player",
      flags: MessageFlags.Ephemeral,
    });
  },
};
