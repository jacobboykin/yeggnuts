export interface CliArgs {
  configPath: string;
  guildId?: string;
}

export function parseCommandLineArgs(): CliArgs {
  const args = process.argv.slice(2);
  let configPath = 'config.yaml';
  let guildId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' || args[i] === '-c') {
      configPath = args[i + 1];
      i++;
    } else if (args[i] === '--guild' || args[i] === '-g') {
      guildId = args[i + 1];
      i++;
    }
  }

  return { configPath, guildId };
}
