import { blockQuote, type Client, EmbedBuilder } from "discord.js";
import { emojify } from "node-emoji";

// Utility function to format a message with bold text and block quote
export const styledMessage = (text: string): string =>
  blockQuote(emojify(text));

// Embed for styled messages, using a specific color
export const styledEmbed = (client: Client<true>) =>
  new EmbedBuilder()
    .setColor(0xff8a80)
    .setFooter({
      text: `${client.user.username} • Simple, Powerful, and Free`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();
