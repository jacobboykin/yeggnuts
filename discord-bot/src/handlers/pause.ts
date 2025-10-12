import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const PauseCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-pause')
    .setDescription('Pause random sound playback'),
  requiresElevated: true,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    try {
      bot.pauseSession(interaction.guild.id);
      await interaction.reply({
        content: '⏸️ Paused random playback. Use `/yeggnuts-resume` to continue.',
      });
    } catch (error) {
      await interaction.reply({ content: `❌ ${(error as Error).message}`, ephemeral: true });
    }
  },
};
