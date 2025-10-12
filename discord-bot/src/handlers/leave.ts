import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const LeaveCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-leave')
    .setDescription('Leave the voice channel'),
  requiresElevated: true,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const session = bot.getVoiceSession(interaction.guild.id);
    if (!session) {
      await interaction.reply({ content: '❌ Not currently in a voice channel.', ephemeral: true });
      return;
    }

    bot.removeVoiceSession(interaction.guild.id);

    await interaction.reply({ content: '👋 Left the voice channel. Thanks for the chaos!' });
  },
};
