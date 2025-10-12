import { loadConfig, getCooldownDuration, getMaxPlaybackInterval, getMinPlaybackInterval, getRefreshInterval } from '../src/config/config';
import * as fs from 'fs';

describe('config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.DISCORD_APPLICATION_ID;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('throws when required envs missing', () => {
    expect(() => loadConfig('nonexistent.yaml')).toThrow('discord.token is required');
  });

  test('loads from env vars', () => {
    process.env.DISCORD_BOT_TOKEN = 'tok';
    process.env.DISCORD_APPLICATION_ID = 'app';
    const cfg = loadConfig('nonexistent.yaml');
    expect(cfg.discord.token).toBe('tok');
    expect(cfg.discord.applicationId).toBe('app');
  });

  test('loads from file when present', () => {
    const tmp = '.tmp-config.yaml';
    fs.writeFileSync(tmp, 'discord:\n  token: filetok\n  applicationId: fileapp\n');
    const cfg = loadConfig(tmp);
    expect(cfg.discord.token).toBe('filetok');
    expect(cfg.discord.applicationId).toBe('fileapp');
    fs.unlinkSync(tmp);
  });

  test('loads snake_case file keys and normalizes', () => {
    const tmp = '.tmp-config-snake.yaml';
    fs.writeFileSync(
      tmp,
      [
        'discord:',
        '  token: filetok',
        '  application_id: fileapp',
        'soundboard:',
        '  refresh_interval_minutes: 3',
        '  cache_sounds: false',
        'playback:',
        '  default_min_interval_minutes: 2',
        '  default_max_interval_minutes: 4',
        '  cooldown_seconds: 7',
        'permissions:',
        '  control_commands_roles:',
        '    - DJ',
      ].join('\n')
    );
    const cfg = loadConfig(tmp);
    expect(cfg.discord.token).toBe('filetok');
    expect(cfg.discord.applicationId).toBe('fileapp');
    expect(cfg.soundboard.refreshIntervalMinutes).toBe(3);
    expect(cfg.soundboard.cacheSounds).toBe(false);
    expect(cfg.playback.defaultMinIntervalMinutes).toBe(2);
    expect(cfg.playback.defaultMaxIntervalMinutes).toBe(4);
    expect(cfg.playback.cooldownSeconds).toBe(7);
    expect(cfg.permissions.controlCommandsRoles).toContain('DJ');
    fs.unlinkSync(tmp);
  });

  test('interval helpers convert minutes/seconds to ms', () => {
    process.env.DISCORD_BOT_TOKEN = 'tok';
    process.env.DISCORD_APPLICATION_ID = 'app';
    const cfg = loadConfig('nonexistent.yaml');
    expect(getRefreshInterval(cfg)).toBe(cfg.soundboard.refreshIntervalMinutes * 60 * 1000);
    expect(getMinPlaybackInterval(cfg)).toBe(cfg.playback.defaultMinIntervalMinutes * 60 * 1000);
    expect(getMaxPlaybackInterval(cfg)).toBe(cfg.playback.defaultMaxIntervalMinutes * 60 * 1000);
    expect(getCooldownDuration(cfg)).toBe(cfg.playback.cooldownSeconds * 1000);
  });
});
