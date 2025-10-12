import { SoundsCommand } from '../src/handlers/sounds';
import { StatusCommand } from '../src/handlers/status';

describe('SoundsCommand', () => {
  const makeInteraction = (opts: Partial<any> = {}) =>
    ({
      guild: Object.prototype.hasOwnProperty.call(opts, 'guild') ? opts.guild : { id: 'g1' },
      reply: jest.fn().mockResolvedValue(undefined),
    }) as any;

  const makeBot = (overrides: Partial<any> = {}) =>
    ({
      soundboard: {
        refreshCache: jest.fn().mockResolvedValue(undefined),
        getCachedSounds: jest.fn().mockReturnValue(overrides.sounds ?? []),
      },
    }) as any;

  test('rejects in DMs', async () => {
    const interaction = makeInteraction({ guild: null });
    await SoundsCommand.execute(interaction, makeBot());
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('no sounds available', async () => {
    const interaction = makeInteraction();
    await SoundsCommand.execute(interaction, makeBot({ sounds: [] }));
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('lists available sounds', async () => {
    const interaction = makeInteraction();
    const sounds = [
      { name: 'A', available: true, sound_id: '1', volume: 100, guild_id: 'g1' },
      { name: 'B', available: false, sound_id: '2', volume: 100, guild_id: 'g1' },
    ];
    await SoundsCommand.execute(interaction, makeBot({ sounds }));
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) })
    );
  });
});

describe('StatusCommand', () => {
  const makeInteraction = (opts: Partial<any> = {}) =>
    ({
      guild: Object.prototype.hasOwnProperty.call(opts, 'guild') ? opts.guild : { id: 'g1' },
      reply: jest.fn().mockResolvedValue(undefined),
    }) as any;

  const makeBot = (overrides: Partial<any> = {}) =>
    ({
      getVoiceSession: jest.fn().mockReturnValue(overrides.session ?? null),
      getUptime: jest.fn().mockReturnValue(123456),
    }) as any;

  test('rejects in DMs', async () => {
    const interaction = makeInteraction({ guild: null });
    await StatusCommand.execute(interaction, makeBot());
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('shows status embed without session', async () => {
    const interaction = makeInteraction();
    await StatusCommand.execute(interaction, makeBot());
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) })
    );
  });

  test('shows session details when active', async () => {
    const interaction = makeInteraction();
    const session = {
      startTime: new Date(Date.now() - 1000),
      minInterval: 60000,
      maxInterval: 120000,
      soundsPlayed: 3,
      isPaused: false,
    };
    await StatusCommand.execute(interaction, makeBot({ session }));
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) })
    );
  });
});
