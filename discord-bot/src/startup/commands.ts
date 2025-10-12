import { CommandRegistry } from '../commands/registry';
import { JoinCommand } from '../handlers/join';
import { LeaveCommand } from '../handlers/leave';
import { PlayCommand } from '../handlers/play';
import { SoundsCommand } from '../handlers/sounds';
import { PauseCommand } from '../handlers/pause';
import { ResumeCommand } from '../handlers/resume';
import { FrequencyCommand } from '../handlers/frequency';
import { StatusCommand } from '../handlers/status';
import { HelpCommand } from '../handlers/help';
import { YeggnutsCommand } from '../handlers/yeggnuts';

export function createCommandRegistry(): CommandRegistry {
  const registry = new CommandRegistry();

  registry.registerAll(
    YeggnutsCommand,
    JoinCommand,
    LeaveCommand,
    PlayCommand,
    SoundsCommand,
    PauseCommand,
    ResumeCommand,
    FrequencyCommand,
    StatusCommand,
    HelpCommand
  );

  return registry;
}
