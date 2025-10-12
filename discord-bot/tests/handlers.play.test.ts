import { PlayCommand } from '../src/handlers/play';

describe('PlayCommand', () => {
  const makeInteraction = (opts: Partial<any> = {}) => ({
    guild: Object.prototype.hasOwnProperty.call(opts, 'guild') ? opts.guild : { id: 'g1' },
    options: {
      getString: jest.fn().mockReturnValue(opts.soundName ?? null),
    },
    reply: jest.fn().mockResolvedValue(undefined),
  }) as any;

  const makeBot = (overrides: Partial<any> = {}) => ({
    getVoiceSession: jest.fn().mockReturnValue(
      Object.prototype.hasOwnProperty.call(overrides, 'session') ? overrides.session : { channelId: 'c1' }
    ),
    soundboard: {
      findSound: jest.fn().mockReturnValue(overrides.sound ?? { sound_id: 's1', name: 'beep' }),
      getRandomSound: jest.fn().mockResolvedValue({ sound_id: 'r1', name: 'rand' }),
      playSound: jest.fn().mockResolvedValue(undefined),
    },
  }) as any;

  test('rejects in DMs', async () => {
    const interaction = makeInteraction({ guild: null });
    await PlayCommand.execute(interaction, makeBot());
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('requires active session', async () => {
    const interaction = makeInteraction();
    const bot = makeBot({ session: null });
    await PlayCommand.execute(interaction, bot);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('plays named sound', async () => {
    const interaction = makeInteraction({ soundName: 'beep' });
    const bot = makeBot({});
    await PlayCommand.execute(interaction, bot);
    expect(bot.soundboard.findSound).toHaveBeenCalled();
    expect(bot.soundboard.playSound).toHaveBeenCalled();
  });

  test('handles missing named sound', async () => {
    const interaction = makeInteraction({ soundName: 'nope' });
    const bot = makeBot({});
    bot.soundboard.findSound.mockReturnValue(undefined);
    await PlayCommand.execute(interaction, bot);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });
});
