import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type Client,
  Colors,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { defineSlashCommand } from "@/types/index.js";
import { Logger } from "@/utils/index.js";

// Utility function to create ping components
function createPingComponents(
  client: Client<true>,
  roundtripLatency: number,
): {
  embed: EmbedBuilder;
  actionRow: ActionRowBuilder<ButtonBuilder>;
} {
  const wsHeartbeat = client.ws.ping;

  // Create the embed
  const embed = new EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setDescription("Bot latency information")
    .setColor(getLatencyColor(wsHeartbeat))
    .addFields(
      {
        name: "Websocket Heartbeat",
        value: `> 🌐 \`${wsHeartbeat}ms\``,
        inline: true,
      },
      {
        name: "API Latency",
        value: `> 📡 \`${Math.round(roundtripLatency)}ms\``,
        inline: true,
      },
      {
        name: "Status",
        value: `> ${getStatusEmoji(wsHeartbeat)} ${getStatusText(wsHeartbeat)}`,
        inline: true,
      },
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({
      iconURL: client.user.displayAvatarURL(),
      text: "Pure Discord Bot | Latency Check",
    })
    .setTimestamp();

  // Create the refresh button
  const button = new ButtonBuilder()
    .setCustomId("ping_refresh")
    .setLabel("Refresh")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("🔄");

  // Create action row
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return { embed, actionRow };
}

// Utility function to determine color based on latency
function getLatencyColor(latency: number): number {
  if (latency < 150) {
    return Colors.Green;
  }

  if (latency < 200) {
    return Colors.Yellow;
  }

  if (latency < 250) {
    return Colors.Orange;
  }

  return Colors.Red;
}

// Utility function to get status emoji based on latency
function getStatusEmoji(latency: number): string {
  if (latency < 150) return "🟢";
  if (latency < 200) return "🟡";
  if (latency < 250) return "🟠";
  return "🔴";
}

// Utility function to get status text based on latency
function getStatusText(latency: number): string {
  if (latency < 150) return "Excellent";
  if (latency < 200) return "Good";
  if (latency < 250) return "Fair";
  return "Poor";
}

// Function to handle the refresh button interaction
async function handleRefresh(
  client: Client<true>,
  buttonInteraction: ButtonInteraction,
): Promise<void> {
  const start = Date.now();

  // Defer the button interaction
  await buttonInteraction.deferUpdate();

  const end = Date.now();
  const newRoundtripLatency = end - start;

  // Create new components with updated latency
  const { embed, actionRow } = createPingComponents(
    client,
    newRoundtripLatency,
  );

  // Update the message
  await buttonInteraction.editReply({
    embeds: [embed],
    components: [actionRow],
  });

  Logger.debug("Ping command refreshed", {
    userId: buttonInteraction.user.id,
    newLatency: newRoundtripLatency,
    wsHeartbeat: client.ws.ping,
  });
}

export default defineSlashCommand({
  data: {
    name: "ping",
    description: "Check the bot's latency and performance",
  },
  category: "utility",
  execute: async (client, interaction) => {
    // Record timestamp when command is received
    const start = Date.now();

    // First response to establish baseline
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Calculate initial latency
    const end = Date.now();
    const roundtripLatency = end - start;

    // Create initial components
    const { embed, actionRow } = createPingComponents(client, roundtripLatency);

    // Send initial response
    const response = await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    });

    // Create component collector for the refresh button
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000, // 5 minutes
      filter: (i) => i.user.id === interaction.user.id, // Only allow original user
    });

    // Handle button interactions
    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "ping_refresh") {
        try {
          await handleRefresh(client, buttonInteraction);
        } catch (error) {
          Logger.error("Error handling ping refresh", {
            error:
              error instanceof Error
                ? {
                    message: error.message,
                    stack: error.stack,
                  }
                : String(error),
            userId: buttonInteraction.user.id,
            interactionId: buttonInteraction.id,
          });

          // Try to respond with error message
          try {
            await buttonInteraction.followUp({
              content: "❌ Failed to refresh ping data. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
          } catch (followUpError) {
            Logger.error("Failed to send error follow-up", { followUpError });
          }
        }
      }
    });

    // Handle collector end
    collector.on("end", async (collected, reason) => {
      Logger.debug("Ping collector ended", {
        collected: collected.size,
        reason,
        userId: interaction.user.id,
      });

      // Disable the button when collector expires
      try {
        const disabledButton = new ButtonBuilder()
          .setCustomId("ping_refresh")
          .setLabel("Refresh")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄")
          .setDisabled(true);

        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          disabledButton,
        );

        await interaction.editReply({
          components: [disabledRow],
        });
      } catch (error) {
        // If we can't disable the button, just log it
        Logger.debug("Could not disable ping button after collector end", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Log initial ping command usage
    Logger.info("Ping command executed", {
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      initialLatency: roundtripLatency,
      wsHeartbeat: client.ws.ping,
    });
  },
});
