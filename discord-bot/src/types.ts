export interface BotConfig {
  discord: {
    token: string;
    applicationId: string;
  };
  soundboard: {
    refreshIntervalMinutes: number;
    cacheSounds: boolean;
  };
  playback: {
    defaultMinIntervalMinutes: number;
    defaultMaxIntervalMinutes: number;
    cooldownSeconds: number;
  };
  permissions: {
    controlCommandsRoles: string[];
  };
}

export interface Sound {
  sound_id: string;
  name: string;
  volume: number;
  emoji_id?: string;
  emoji_name?: string;
  guild_id: string;
  available: boolean;
  user?: {
    id: string;
    username: string;
    discriminator: string;
  };
}

export interface VoiceSession {
  guildId: string;
  channelId: string;
  startTime: Date;
  soundsPlayed: number;
  isActive: boolean;
  isPaused: boolean;
  minInterval: number; // milliseconds
  maxInterval: number; // milliseconds
  lastSoundTime?: Date;
  cancelFunc?: () => void;
}
