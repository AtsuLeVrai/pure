import {
  chatInputApplicationCommandMention,
  inlineCode,
  MessageFlags,
} from "discord.js";
import {
  buttonRegistry,
  commandIds,
  commandRegistry,
  defineEvent,
  Logger,
  styledMessage,
} from "@/utils/index.js";

const PERFORMANCE_THRESHOLD = 2000;

function createTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

export default defineEvent({
  name: "interactionCreate",
  execute: async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commandRegistry.get(interaction.commandName);

      if (!command) {
        Logger.warn(`Unknown command attempted: ${interaction.commandName}`, {
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });

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

      const timer = createTimer();

      try {
        await command.execute(client, interaction);

        const executionTime = timer();
        if (executionTime > PERFORMANCE_THRESHOLD) {
          Logger.warn(`Slow command execution: ${interaction.commandName}`, {
            executionTime: `${executionTime}ms`,
            userId: interaction.user.id,
            threshold: `${PERFORMANCE_THRESHOLD}ms`,
          });
        }
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
          executionTime: `${timer()}ms`,
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
        Logger.warn(`Unknown button interaction: ${interaction.customId}`, {
          customId: interaction.customId,
          userId: interaction.user.id,
          messageId: interaction.message.id,
        });

        await interaction.reply({
          content: styledMessage(
            "This button is no longer available or has expired.",
          ),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const timer = createTimer();

      try {
        await button.execute(client, interaction);

        const executionTime = timer();
        if (executionTime > PERFORMANCE_THRESHOLD) {
          Logger.warn(`Slow button execution: ${interaction.customId}`, {
            executionTime: `${executionTime}ms`,
            userId: interaction.user.id,
          });
        }
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
          executionTime: `${timer()}ms`,
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
