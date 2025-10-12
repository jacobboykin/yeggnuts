import { Sound } from '../types';

export class SoundboardClient {
  private token: string;
  private cache: Map<string, Sound[]> = new Map();
  private globalBackoffUntil = 0;

  constructor(token: string) {
    this.token = token;
  }

  async getSounds(guildId: string, maxRetries = 3): Promise<Sound[]> {
    const url = `https://discord.com/api/v10/guilds/${guildId}/soundboard-sounds`;

    let attempt = 0;
    while (true) {
      // Honor any global backoff window
      const now = Date.now();
      if (this.globalBackoffUntil > now) {
        await this.sleep(this.globalBackoffUntil - now);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bot ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: unknown = await response.json();
        const sounds: Sound[] = Array.isArray(data) ? data : (data as any).items || [];
        console.log(`Fetched ${sounds.length} sounds for guild ${guildId}`);
        return sounds;
      }

      // Handle rate limiting with retry
      if (response.status === 429 && attempt < maxRetries) {
        let retryAfterMs = 1000;
        try {
          const body: any = await response.json();
          if (typeof body?.retry_after === 'number') {
            retryAfterMs = Math.ceil(body.retry_after * 1000);
          }
          if (body?.global) {
            this.globalBackoffUntil = Date.now() + retryAfterMs;
          }
        } catch {
          const header = response.headers.get('retry-after') || response.headers.get('x-ratelimit-reset-after');
          if (header) retryAfterMs = Math.ceil(parseFloat(header) * 1000);
        }

        // Exponential backoff with jitter
        const jitter = Math.floor(Math.random() * 200);
        const backoff = retryAfterMs * Math.pow(2, attempt) + jitter;
        await this.sleep(backoff);
        attempt++;
        continue;
      }

      const text = await response.text();
      throw new Error(`Failed to fetch sounds: ${response.status} ${text}`);
    }
  }

  async refreshCache(guildId: string): Promise<void> {
    const sounds = await this.getSounds(guildId);
    this.cache.set(guildId, sounds);
  }

  getCachedSounds(guildId: string): Sound[] | undefined {
    return this.cache.get(guildId);
  }

  async getRandomSound(guildId: string): Promise<Sound> {
    let sounds = this.getCachedSounds(guildId);

    if (!sounds || sounds.length === 0) {
      await this.refreshCache(guildId);
      sounds = this.getCachedSounds(guildId);
      if (!sounds || sounds.length === 0) {
        throw new Error('No sounds available in this server');
      }
    }

    // Filter out unavailable sounds
    const available = sounds.filter(s => s.available);
    if (available.length === 0) {
      throw new Error('No available sounds in this server');
    }

    // Return random sound
    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
  }

  findSound(guildId: string, name: string): Sound | undefined {
    const sounds = this.getCachedSounds(guildId);
    if (!sounds || sounds.length === 0) {
      return undefined;
    }

    // Try exact match first
    let sound = sounds.find(s => s.name === name && s.available);
    if (sound) return sound;

    // Try case-insensitive match
    const nameLower = name.toLowerCase();
    sound = sounds.find(s => s.name.toLowerCase() === nameLower && s.available);
    return sound;
  }

  async playSound(channelId: string, soundId: string, sourceGuildId: string): Promise<void> {
    const url = `https://discord.com/api/v10/channels/${channelId}/send-soundboard-sound`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sound_id: soundId,
        source_guild_id: sourceGuildId,
      }),
    });

    if (!response.ok && response.status !== 204) {
      const text = await response.text();
      throw new Error(`Failed to play sound: ${response.status} ${text}`);
    }

    console.log(`Played sound ${soundId} in channel ${channelId}`);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
