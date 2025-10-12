import { Sound } from '../types';

export class SoundboardClient {
  private token: string;
  private cache: Map<string, Sound[]> = new Map();

  constructor(token: string) {
    this.token = token;
  }

  async getSounds(guildId: string): Promise<Sound[]> {
    const url = `https://discord.com/api/v10/guilds/${guildId}/soundboard-sounds`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bot ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch sounds: ${response.status} ${text}`);
    }

    const data: unknown = await response.json();

    // Handle both array and object with "items" field
    const sounds: Sound[] = Array.isArray(data) ? data : (data as any).items || [];

    console.log(`Fetched ${sounds.length} sounds for guild ${guildId}`);
    return sounds;
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
}
