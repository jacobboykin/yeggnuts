import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const SoundsCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-sounds')
    .setDescription('List all available soundboard sounds'),
  requiresElevated: false,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    try {
      // Refresh cache first
      await bot.soundboard.refreshCache(interaction.guild.id);
      const sounds = bot.soundboard.getCachedSounds(interaction.guild.id);

      if (!sounds || sounds.length === 0) {
        await interaction.reply({
          content:
            '❌ No sounds available in this server. Add some in Server Settings → Soundboard!',
          ephemeral: true,
        });
        return;
      }

      const available = sounds.filter((s) => s.available);
      if (available.length === 0) {
        await interaction.reply({
          content: '❌ No available sounds in this server.',
          ephemeral: true,
        });
        return;
      }

      // Create embed with sound list
      const embed = new EmbedBuilder()
        .setTitle(`Available Sounds (${available.length})`)
        .setColor(0x00ff00)
        .setDescription(
          available
            .map((s) => {
              const emoji = s.emoji_name ? `${s.emoji_name} ` : '';
              return `${emoji}**${s.name}**`;
            })
            .join('\n')
        )
        .setFooter({ text: 'Use /yeggnuts soundboard-goof play <sound> to play a specific sound' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to fetch sounds:', error);
      await interaction.reply({
        content: '❌ Failed to fetch sounds. Try again later.',
        ephemeral: true,
      });
    }
  },
};
