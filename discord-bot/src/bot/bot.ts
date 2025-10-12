import {
  Client,
  GatewayIntentBits,
  VoiceState,
  GuildMember,
  ChatInputCommandInteraction,
} from 'discord.js';
import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { BotConfig, VoiceSession } from '../types';
import { SoundboardClient } from '../soundboard/client';
import { Scheduler } from '../scheduler/scheduler';
import { getMinPlaybackInterval, getMaxPlaybackInterval } from '../config/config';

export class Bot {
  public client: Client;
  public soundboard: SoundboardClient;
  public config: BotConfig;
  private voiceSessions: Map<string, VoiceSession> = new Map();
  private voiceConnections: Map<string, VoiceConnection> = new Map();
  private schedulers: Map<string, Scheduler> = new Map();
  private startTime: Date;

  constructor(config: BotConfig) {
    this.config = config;
    this.startTime = new Date();

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.soundboard = new SoundboardClient(config.discord.token);
  }

  async start(): Promise<void> {
    await this.client.login(this.config.discord.token);
    console.log(`Bot connected as ${this.client.user?.tag} (ID: ${this.client.user?.id})`);
  }

  async stop(): Promise<void> {
    // Cancel all active voice sessions
    for (const [guildId, session] of this.voiceSessions.entries()) {
      if (session.cancelFunc) {
        session.cancelFunc();
      }
      const connection = this.voiceConnections.get(guildId);
      if (connection) {
        connection.destroy();
      }
    }
    this.voiceSessions.clear();
    this.voiceConnections.clear();

    await this.client.destroy();
  }

  getVoiceSession(guildId: string): VoiceSession | undefined {
    return this.voiceSessions.get(guildId);
  }

  createVoiceSession(guildId: string, channelId: string): VoiceSession {
    // Cancel existing session if present
    const existing = this.voiceSessions.get(guildId);
    if (existing?.cancelFunc) {
      existing.cancelFunc();
    }

    const abortController = new AbortController();
    const session: VoiceSession = {
      guildId,
      channelId,
      startTime: new Date(),
      soundsPlayed: 0,
      isActive: true,
      isPaused: false,
      minInterval: getMinPlaybackInterval(this.config),
      maxInterval: getMaxPlaybackInterval(this.config),
      cancelFunc: () => abortController.abort(),
    };

    this.voiceSessions.set(guildId, session);

    // Start scheduler
    const scheduler = new Scheduler(this);
    this.schedulers.set(guildId, scheduler);
    scheduler.run(guildId, abortController.signal).catch((error) => {
      if (error.message !== 'Aborted') {
        console.error(`Scheduler error for guild ${guildId}:`, error);
      }
    });

    return session;
  }

  removeVoiceSession(guildId: string): void {
    const session = this.voiceSessions.get(guildId);
    if (session?.cancelFunc) {
      session.cancelFunc();
    }

    const connection = this.voiceConnections.get(guildId);
    if (connection) {
      connection.destroy();
    }

    this.voiceSessions.delete(guildId);
    this.voiceConnections.delete(guildId);
    this.schedulers.delete(guildId);
  }

  updateSessionFrequency(guildId: string, minMinutes: number, maxMinutes: number): void {
    const session = this.voiceSessions.get(guildId);
    if (!session) {
      throw new Error('No active session for this server');
    }

    session.minInterval = minMinutes * 60 * 1000;
    session.maxInterval = maxMinutes * 60 * 1000;
  }

  pauseSession(guildId: string): void {
    const session = this.voiceSessions.get(guildId);
    if (!session) {
      throw new Error('No active session for this server');
    }

    session.isPaused = true;
  }

  resumeSession(guildId: string): void {
    const session = this.voiceSessions.get(guildId);
    if (!session) {
      throw new Error('No active session for this server');
    }

    session.isPaused = false;
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  async getUserVoiceState(guildId: string, userId: string): Promise<VoiceState | undefined> {
    const guild = await this.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    return member.voice;
  }

  joinVoiceChannel(guildId: string, channelId: string): VoiceConnection {
    const connection = joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: this.client.guilds.cache.get(guildId)!.voiceAdapterCreator as any,
      selfDeaf: false,
      selfMute: false,
    });

    this.voiceConnections.set(guildId, connection);
    return connection;
  }

  hasElevatedPermissions(interaction: ChatInputCommandInteraction): boolean {
    if (!interaction.guild || !interaction.member) return false;

    const member = interaction.member as GuildMember;

    // Check if user is administrator
    if (member.permissions.has('Administrator')) {
      return true;
    }

    // Check if user has any of the configured control roles
    const roles = this.config.permissions.controlCommandsRoles;
    return member.roles.cache.some((role) => roles.includes(role.name));
  }
}
