import { SoundboardClient } from '../src/soundboard/client';
import { Sound } from '../src/types';

describe('SoundboardClient', () => {
  const token = 'test';
  const guildId = '123';

  const makeSounds = (n: number, available = true): Sound[] =>
    Array.from({ length: n }, (_, i) => ({
      sound_id: `id-${i}`,
      name: `sound-${i}`,
      volume: 100,
      guild_id: guildId,
      available,
    }));

  test('findSound exact and case-insensitive', () => {
    const client = new SoundboardClient(token);
    // prime cache directly
    (client as any).cache.set(guildId, [
      { sound_id: '1', name: 'Beep', volume: 100, guild_id: guildId, available: true },
      { sound_id: '2', name: 'boop', volume: 100, guild_id: guildId, available: true },
    ] as Sound[]);

    expect(client.findSound(guildId, 'Beep')?.sound_id).toBe('1');
    expect(client.findSound(guildId, 'boop')?.sound_id).toBe('2');
    expect(client.findSound(guildId, 'BOOP')?.sound_id).toBe('2');
    expect(client.findSound(guildId, 'nope')).toBeUndefined();
  });

  test('getRandomSound uses cache and filters unavailable', async () => {
    const client = new SoundboardClient(token);
    (client as any).cache.set(guildId, [...makeSounds(3, true), ...makeSounds(2, false)]);
    const s = await client.getRandomSound(guildId);
    expect(s).toBeDefined();
    expect(s.available).toBe(true);
  });

  test('getRandomSound refreshes when cache empty', async () => {
    const client = new SoundboardClient(token);
    const spy = jest.spyOn(client as any, 'getSounds').mockResolvedValue(makeSounds(1, true));
    const s = await client.getRandomSound(guildId);
    expect(s).toBeDefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
