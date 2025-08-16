import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "game",
    description: "Start interactive music games and quizzes",
    options: [
      {
        name: "type",
        description: "Type of music game to start",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "🎵 Guess the Song", value: "guess_song" },
          { name: "🎤 Name that Tune", value: "name_tune" },
          { name: "👤 Guess the Artist", value: "guess_artist" },
          { name: "🔀 Music Quiz", value: "quiz" },
          { name: "🏆 Tournament", value: "tournament" },
        ],
      },
      {
        name: "duration",
        description: "Game duration in minutes",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 60,
      },
      {
        name: "participants",
        description: "Maximum number of participants",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 20,
      },
      {
        name: "genre",
        description: "Music genre for the game",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🎸 Rock", value: "rock" },
          { name: "🎤 Pop", value: "pop" },
          { name: "🎵 Hip Hop", value: "hiphop" },
          { name: "🎹 Classical", value: "classical" },
          { name: "🎺 Jazz", value: "jazz" },
          { name: "🎧 Electronic", value: "electronic" },
          { name: "🤘 Metal", value: "metal" },
          { name: "🎻 Country", value: "country" },
        ],
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement interactive music games
    await interaction.reply({
      content: "🎮 Music games will be implemented with interactive features",
      flags: MessageFlags.Ephemeral,
    });
  },
});
