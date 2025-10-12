import * as fs from 'fs';
import * as yaml from 'yaml';
import { BotConfig } from '../types';

const DEFAULT_CONFIG: BotConfig = {
  discord: {
    token: '',
    applicationId: '',
  },
  soundboard: {
    refreshIntervalMinutes: 10,
    cacheSounds: true,
  },
  playback: {
    defaultMinIntervalMinutes: 10,
    defaultMaxIntervalMinutes: 30,
    cooldownSeconds: 5,
  },
  permissions: {
    controlCommandsRoles: ['Administrator', 'DJ'],
  },
};

export function loadConfig(configPath: string = 'config.yaml'): BotConfig {
  let config: BotConfig = { ...DEFAULT_CONFIG };

  // Load from file if it exists
  if (fs.existsSync(configPath)) {
    try {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const fileConfig = yaml.parse(fileContents);
      config = { ...config, ...fileConfig };
    } catch (error) {
      console.warn(`Failed to load config file: ${error}`);
    }
  }

  // Override with environment variables
  if (process.env.DISCORD_BOT_TOKEN) {
    config.discord.token = process.env.DISCORD_BOT_TOKEN;
  }
  if (process.env.DISCORD_APPLICATION_ID) {
    config.discord.applicationId = process.env.DISCORD_APPLICATION_ID;
  }

  // Validate required fields
  validateConfig(config);

  return config;
}

function validateConfig(config: BotConfig): void {
  if (!config.discord.token) {
    throw new Error('discord.token is required (set DISCORD_BOT_TOKEN env var)');
  }
  if (!config.discord.applicationId) {
    throw new Error('discord.applicationId is required (set DISCORD_APPLICATION_ID env var)');
  }
  if (config.playback.defaultMinIntervalMinutes <= 0) {
    throw new Error('playback.defaultMinIntervalMinutes must be positive');
  }
  if (config.playback.defaultMaxIntervalMinutes <= 0) {
    throw new Error('playback.defaultMaxIntervalMinutes must be positive');
  }
  if (config.playback.defaultMinIntervalMinutes > config.playback.defaultMaxIntervalMinutes) {
    throw new Error('playback.defaultMinIntervalMinutes must be <= defaultMaxIntervalMinutes');
  }
  if (config.playback.cooldownSeconds < 0) {
    throw new Error('playback.cooldownSeconds must be non-negative');
  }
}

export function getRefreshInterval(config: BotConfig): number {
  return config.soundboard.refreshIntervalMinutes * 60 * 1000;
}

export function getMinPlaybackInterval(config: BotConfig): number {
  return config.playback.defaultMinIntervalMinutes * 60 * 1000;
}

export function getMaxPlaybackInterval(config: BotConfig): number {
  return config.playback.defaultMaxIntervalMinutes * 60 * 1000;
}

export function getCooldownDuration(config: BotConfig): number {
  return config.playback.cooldownSeconds * 1000;
}
