import { Bot } from '../src/bot/bot';
import { BotConfig } from '../src/types';

const baseConfig: BotConfig = {
  discord: { token: 'tok', applicationId: 'app' },
  soundboard: { refreshIntervalMinutes: 10, cacheSounds: true },
  playback: { defaultMinIntervalMinutes: 10, defaultMaxIntervalMinutes: 30, cooldownSeconds: 5 },
  permissions: { controlCommandsRoles: ['DJ'] },
};

describe('Bot.hasElevatedPermissions', () => {
  const bot = new Bot(baseConfig);

  const makeInteraction = (overrides: Partial<any> = {}) =>
    ({
      guild: overrides.guild ?? { id: 'g1' },
      member: {
        permissions: { has: (_p: string) => Boolean(overrides.admin) },
        roles: {
          cache: { some: (fn: (r: any) => boolean) => fn({ name: overrides.role ?? 'User' }) },
        },
      },
    }) as any;

  test('returns false when not in guild', () => {
    expect(bot.hasElevatedPermissions(makeInteraction({ guild: null }))).toBe(false);
  });

  test('returns true for admin', () => {
    expect(bot.hasElevatedPermissions(makeInteraction({ admin: true }))).toBe(true);
  });

  test('returns true for allowed role', () => {
    expect(bot.hasElevatedPermissions(makeInteraction({ role: 'DJ' }))).toBe(true);
  });

  test('returns false otherwise', () => {
    expect(bot.hasElevatedPermissions(makeInteraction({ role: 'User' }))).toBe(false);
  });
});
