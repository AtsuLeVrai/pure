import type { SlashSubCommand } from "@/types/index.js";
import { defineSlashCommand } from "@/utils/registry.js";
import { autoplay } from "./autoplay.js";
import { controls } from "./controls.js";
import { filters } from "./filters.js";
import { game } from "./game.js";
import { karaoke } from "./karaoke.js";
import { loop } from "./loop.js";
import { lyrics } from "./lyrics.js";
import { play } from "./play.js";
import { playlist } from "./playlist.js";
import { queue } from "./queue.js";
import { radio } from "./radio.js";
import { save } from "./save.js";
import { search } from "./search.js";
import { settings } from "./settings.js";
import { stats } from "./stats.js";
import { voice } from "./voice.js";
import { volume } from "./volume.js";

// Music subcommands for the music command
// Each subcommand handles a specific music-related action
const music: SlashSubCommand[] = [
  autoplay,
  controls,
  filters,
  game,
  karaoke,
  loop,
  lyrics,
  play,
  playlist,
  queue,
  radio,
  save,
  search,
  settings,
  stats,
  voice,
  volume,
];

export default defineSlashCommand({
  data: {
    name: "music",
    description:
      "Advanced music streaming with multi-platform support and queue management",
    options: music.map((subcommand) => subcommand.data),
  },
  category: "music",
  execute: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    // Find the subcommand handler based on the name
    const command = music.find((cmd) => cmd.data.name === subcommand);
    if (command) {
      return command.execute(client, interaction);
    }
  },
});
