import { Events, Interaction } from 'discord.js';
import { Bot } from '../bot/bot';
import { CommandRegistry } from '../commands/registry';
import { BotConfig } from '../types';
import { startCacheRefreshLoop } from './startup';

export function setupEventHandlers(
  bot: Bot,
  registry: CommandRegistry,
  config: BotConfig,
  guildId?: string
): void {
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
}

export function setupGracefulShutdown(bot: Bot): void {
  const shutdown = async (): Promise<void> => {
    console.log('\nShutting down gracefully...');
    await bot.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
