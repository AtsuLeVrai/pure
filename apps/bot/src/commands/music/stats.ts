import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SlashSubCommand } from "@/types/index.js";

export const stats: SlashSubCommand = {
  data: {
    name: "stats",
    description: "View music statistics and analytics",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: "type",
        description: "Type of statistics to view",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "📊 Server Stats", value: "server" },
          { name: "👤 Personal Stats", value: "personal" },
          { name: "🏆 Top Tracks", value: "top_tracks" },
          { name: "👥 Top Users", value: "top_users" },
          { name: "📈 Usage Trends", value: "trends" },
          { name: "🕐 History", value: "history" },
          { name: "🤖 Bot Statistics", value: "bot" },
        ],
      },
      {
        name: "period",
        description: "Time period for statistics",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "📅 Today", value: "today" },
          { name: "📆 This Week", value: "week" },
          { name: "🗓️ This Month", value: "month" },
          { name: "📊 All Time", value: "all" },
          { name: "🕒 Last 24h", value: "24h" },
          { name: "📋 Last 7 days", value: "7d" },
          { name: "📈 Last 30 days", value: "30d" },
        ],
      },
      {
        name: "user",
        description: "User to view stats for",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "limit",
        description: "Number of results to show (1-50)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 50,
      },
      {
        name: "format",
        description: "Statistics display format",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "📋 Embed", value: "embed" },
          { name: "📊 Chart", value: "chart" },
          { name: "📄 Text", value: "text" },
          { name: "📥 CSV Export", value: "csv" },
        ],
      },
    ],
  },
  async execute(_client, interaction) {
    // TODO: Implement music statistics with database analytics
    await interaction.reply({
      content:
        "📊 Music statistics will be implemented with database analytics",
      flags: MessageFlags.Ephemeral,
    });
  },
};
