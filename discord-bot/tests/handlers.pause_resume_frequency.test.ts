import { PauseCommand } from '../src/handlers/pause';
import { ResumeCommand } from '../src/handlers/resume';
import { FrequencyCommand } from '../src/handlers/frequency';

const makeInteraction = (overrides: Partial<any> = {}) => ({
  guild: Object.prototype.hasOwnProperty.call(overrides, 'guild') ? overrides.guild : { id: 'g1' },
  options: {
    getInteger: jest.fn((name: string) => {
      if (name === 'min') return overrides.min ?? 5;
      if (name === 'max') return overrides.max ?? 10;
      return null;
    }),
  },
  reply: jest.fn().mockResolvedValue(undefined),
}) as any;

describe('Pause/Resume/Frequency commands', () => {
  const bot = {
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    updateSessionFrequency: jest.fn(),
  } as any;

  test('Pause rejects in DMs', async () => {
    const interaction = makeInteraction({ guild: null });
    await PauseCommand.execute(interaction, bot);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('Pause invokes bot when ok', async () => {
    const interaction = makeInteraction();
    await PauseCommand.execute(interaction, bot);
    expect(bot.pauseSession).toHaveBeenCalled();
  });

  test('Resume invokes bot', async () => {
    const interaction = makeInteraction();
    await ResumeCommand.execute(interaction, bot);
    expect(bot.resumeSession).toHaveBeenCalled();
  });

  test('Frequency rejects min>max', async () => {
    const interaction = makeInteraction({ min: 10, max: 5 });
    await FrequencyCommand.execute(interaction, bot);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });

  test('Frequency updates when ok', async () => {
    const interaction = makeInteraction({ min: 5, max: 6 });
    await FrequencyCommand.execute(interaction, bot);
    expect(bot.updateSessionFrequency).toHaveBeenCalledWith('g1', 5, 6);
  });
});

