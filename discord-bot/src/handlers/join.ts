import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const JoinCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-join')
    .setDescription('Join your voice channel and start playing random sounds'),
  requiresElevated: false,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ You need to be in a voice channel first!',
        ephemeral: true,
      });
      return;
    }

    // Check if already in a voice channel
    const existingSession = bot.getVoiceSession(interaction.guild.id);
    if (existingSession) {
      await interaction.reply({
        content: '❌ Already in a voice channel! Use `/yeggnuts soundboard-goof leave` first.',
        ephemeral: true,
      });
      return;
    }

    try {
      // Join the voice channel
      bot.joinVoiceChannel(interaction.guild.id, voiceChannel.id);

      // Refresh soundboard cache
      await bot.soundboard.refreshCache(interaction.guild.id);

      // Create session and start scheduler
      const session = bot.createVoiceSession(interaction.guild.id, voiceChannel.id);

      const minMins = Math.round(session.minInterval / 60000);
      const maxMins = Math.round(session.maxInterval / 60000);

      await interaction.reply({
        content: `✅ Joined ${voiceChannel.name}! Random sounds will play every ${minMins}-${maxMins} minutes.\nUse \`/yeggnuts soundboard-goof pause\` to temporarily stop random playback.`,
      });
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      await interaction.reply({
        content: '❌ Failed to join voice channel. Check bot permissions.',
        ephemeral: true,
      });
    }
  },
};
