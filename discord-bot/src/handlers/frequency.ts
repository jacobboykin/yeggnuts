import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const FrequencyCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-frequency')
    .setDescription('Set the playback frequency interval')
    .addIntegerOption((option) =>
      option
        .setName('min')
        .setDescription('Minimum minutes between sounds')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption((option) =>
      option
        .setName('max')
        .setDescription('Maximum minutes between sounds')
        .setRequired(true)
        .setMinValue(1)
    ),
  requiresElevated: true,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
      return;
    }

    const min = interaction.options.getInteger('min', true);
    const max = interaction.options.getInteger('max', true);

    if (min > max) {
      await interaction.reply({ content: '❌ Minimum interval must be less than or equal to maximum interval.', ephemeral: true });
      return;
    }

    try {
      bot.updateSessionFrequency(interaction.guild.id, min, max);
      await interaction.reply({ content: `✅ Updated playback frequency to ${min}-${max} minutes.` });
    } catch (error) {
      await interaction.reply({ content: '❌ ' + (error as Error).message, ephemeral: true });
    }
  },
};
