import { Bot } from '../bot/bot';
import { BotConfig } from '../types';

export function startCacheRefreshLoop(bot: Bot, config: BotConfig): void {
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

function getRefreshInterval(config: BotConfig): number {
  return config.soundboard.refreshIntervalMinutes * 60 * 1000;
}
