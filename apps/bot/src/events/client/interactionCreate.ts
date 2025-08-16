import {
  chatInputApplicationCommandMention,
  inlineCode,
  MessageFlags,
} from "discord.js";
import {
  buttonRegistry,
  commandIds, // Make sure to import buttonRegistry
  commandRegistry,
  defineEvent,
  Logger,
  styledMessage,
} from "@/utils/index.js";

export default defineEvent({
  name: "interactionCreate",
  execute: async (client, interaction) => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      // Find the command in registry
      const command = commandRegistry.get(interaction.commandName);
      if (!command) {
        Logger.warn(`Unknown command attempted: ${interaction.commandName}`, {
          commandName: interaction.commandName,
          interactionId: interaction.id,
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });

        // Fetch the help command to provide a link to available commands
        const helpCommand = commandIds.get("help");
        const helpMention = helpCommand
          ? chatInputApplicationCommandMention(helpCommand.name, helpCommand.id)
          : inlineCode("/help");

        // Respond to unknown command
        await interaction.reply({
          content: styledMessage(
            `❌ Unknown command. Use ${helpMention} to see available commands.`,
          ),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Log command execution for monitoring
      Logger.info(`Command executed: ${interaction.commandName}`, {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        interactionId: interaction.id,
      });

      try {
        // Execute the command
        await command.execute(client, interaction);

        // Log successful execution (optional, for monitoring)
        Logger.debug(
          `Command completed successfully: ${interaction.commandName}`,
          {
            commandName: interaction.commandName,
            userId: interaction.user.id,
            executionTime: Date.now(), // You could add actual timing
          },
        );
      } catch (error) {
        Logger.error(`Error executing command '${interaction.commandName}'`, {
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                }
              : String(error),
          commandName: interaction.commandName,
          interactionId: interaction.id,
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });

        // Handle error response safely
        const errorMessage = styledMessage(
          "❌ There was an error while executing this command.",
        );

        try {
          if (interaction.replied || interaction.deferred) {
            // If already replied/deferred, use followUp
            await interaction.followUp({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            // If not replied yet, use reply
            await interaction.reply({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (replyError) {
          // If even the error reply fails, just log it
          Logger.error("Failed to send error message to user", {
            originalError:
              error instanceof Error ? error.message : String(error),
            replyError:
              replyError instanceof Error
                ? replyError.message
                : String(replyError),
            interactionId: interaction.id,
          });
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      // Find the button handler in registry
      const button = buttonRegistry.get(interaction.customId);
      if (!button) {
        Logger.warn(`Unknown button interaction: ${interaction.customId}`, {
          customId: interaction.customId,
          interactionId: interaction.id,
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });

        // Respond to unknown button
        await interaction.reply({
          content: styledMessage(
            "❌ This button is no longer available or has expired.",
          ),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Log button interaction for monitoring
      Logger.info(`Button interaction executed: ${interaction.customId}`, {
        customId: interaction.customId,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        interactionId: interaction.id,
        messageId: interaction.message.id,
      });

      try {
        // Execute the button handler
        await button.execute(client, interaction);

        // Log successful execution
        Logger.debug(
          `Button interaction completed successfully: ${interaction.customId}`,
          {
            customId: interaction.customId,
            userId: interaction.user.id,
            executionTime: Date.now(),
          },
        );
      } catch (error) {
        Logger.error(`Error executing button '${interaction.customId}'`, {
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                }
              : String(error),
          customId: interaction.customId,
          interactionId: interaction.id,
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });

        // Handle error response safely
        const errorMessage = styledMessage(
          "❌ There was an error while processing this button interaction.",
        );

        try {
          if (interaction.replied || interaction.deferred) {
            // If already replied/deferred, use followUp
            await interaction.followUp({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            // If not replied yet, use reply
            await interaction.reply({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (replyError) {
          // If even the error reply fails, just log it
          Logger.error("Failed to send error message for button interaction", {
            originalError:
              error instanceof Error ? error.message : String(error),
            replyError:
              replyError instanceof Error
                ? replyError.message
                : String(replyError),
            interactionId: interaction.id,
          });
        }
      }
    }

    // Handle select menu interactions (optional)
    if (interaction.isAnySelectMenu()) {
      Logger.info(`Select menu interaction: ${interaction.customId}`, {
        customId: interaction.customId,
        values: interaction.values,
        userId: interaction.user.id,
        interactionId: interaction.id,
      });

      // TODO: Implement select menu handling if needed
      await interaction.reply({
        content: styledMessage(
          "🚧 Select menu interactions are not implemented yet.",
        ),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Handle modal interactions (optional)
    if (interaction.isModalSubmit()) {
      Logger.info(`Modal submit interaction: ${interaction.customId}`, {
        customId: interaction.customId,
        userId: interaction.user.id,
        interactionId: interaction.id,
      });

      // TODO: Implement modal handling if needed
      await interaction.reply({
        content: styledMessage(
          "🚧 Modal interactions are not implemented yet.",
        ),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
