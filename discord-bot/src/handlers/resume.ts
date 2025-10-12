import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const ResumeCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-resume')
    .setDescription('Resume random sound playback'),
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
      bot.resumeSession(interaction.guild.id);
      await interaction.reply({ content: '▶️ Resumed random playback. Let the chaos continue!' });
    } catch (error) {
      await interaction.reply({ content: `❌ ${(error as Error).message}`, ephemeral: true });
    }
  },
};
