import * as dotenv from 'dotenv';
import { Events, Interaction } from 'discord.js';
import { Bot } from './bot/bot';
import { CommandRegistry } from './commands/registry';
import { loadConfig, getRefreshInterval } from './config/config';
import { JoinCommand } from './handlers/join';
import { LeaveCommand } from './handlers/leave';
import { PlayCommand } from './handlers/play';
import { SoundsCommand } from './handlers/sounds';
import { PauseCommand } from './handlers/pause';
import { ResumeCommand } from './handlers/resume';
import { FrequencyCommand } from './handlers/frequency';
import { StatusCommand } from './handlers/status';
import { HelpCommand } from './handlers/help';
import { YeggnutsCommand } from './handlers/yeggnuts';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting Yeggnuts Discord Bot...');

  // Parse command-line arguments
  const args = process.argv.slice(2);
  let configPath = 'config.yaml';
  let guildId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' || args[i] === '-c') {
      configPath = args[i + 1];
      i++;
    } else if (args[i] === '--guild' || args[i] === '-g') {
      guildId = args[i + 1];
      i++;
    }
  }

  // Load configuration
  const config = loadConfig(configPath);
  console.log('Configuration loaded successfully');

  // Create bot instance
  const bot = new Bot(config);

  // Create command registry
  const registry = new CommandRegistry();

  // Register all command handlers
  registry.registerAll(
    YeggnutsCommand,
    JoinCommand,
    LeaveCommand,
    PlayCommand,
    SoundsCommand,
    PauseCommand,
    ResumeCommand,
    FrequencyCommand,
    StatusCommand,
    HelpCommand
  );

  // Set up event handlers
  bot.client.once(Events.ClientReady, async () => {
    console.log(`Bot is ready! Logged in as ${bot.client.user?.tag}`);

    // Register slash commands with Discord
    await registry.registerWithDiscord(config.discord.token, config.discord.applicationId, guildId);

    // Start soundboard cache refresh background task
    startCacheRefreshLoop(bot, config);
  });

  bot.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await registry.handleInteraction(interaction, bot);
  });

  // Start the bot
  await bot.start();

  console.log('✅ Bot is now running! Press Ctrl+C to exit.');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await bot.stop();
    process.exit(0);
  });
}

function startCacheRefreshLoop(bot: Bot, config: any): void {
  const interval = getRefreshInterval(config);

  setInterval(async () => {
    const guilds = bot.client.guilds.cache;
    for (const [guildId, guild] of guilds) {
      try {
        await bot.soundboard.refreshCache(guildId);
        console.log(`Refreshed soundboard cache for guild ${guild.name} (${guildId})`);
      } catch (error) {
        console.error(`Failed to refresh soundboard cache for guild ${guildId}:`, error);
      }
    }
  }, interval);
}

// Start the bot
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
