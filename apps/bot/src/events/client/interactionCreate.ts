import {
  type APIApplicationCommand,
  chatInputApplicationCommandMention,
  inlineCode,
  MessageFlags,
  Routes,
} from "discord.js";
import {
  commandRegistry,
  defineEvent,
  Logger,
  styledMessage,
} from "@/utils/index.js";

export default defineEvent({
  name: "interactionCreate",
  execute: async (client, interaction) => {
    // Only handle slash commands for now
    if (!interaction.isChatInputCommand()) return;

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
      const applicationCommands = (await client.rest.get(
        interaction.guildId
          ? Routes.applicationGuildCommands(client.user.id, interaction.guildId)
          : Routes.applicationCommands(client.user.id),
      )) as APIApplicationCommand[];
      const helpCommand = applicationCommands.find(
        (cmd) => cmd.name === "help",
      );

      // Respond to unknown command
      await interaction.reply({
        content: styledMessage(
          `❌ Unknown command. Use ${helpCommand ? chatInputApplicationCommandMention(helpCommand.name, helpCommand.id) : inlineCode("/help")} to see available commands.`,
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
