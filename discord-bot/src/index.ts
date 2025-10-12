import * as dotenv from 'dotenv';
import { Bot } from './bot/bot';
import { loadConfig } from './config/config';
import { parseCommandLineArgs } from './startup/cli';
import { createCommandRegistry } from './startup/commands';
import { setupEventHandlers, setupGracefulShutdown } from './startup/events';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  console.log('Starting Yeggnuts Discord Bot...');

  // Parse command-line arguments
  const { configPath, guildId } = parseCommandLineArgs();

  // Load configuration
  const config = loadConfig(configPath);
  console.log('Configuration loaded successfully');

  // Create bot instance
  const bot = new Bot(config);

  // Create and setup command registry
  const registry = createCommandRegistry();

  // Set up event handlers
  setupEventHandlers(bot, registry, config, guildId);

  // Handle graceful shutdown
  setupGracefulShutdown(bot);

  // Start the bot
  await bot.start();

  console.log('✅ Bot is now running! Press Ctrl+C to exit.');
}

// Start the bot
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
