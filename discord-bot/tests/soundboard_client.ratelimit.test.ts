import { SoundboardClient } from '../src/soundboard/client';

describe('SoundboardClient rate limit handling', () => {
  const token = 'test';
  const guildId = 'g1';

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('retries on 429 with retry_after then succeeds', async () => {
    const client = new SoundboardClient(token);
    const fetchMock = jest.spyOn(global, 'fetch' as any);

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ retry_after: 0.01, global: false }),
        headers: new Map(),
        text: async () => 'rate limited',
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as any);

    const p = client.getSounds(guildId);
    // advance timers until the second fetch occurs
    for (let i = 0; i < 50 && fetchMock.mock.calls.length < 2; i++) {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    }
    const result = await p;
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });
});
