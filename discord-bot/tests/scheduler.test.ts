import { Scheduler } from '../src/scheduler/scheduler';

describe('Scheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const makeBot = (overrides: Partial<any> = {}) =>
    ({
      soundboard: {
        getRandomSound: jest.fn().mockResolvedValue({ sound_id: '1', name: 'rand' }),
        playSound: jest.fn().mockResolvedValue(undefined),
      },
      getVoiceSession: jest.fn().mockImplementation(
        (gid: string) =>
          overrides.session ?? {
            guildId: gid,
            channelId: 'c1',
            isPaused: Boolean(overrides.paused),
            minInterval: overrides.min ?? 10,
            maxInterval: overrides.max ?? 10,
          }
      ),
    }) as any;

  test('plays when not paused', async () => {
    const bot = makeBot({ paused: false, min: 1, max: 1 });
    const scheduler = new Scheduler(bot);
    const ac = new AbortController();
    const p = scheduler.run('g1', ac.signal).catch(() => undefined);
    // advance and allow microtasks to flush
    jest.advanceTimersByTime(1);
    jest.runOnlyPendingTimers();
    for (
      let i = 0;
      i < 10 && (bot.soundboard.getRandomSound as jest.Mock).mock.calls.length === 0;
      i++
    ) {
      await Promise.resolve();
    }
    expect(bot.soundboard.getRandomSound).toHaveBeenCalled();
    ac.abort();
    await p;
  });

  test('skips when paused', async () => {
    const bot = makeBot({ paused: true, min: 1, max: 1 });
    const scheduler = new Scheduler(bot);
    const ac = new AbortController();
    const p = scheduler.run('g1', ac.signal).catch(() => undefined);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(bot.soundboard.playSound).not.toHaveBeenCalled();
    ac.abort();
    await p;
  });
});
