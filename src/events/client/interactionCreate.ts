import {
  chatInputApplicationCommandMention,
  inlineCode,
  MessageFlags,
} from "discord.js";
import { styledMessage } from "@/utils/formatters.js";
import { Logger } from "@/utils/logger.js";
import {
  buttonRegistry,
  commandIds,
  commandRegistry,
  defineEvent,
} from "@/utils/registry.js";

export default defineEvent({
  name: "interactionCreate",
  execute: async (client, interaction) => {
    if (interaction.isAutocomplete()) {
      const command = commandRegistry.get(interaction.commandName);

      if (command && "autocomplete" in command && command.autocomplete) {
        try {
          await command.autocomplete(client, interaction);
        } catch (error) {
          Logger.error(
            `Error in autocomplete for '${interaction.commandName}'`,
            {
              error:
                error instanceof Error
                  ? { message: error.message, stack: error.stack }
                  : String(error),
              commandName: interaction.commandName,
              userId: interaction.user.id,
              guildId: interaction.guildId,
            },
          );
        }
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      const command = commandRegistry.get(interaction.commandName);

      if (!command) {
        const helpCommand = commandIds.get("help");
        const helpMention = helpCommand
          ? chatInputApplicationCommandMention(helpCommand.name, helpCommand.id)
          : inlineCode("/help");

        await interaction.reply({
          content: styledMessage(
            `Unknown command. Use ${helpMention} to see available commands.`,
          ),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      try {
        await command.execute(client, interaction);
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

        const errorMessage = styledMessage(
          "There was an error while executing this command.",
        );

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await interaction.reply({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (replyError) {
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

    if (interaction.isButton()) {
      const button = buttonRegistry.get(interaction.customId);

      if (!button) {
        await interaction.reply({
          content: styledMessage(
            "This button is no longer available or has expired.",
          ),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      try {
        await button.execute(client, interaction);
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

        const errorMessage = styledMessage(
          "There was an error while processing this button interaction.",
        );

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await interaction.reply({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (replyError) {
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

    if (interaction.isAnySelectMenu()) {
      await interaction.reply({
        content: styledMessage(
          "Select menu interactions are not implemented yet.",
        ),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (interaction.isModalSubmit()) {
      await interaction.reply({
        content: styledMessage("Modal interactions are not implemented yet."),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
