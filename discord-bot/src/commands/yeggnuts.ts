import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { CommandHandler } from './handler';
import { Bot } from '../bot/bot';

export const YeggnutsCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts')
    .setDescription('Soundboard bot commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('join')
        .setDescription('Join your voice channel and start playing random sounds')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('leave')
        .setDescription('Leave the voice channel')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('play')
        .setDescription('Play a sound from the soundboard')
        .addStringOption((option) =>
          option
            .setName('sound')
            .setDescription('Name of the sound to play (leave empty for random)')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('sounds')
        .setDescription('List all available soundboard sounds')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('pause')
        .setDescription('Pause random sound playback')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('resume')
        .setDescription('Resume random sound playback')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('frequency')
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
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('status')
        .setDescription('Show bot status and statistics')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('help')
        .setDescription('Show help information about the bot')
    ),
  requiresElevated: false, // We'll check per-subcommand

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    // Check permissions for elevated commands
    const elevatedCommands = ['leave', 'pause', 'resume', 'frequency'];
    if (elevatedCommands.includes(subcommand) && !bot.hasElevatedPermissions(interaction)) {
      await interaction.reply({
        content: '❌ You need elevated permissions to use this command.',
        flags: 64, // ephemeral
      });
      return;
    }

    switch (subcommand) {
      case 'join':
        await handleJoin(interaction, bot);
        break;
      case 'leave':
        await handleLeave(interaction, bot);
        break;
      case 'play':
        await handlePlay(interaction, bot);
        break;
      case 'sounds':
        await handleSounds(interaction, bot);
        break;
      case 'pause':
        await handlePause(interaction, bot);
        break;
      case 'resume':
        await handleResume(interaction, bot);
        break;
      case 'frequency':
        await handleFrequency(interaction, bot);
        break;
      case 'status':
        await handleStatus(interaction, bot);
        break;
      case 'help':
        await handleHelp(interaction);
        break;
      default:
        await interaction.reply({ content: '❌ Unknown subcommand.', flags: 64 });
    }
  },
};

// Handler functions
async function handleJoin(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
    return;
  }

  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({ content: '❌ You need to be in a voice channel first!', flags: 64 });
    return;
  }

  const existingSession = bot.getVoiceSession(interaction.guild.id);
  if (existingSession) {
    await interaction.reply({ content: '❌ Already in a voice channel! Use `/yeggnuts leave` first.', flags: 64 });
    return;
  }

  try {
    bot.joinVoiceChannel(interaction.guild.id, voiceChannel.id);
    await bot.soundboard.refreshCache(interaction.guild.id);
    const session = bot.createVoiceSession(interaction.guild.id, voiceChannel.id);

    const minMins = Math.round(session.minInterval / 60000);
    const maxMins = Math.round(session.maxInterval / 60000);

    await interaction.reply({
      content: `✅ Joined ${voiceChannel.name}! Random sounds will play every ${minMins}-${maxMins} minutes.\nUse \`/yeggnuts pause\` to temporarily stop random playback.`,
    });
  } catch (error) {
    console.error('Failed to join voice channel:', error);
    await interaction.reply({ content: '❌ Failed to join voice channel. Check bot permissions.', flags: 64 });
  }
}

async function handleLeave(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
    return;
  }

  const session = bot.getVoiceSession(interaction.guild.id);
  if (!session) {
    await interaction.reply({ content: '❌ Not currently in a voice channel.', flags: 64 });
    return;
  }

  bot.removeVoiceSession(interaction.guild.id);
  await interaction.reply({ content: '👋 Left the voice channel. Thanks for the chaos!' });
}

