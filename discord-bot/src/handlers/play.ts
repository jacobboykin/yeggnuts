import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const PlayCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-play')
    .setDescription('Play a sound from the soundboard')
    .addStringOption((option) =>
      option
        .setName('sound')
        .setDescription('Name of the sound to play (leave empty for random)')
        .setRequired(false)
    ),
  requiresElevated: false,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
      return;
    }

    const session = bot.getVoiceSession(interaction.guild.id);
    if (!session) {
      await interaction.reply({ content: '❌ Not in a voice channel. Use `/yeggnuts soundboard-goof join` first.', ephemeral: true });
      return;
    }

    const soundName = interaction.options.getString('sound');

    try {
      let sound;
      if (soundName) {
        // Play specific sound
        sound = bot.soundboard.findSound(interaction.guild.id, soundName);
        if (!sound) {
          await interaction.reply({ content: `❌ Sound "${soundName}" not found. Use \`/yeggnuts soundboard-goof sounds\` to see available sounds.`, ephemeral: true });
          return;
        }
      } else {
        // Play random sound
        sound = await bot.soundboard.getRandomSound(interaction.guild.id);
      }

      await bot.soundboard.playSound(session.channelId, sound.sound_id, interaction.guild.id);

      session.soundsPlayed++;
      session.lastSoundTime = new Date();

      await interaction.reply({ content: `🔊 Playing: **${sound.name}**` });
    } catch (error) {
      console.error('Failed to play sound:', error);
      await interaction.reply({ content: '❌ Failed to play sound. Try again later.', ephemeral: true });
    }
  },
};
