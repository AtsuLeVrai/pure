import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { defineSlashCommand } from "@/types/index.js";

export default defineSlashCommand({
  data: {
    name: "radio",
    description: "Start radio mode with continuous music streaming",
    options: [
      {
        name: "action",
        description: "Radio action to perform",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "▶️ Start Radio", value: "start" },
          { name: "⏹️ Stop Radio", value: "stop" },
          { name: "🔀 Change Station", value: "change" },
          { name: "📻 List Stations", value: "list" },
          { name: "❤️ Favorite Station", value: "favorite" },
        ],
      },
      {
        name: "genre",
        description: "Radio station genre",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🎸 Rock Radio", value: "rock" },
          { name: "🎤 Pop Hits", value: "pop" },
          { name: "🎵 Hip Hop", value: "hiphop" },
          { name: "🎹 Classical", value: "classical" },
          { name: "🎺 Jazz Lounge", value: "jazz" },
          { name: "🎧 Electronic", value: "electronic" },
          { name: "🎶 Lo-Fi Chill", value: "lofi" },
          { name: "🌧️ Ambient", value: "ambient" },
          { name: "🎪 Indie", value: "indie" },
          { name: "🕺 Dance", value: "dance" },
        ],
      },
      {
        name: "country",
        description: "Radio station country/region",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🇺🇸 USA", value: "usa" },
          { name: "🇬🇧 UK", value: "uk" },
          { name: "🇫🇷 France", value: "france" },
          { name: "🇩🇪 Germany", value: "germany" },
          { name: "🇯🇵 Japan", value: "japan" },
          { name: "🇰🇷 Korea", value: "korea" },
          { name: "🌍 Global", value: "global" },
        ],
      },
    ],
  },
  category: "music",
  subcommand: true,
  async execute(_client, interaction) {
    // TODO: Implement radio mode with streaming stations
    await interaction.reply({
      content: "📻 Radio mode will be implemented with live streaming stations",
      flags: MessageFlags.Ephemeral,
    });
  },
});