async function handlePlay(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
    return;
  }

  const session = bot.getVoiceSession(interaction.guild.id);
  if (!session) {
    await interaction.reply({ content: '❌ Not in a voice channel. Use `/yeggnuts join` first.', flags: 64 });
    return;
  }

  const soundName = interaction.options.getString('sound');

  try {
    let sound;
    if (soundName) {
      sound = bot.soundboard.findSound(interaction.guild.id, soundName);
      if (!sound) {
        await interaction.reply({ content: `❌ Sound "${soundName}" not found. Use \`/yeggnuts sounds\` to see available sounds.`, flags: 64 });
        return;
      }
    } else {
      sound = await bot.soundboard.getRandomSound(interaction.guild.id);
    }

    await bot.soundboard.playSound(session.channelId, sound.sound_id, interaction.guild.id);

    session.soundsPlayed++;
    session.lastSoundTime = new Date();

    await interaction.reply({ content: `🔊 Playing: **${sound.name}**` });
  } catch (error) {
    console.error('Failed to play sound:', error);
    await interaction.reply({ content: '❌ Failed to play sound. Try again later.', flags: 64 });
  }
}

async function handleSounds(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
    return;
  }

  try {
    await bot.soundboard.refreshCache(interaction.guild.id);
    const sounds = bot.soundboard.getCachedSounds(interaction.guild.id);

    if (!sounds || sounds.length === 0) {
      await interaction.reply({ content: '❌ No sounds available in this server. Add some in Server Settings → Soundboard!', flags: 64 });
      return;
    }

    const available = sounds.filter(s => s.available);
    if (available.length === 0) {
      await interaction.reply({ content: '❌ No available sounds in this server.', flags: 64 });
      return;
    }

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
      .setFooter({ text: 'Use /yeggnuts play <sound> to play a specific sound' });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to fetch sounds:', error);
    await interaction.reply({ content: '❌ Failed to fetch sounds. Try again later.', flags: 64 });
  }
}

async function handlePause(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
    return;
  }

  try {
    bot.pauseSession(interaction.guild.id);
    await interaction.reply({ content: '⏸️ Paused random playback. Use `/yeggnuts resume` to continue.' });
  } catch (error) {
    await interaction.reply({ content: '❌ ' + (error as Error).message, flags: 64 });
  }
}

async function handleResume(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
    return;
  }

  try {
    bot.resumeSession(interaction.guild.id);
    await interaction.reply({ content: '▶️ Resumed random playback. Let the chaos continue!' });
  } catch (error) {
    await interaction.reply({ content: '❌ ' + (error as Error).message, flags: 64 });
  }
}

async function handleFrequency(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
    return;
  }

  const min = interaction.options.getInteger('min', true);
  const max = interaction.options.getInteger('max', true);

  if (min > max) {
    await interaction.reply({ content: '❌ Minimum interval must be less than or equal to maximum interval.', flags: 64 });
    return;
  }

  try {
    bot.updateSessionFrequency(interaction.guild.id, min, max);
    await interaction.reply({ content: `✅ Updated playback frequency to ${min}-${max} minutes.` });
  } catch (error) {
    await interaction.reply({ content: '❌ ' + (error as Error).message, flags: 64 });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
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
}

async function handleHelp(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('Yeggnuts Bot Help')
    .setDescription('A bot that randomly plays sounds from your server\'s soundboard at unpredictable intervals.')
    .setColor(0x5865f2)
    .addFields(
      {
        name: 'Basic Commands',
        value: [
          '`/yeggnuts join` - Join your voice channel and start playing random sounds',
          '`/yeggnuts play [sound]` - Play a random sound or specify a sound name',
          '`/yeggnuts sounds` - List all available soundboard sounds',
          '`/yeggnuts status` - Show bot status and statistics',
          '`/yeggnuts help` - Show this help message',
        ].join('\n'),
      },
      {
        name: 'Control Commands (Elevated)',
        value: [
          '`/yeggnuts leave` - Leave the voice channel',
          '`/yeggnuts pause` - Pause random playback',
          '`/yeggnuts resume` - Resume random playback',
          '`/yeggnuts frequency <min> <max>` - Set playback interval (minutes)',
        ].join('\n'),
      },
      {
        name: 'How It Works',
        value: 'The bot joins your voice channel and plays random sounds from your server\'s soundboard at intervals you configure. Perfect for adding some chaos to voice chats!',
      }
    )
    .setFooter({ text: 'Elevated permissions = Administrator or DJ role' });

  await interaction.reply({ embeds: [embed], flags: 64 });
}

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
