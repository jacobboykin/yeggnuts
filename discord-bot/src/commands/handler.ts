import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { Bot } from '../bot/bot';

export interface CommandHandler {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | any;
  requiresElevated: boolean;
  execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void>;
}
