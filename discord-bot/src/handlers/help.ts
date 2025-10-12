import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';

export const HelpCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-help')
    .setDescription('Show help information about the bot'),
  requiresElevated: false,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('Yeggnuts Bot Help')
      .setDescription(
        "A bot that randomly plays sounds from your server's soundboard at unpredictable intervals."
      )
      .setColor(0x5865f2)
      .addFields(
        {
          name: 'New Subcommand Path',
          value: [
            '`/yeggnuts soundboard-goof join` - Join your voice channel and start playing random sounds',
            '`/yeggnuts soundboard-goof play [sound]` - Play a random sound or specify a sound name',
            '`/yeggnuts soundboard-goof sounds` - List all available soundboard sounds',
            '`/yeggnuts soundboard-goof status` - Show bot status and statistics',
            '`/yeggnuts soundboard-goof help` - Show this help message',
          ].join('\n'),
        },
        {
          name: 'Control Commands (Elevated)',
          value: [
            '`/yeggnuts soundboard-goof leave` - Leave the voice channel',
            '`/yeggnuts soundboard-goof pause` - Pause random playback',
            '`/yeggnuts soundboard-goof resume` - Resume random playback',
            '`/yeggnuts soundboard-goof frequency <min> <max>` - Set playback interval (minutes)',
          ].join('\n'),
        },
        {
          name: 'Notes',
          value:
            'Legacy top-level commands (e.g., `/yeggnuts-play`) still exist for now, but the new `/yeggnuts soundboard-goof ...` path is preferred.',
        },
        {
          name: 'How It Works',
          value:
            "The bot joins your voice channel and plays random sounds from your server's soundboard at intervals you configure. Perfect for adding some chaos to voice chats!",
        }
      )
      .setFooter({ text: 'Elevated permissions = Administrator or DJ role' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
