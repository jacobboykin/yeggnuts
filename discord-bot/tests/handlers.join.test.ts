import { JoinCommand } from '../src/handlers/join';

describe('JoinCommand', () => {
  const makeInteraction = (opts: Partial<any> = {}) =>
    ({
      guild: Object.prototype.hasOwnProperty.call(opts, 'guild') ? opts.guild : { id: 'g1' },
      member: {
        voice: {
          channel: Object.prototype.hasOwnProperty.call(opts, 'voiceChannel')
            ? opts.voiceChannel
            : { id: 'vc1', name: 'General' },
        },
      },
      reply: jest.fn().mockResolvedValue(undefined),
    }) as any;

  const makeBot = (overrides: Partial<any> = {}) =>
    ({
      getVoiceSession: jest.fn().mockReturnValue(overrides.session ?? null),
      joinVoiceChannel: jest.fn(),
      createVoiceSession: jest.fn().mockReturnValue({ minInterval: 600000, maxInterval: 1800000 }),
      soundboard: { refreshCache: jest.fn().mockResolvedValue(undefined) },
    }) as any;

  test('rejects in DMs', async () => {
    const interaction = makeInteraction({ guild: null });
    await JoinCommand.execute(interaction, makeBot());
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('requires user voice channel', async () => {
    const interaction = makeInteraction({ voiceChannel: null });
    await JoinCommand.execute(interaction, makeBot());
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('prevents duplicate join', async () => {
    const interaction = makeInteraction();
    await JoinCommand.execute(interaction, makeBot({ session: { channelId: 'c1' } }));
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('joins and starts session', async () => {
    const interaction = makeInteraction();
    const bot = makeBot();
    await JoinCommand.execute(interaction, bot);
    expect(bot.joinVoiceChannel).toHaveBeenCalled();
    expect(bot.soundboard.refreshCache).toHaveBeenCalled();
    expect(bot.createVoiceSession).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('Joined') })
    );
  });
});
