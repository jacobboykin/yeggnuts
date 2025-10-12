import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const StatusCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-status')
    .setDescription('Show bot status and statistics'),
  requiresElevated: false,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const session = bot.getVoiceSession(interaction.guild.id);
    const uptime = bot.getUptime();
    const uptimeStr = formatDuration(uptime);

    const embed = new EmbedBuilder()
      .setTitle('Yeggnuts Bot Status')
      .setColor(session ? 0x00ff00 : 0x808080)
      .addFields(
        { name: 'Bot Uptime', value: uptimeStr, inline: true },
        { name: 'Voice Channel', value: session ? '<Connected>' : 'Not connected', inline: true }
      );

    if (session) {
      const sessionDuration = Date.now() - session.startTime.getTime();
      const sessionDurationStr = formatDuration(sessionDuration);
      const minMins = Math.round(session.minInterval / 60000);
      const maxMins = Math.round(session.maxInterval / 60000);

      embed.addFields(
        { name: 'Session Duration', value: sessionDurationStr, inline: true },
        { name: 'Sounds Played', value: session.soundsPlayed.toString(), inline: true },
        { name: 'Status', value: session.isPaused ? '⏸️ Paused' : '▶️ Active', inline: true },
        { name: 'Frequency', value: `${minMins}-${maxMins} minutes`, inline: true }
      );

      if (session.lastSoundTime) {
        const lastSoundAgo = Date.now() - session.lastSoundTime.getTime();
        const lastSoundStr = formatDuration(lastSoundAgo);
        embed.addFields({ name: 'Last Sound', value: `${lastSoundStr} ago`, inline: true });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
