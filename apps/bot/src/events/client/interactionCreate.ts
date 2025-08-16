import { MessageFlags } from "discord.js";
import { defineEvent } from "@/types/index.js";
import { commandExecutionMap, Logger } from "@/utils/index.js";

export default defineEvent({
  name: "interactionCreate",
  execute: async (client, interaction) => {
    // Only handle slash commands for now
    if (!interaction.isChatInputCommand()) return;

    // Determine the command key for execution map lookup
    let commandKey: string;
    if (interaction.options.getSubcommand(false)) {
      // This is a subcommand: format is "commandName:subcommandName"
      const subcommandName = interaction.options.getSubcommand();
      commandKey = `${interaction.commandName}:${subcommandName}`;
    } else {
      // This is a standalone command
      commandKey = interaction.commandName;
    }

    // Find the command executor in the execution map
    const commandExecutor = commandExecutionMap.get(commandKey);

    if (!commandExecutor) {
      Logger.warn(`Unknown command attempted: ${commandKey}`, {
        commandKey,
        commandName: interaction.commandName,
        subcommand: interaction.options.getSubcommand(false),
        interactionId: interaction.id,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      // Respond to unknown command
      await interaction.reply({
        content: "❌ Unknown command. Use `/help` to see available commands.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Log command execution for monitoring
    Logger.info(`Command executed: ${commandKey}`, {
      commandKey,
      commandName: interaction.commandName,
      subcommand: interaction.options.getSubcommand(false),
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      interactionId: interaction.id,
    });

    try {
      // Execute the command
      await commandExecutor(client, interaction);

      // Log successful execution (optional, for monitoring)
      Logger.debug(`Command completed successfully: ${commandKey}`, {
        commandKey,
        commandName: interaction.commandName,
        subcommand: interaction.options.getSubcommand(false),
        userId: interaction.user.id,
        executionTime: Date.now(), // You could add actual timing
      });
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
      const errorMessage =
        "❌ There was an error while executing this command.";

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
          originalError: error instanceof Error ? error.message : String(error),
          replyError:
            replyError instanceof Error
              ? replyError.message
              : String(replyError),
          interactionId: interaction.id,
        });
      }
    }
  },
});
