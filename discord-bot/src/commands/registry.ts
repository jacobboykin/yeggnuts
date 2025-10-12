import { REST, Routes, ChatInputCommandInteraction } from 'discord.js';
import { Bot } from '../bot/bot';
import { CommandHandler } from './handler';

export class CommandRegistry {
  private commands: Map<string, CommandHandler> = new Map();

  register(handler: CommandHandler): void {
    this.commands.set(handler.data.name, handler);
  }

  registerAll(...handlers: CommandHandler[]): void {
    for (const handler of handlers) {
      this.register(handler);
    }
  }

  async registerWithDiscord(token: string, applicationId: string, guildId?: string): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(token);

    const commandData = Array.from(this.commands.values()).map((handler) => handler.data.toJSON());

    try {
      console.log('Registering slash commands with Discord...');

      if (guildId) {
        // Guild-specific registration (faster, for testing)
        await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
          body: commandData,
        });
        console.log(`Successfully registered ${commandData.length} commands for guild ${guildId}`);
      } else {
        // Global registration
        await rest.put(Routes.applicationCommands(applicationId), {
          body: commandData,
        });
        console.log(`Successfully registered ${commandData.length} global commands`);
      }
    } catch (error) {
      console.error('Failed to register commands:', error);
      throw error;
    }
  }

  async handleInteraction(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    const commandName = interaction.commandName;
    const handler = this.commands.get(commandName);

    if (!handler) {
      console.warn(`Unknown command: ${commandName}`);
      return;
    }

    // Check permissions
    if (handler.requiresElevated && !bot.hasElevatedPermissions(interaction)) {
      await interaction.reply({
        content: '❌ You need elevated permissions to use this command.',
        ephemeral: true,
      });
      return;
    }

    try {
      await handler.execute(interaction, bot);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);

      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: `❌ Error: ${errorMessage}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `❌ Error: ${errorMessage}`,
          ephemeral: true,
        });
      }
    }
  }
}
