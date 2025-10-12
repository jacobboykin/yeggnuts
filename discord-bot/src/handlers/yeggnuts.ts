import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';
import { JoinCommand } from './join';
import { LeaveCommand } from './leave';
import { PlayCommand } from './play';
import { SoundsCommand } from './sounds';
import { PauseCommand } from './pause';
import { ResumeCommand } from './resume';
import { FrequencyCommand } from './frequency';
import { StatusCommand } from './status';
import { HelpCommand } from './help';

// Root `/yeggnuts` command with subcommand group `soundboard-goof`
export const YeggnutsCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts')
    .setDescription('Yeggnuts bot commands')
    .addSubcommandGroup((group) =>
      group
        .setName('soundboard-goof')
        .setDescription('Soundboard chaos controls')
        .addSubcommand((sub) =>
          sub
            .setName('join')
            .setDescription('Join your voice channel and start playing random sounds')
        )
        .addSubcommand((sub) => sub.setName('leave').setDescription('Leave the voice channel'))
        .addSubcommand((sub) =>
          sub
            .setName('play')
            .setDescription('Play a sound from the soundboard')
            .addStringOption((option) =>
              option
                .setName('sound')
                .setDescription('Name of the sound to play (leave empty for random)')
                .setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub.setName('sounds').setDescription('List all available soundboard sounds')
        )
        .addSubcommand((sub) => sub.setName('pause').setDescription('Pause random sound playback'))
        .addSubcommand((sub) =>
          sub.setName('resume').setDescription('Resume random sound playback')
        )
        .addSubcommand((sub) =>
          sub
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
        .addSubcommand((sub) =>
          sub.setName('status').setDescription('Show bot status and statistics')
        )
        .addSubcommand((sub) =>
          sub.setName('help').setDescription('Show help information about the bot')
        )
    ),
  requiresElevated: false,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    // Only chat input with subcommands is expected
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand(false);

    if (group !== 'soundboard-goof' || !sub) {
      await interaction.reply({
        content: '❌ Unknown subcommand. Try `/yeggnuts soundboard-goof help`.',
        ephemeral: true,
      });
      return;
    }

    // Map of subcommands requiring elevated permissions
    const elevatedSubs = new Set<string>(['leave', 'pause', 'resume', 'frequency']);
    if (elevatedSubs.has(sub) && !bot.hasElevatedPermissions(interaction)) {
      await interaction.reply({
        content: '❌ You need elevated permissions to use this command.',
        ephemeral: true,
      });
      return;
    }

    switch (sub) {
      case 'join':
        await JoinCommand.execute(interaction, bot);
        break;
      case 'leave':
        await LeaveCommand.execute(interaction, bot);
        break;
      case 'play':
        await PlayCommand.execute(interaction, bot);
        break;
      case 'sounds':
        await SoundsCommand.execute(interaction, bot);
        break;
      case 'pause':
        await PauseCommand.execute(interaction, bot);
        break;
      case 'resume':
        await ResumeCommand.execute(interaction, bot);
        break;
      case 'frequency':
        await FrequencyCommand.execute(interaction, bot);
        break;
      case 'status':
        await StatusCommand.execute(interaction, bot);
        break;
      case 'help':
        await HelpCommand.execute(interaction, bot);
        break;
      default:
        await interaction.reply({ content: '❌ Unknown subcommand.', ephemeral: true });
        break;
    }
  },
};
