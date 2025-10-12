import { CommandRegistry } from '../src/commands/registry';
import { CommandHandler } from '../src/commands/handler';

describe('CommandRegistry', () => {
  const makeInteraction = (name: string) => ({
    commandName: name,
    replied: false,
    deferred: false,
    reply: jest.fn().mockResolvedValue(undefined),
    followUp: jest.fn().mockResolvedValue(undefined),
  }) as any;

  const bot = {
    hasElevatedPermissions: jest.fn().mockReturnValue(false),
  } as any;

  test('handles unknown command gracefully', async () => {
    const registry = new CommandRegistry();
    const interaction = makeInteraction('nope');
    await registry.handleInteraction(interaction, bot);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  test('enforces elevated permissions when required', async () => {
    const registry = new CommandRegistry();
    const handler: CommandHandler = {
      data: { name: 'secure', toJSON: () => ({ name: 'secure' }) },
      requiresElevated: true,
      execute: jest.fn(),
    } as any;
    registry.register(handler);
    const interaction = makeInteraction('secure');
    await registry.handleInteraction(interaction, bot);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('elevated'),
      ephemeral: true,
    });
    expect(handler.execute).not.toHaveBeenCalled();
  });

  test('invokes handler execute', async () => {
    const registry = new CommandRegistry();
    const handler: CommandHandler = {
      data: { name: 'ok', toJSON: () => ({ name: 'ok' }) },
      requiresElevated: false,
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;
    registry.register(handler);
    const interaction = makeInteraction('ok');
    await registry.handleInteraction(interaction, bot);
    expect(handler.execute).toHaveBeenCalled();
  });
});

