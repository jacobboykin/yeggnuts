import { Bot } from '../bot/bot';

export class Scheduler {
  private bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  async run(guildId: string, abortSignal: AbortSignal): Promise<void> {
    console.log(`Scheduler started for guild ${guildId}`);

    try {
      while (!abortSignal.aborted) {
        const session = this.bot.getVoiceSession(guildId);
        if (!session) {
          console.log(`No voice session found for guild ${guildId}, stopping scheduler`);
          return;
        }

        // Calculate next play time
        const interval = this.randomInterval(session.minInterval, session.maxInterval);
        console.log(`Next sound in guild ${guildId} scheduled in ${Math.round(interval / 1000)}s`);

        // Wait for the interval
        await this.sleep(interval, abortSignal);

        if (abortSignal.aborted) break;

        // Check if session is still active and not paused
        const currentSession = this.bot.getVoiceSession(guildId);
        if (!currentSession) {
          return;
        }

        if (currentSession.isPaused) {
          console.log(`Session paused in guild ${guildId}, skipping sound`);
          continue;
        }

        // Play a random sound
        try {
          await this.playRandomSound(guildId, currentSession.channelId);
        } catch (error) {
          console.error(`Failed to play random sound in guild ${guildId}:`, error);
          // Continue anyway - don't stop scheduler on playback errors
        }
      }
    } finally {
      console.log(`Scheduler stopped for guild ${guildId}`);
    }
  }

  private randomInterval(min: number, max: number): number {
    if (min >= max) return min;
    return min + Math.random() * (max - min);
  }

  private async sleep(ms: number, abortSignal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      abortSignal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        },
        { once: true }
      );
    });
  }

  private async playRandomSound(guildId: string, channelId: string): Promise<void> {
    // Get a random sound
    const sound = await this.bot.soundboard.getRandomSound(guildId);

    // Play the sound
    await this.bot.soundboard.playSound(channelId, sound.sound_id, guildId);

    // Update session stats
    const session = this.bot.getVoiceSession(guildId);
    if (session) {
      session.soundsPlayed++;
      session.lastSoundTime = new Date();
    }

    console.log(`Played random sound '${sound.name}' in guild ${guildId}`);
  }
}
