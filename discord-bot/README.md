# Yeggnuts Discord Soundboard Bot

A Discord bot written in Go that randomly plays sounds from your server's soundboard at unpredictable intervals. Perfect for adding some chaos and entertainment to your voice chats with friends!

## Features

- 🎲 **Random Sound Playback** - Plays sounds from your Discord server's soundboard at randomized intervals
- 🎮 **Slash Commands** - Clean `/yeggnuts` command interface
- ⏸️ **Pause/Resume** - Control random playback without leaving the channel
- ⚙️ **Configurable Frequency** - Adjust how often sounds play (per session)
- 📊 **Status Tracking** - View session stats and bot uptime
- 🔧 **Easy to Extend** - Add new silly commands with minimal code

## Architecture

The bot uses Discord's native Soundboard API, so:
- ✅ No audio files to manage
- ✅ Server admins control sounds through Discord's UI
- ✅ Simpler deployment
- ✅ Better performance

## Prerequisites

- Node.js 18.0 or later
- npm or yarn
- A Discord Bot Token and Application ID
- A Discord server with soundboard sounds configured

## Quick Start

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Yeggnuts")
3. Go to the "Bot" section and create a bot
4. Copy the bot token (you'll need this later)
5. Enable these Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent (optional, for future features)
6. Go to the "OAuth2" section and note your Application ID
7. In "OAuth2 → URL Generator":
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Use Voice Activity`
   - Copy the generated URL and use it to invite the bot to your server

### 2. Set Up Your Server's Soundboard

1. In your Discord server, go to **Server Settings → Soundboard**
2. Upload sounds (max 5 seconds each)
3. Give each sound a name and optional emoji
4. Make sure sounds are enabled for your server

### 3. Configure the Bot

Create a `.env` file (or use environment variables):

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
DISCORD_BOT_TOKEN=your-bot-token-here
DISCORD_APPLICATION_ID=your-application-id-here
```

Optionally, create a `config.yaml` file for additional settings:
```yaml
discord:
  token: ${DISCORD_BOT_TOKEN}
  application_id: ${DISCORD_APPLICATION_ID}

soundboard:
  refresh_interval_minutes: 10
  cache_sounds: true

playback:
  default_min_interval_minutes: 10
  default_max_interval_minutes: 30
  cooldown_seconds: 5

permissions:
  control_commands_roles:
    - "Administrator"
    - "DJ"
```

### 4. Install Dependencies

```bash
npm install
# or
yarn install
```

### 5. Build and Run

```bash
# Build the bot
npm run build

# Run the bot
npm start

# Or run in development mode with ts-node
npm run dev

# For faster command registration during testing (guild-specific)
npm start -- --guild YOUR_GUILD_ID
```

## Usage

### Commands

All commands use the `/yeggnuts` prefix:

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/yeggnuts-join` | Join your voice channel and start playing random sounds | Everyone |
| `/yeggnuts-leave` | Leave the voice channel | Elevated |
| `/yeggnuts-play [sound]` | Play a random sound or specify a sound name | Everyone |
| `/yeggnuts-sounds` | List all available soundboard sounds | Everyone |
| `/yeggnuts-pause` | Pause random playback | Elevated |
| `/yeggnuts-resume` | Resume random playback | Elevated |
| `/yeggnuts-frequency <min> <max>` | Set playback interval (minutes) | Elevated |
| `/yeggnuts-status` | Show bot status and statistics | Everyone |
| `/yeggnuts-help` | Show help information | Everyone |

**Elevated permissions** = Server administrators or users with the "DJ" role (configurable in `config.yaml`)

### Example Workflow

```
1. Join a voice channel
2. Type: /yeggnuts-join
3. The bot will start playing random sounds every 10-30 minutes (default)
4. Adjust frequency: /yeggnuts-frequency 5 15
5. Pause during serious conversations: /yeggnuts-pause
6. Resume the chaos: /yeggnuts-resume
7. When done: /yeggnuts-leave
```

## Configuration

### Configuration File (`config.yaml`)

```yaml
discord:
  token: ${DISCORD_BOT_TOKEN}           # Required
  application_id: ${DISCORD_APPLICATION_ID}  # Required

soundboard:
  refresh_interval_minutes: 10          # How often to refresh sound cache
  cache_sounds: true                    # Cache sounds in memory

playback:
  default_min_interval_minutes: 10      # Min time between random sounds
  default_max_interval_minutes: 30      # Max time between random sounds
  cooldown_seconds: 5                   # Cooldown between manual plays

permissions:
  control_commands_roles:               # Roles that can use pause/frequency/leave
    - "Administrator"
    - "DJ"
```

### Environment Variables

- `DISCORD_BOT_TOKEN` - Your Discord bot token (required)
- `DISCORD_APPLICATION_ID` - Your Discord application ID (required)

Environment variables override values in the config file.

## Development

### Project Structure

```
discord-bot/
├── src/
│   ├── bot/              # Bot core logic and session management
│   ├── commands/         # Command registry and routing
│   ├── config/           # Configuration loading
│   ├── handlers/         # Command handler implementations
│   ├── scheduler/        # Random playback scheduler
│   ├── soundboard/       # Discord Soundboard API client
│   ├── types.ts          # TypeScript type definitions
│   └── index.ts          # Main entry point
├── dist/                 # Compiled JavaScript output
├── package.json          # npm dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Example environment variables
├── config.example.yaml   # Example configuration (optional)
└── README.md            # This file
```

### Adding New Commands

The bot is designed for easy extensibility. To add a new command:

1. Create a new handler file in `src/handlers/`:

```typescript
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../commands/handler';
import { Bot } from '../bot/bot';

export const MyCommand: CommandHandler = {
  data: new SlashCommandBuilder()
    .setName('yeggnuts-mycommand')
    .setDescription('Does something silly'),
  requiresElevated: false,

  async execute(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
    await interaction.reply({ content: 'Hello from my command!', ephemeral: true });
  },
};
```

2. Register it in `src/index.ts`:

```typescript
import { MyCommand } from './handlers/mycommand';

// In the registry.registerAll() call:
registry.registerAll(
  JoinCommand,
  // ... other handlers ...
  MyCommand,  // Add this line
);
```

3. Rebuild and restart the bot!

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Option 1: Systemd Service (Linux)

Create `/etc/systemd/system/yeggnuts.service`:

```ini
[Unit]
Description=Yeggnuts Discord Bot
After=network.target

[Service]
Type=simple
User=yeggnuts
WorkingDirectory=/opt/yeggnuts
Environment=DISCORD_BOT_TOKEN=your-token
Environment=DISCORD_APPLICATION_ID=your-app-id
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/yeggnuts/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable yeggnuts
sudo systemctl start yeggnuts
```

### Option 2: Docker (Coming Soon)

```bash
# Build
docker build -t yeggnuts .

# Run
docker run -d \
  -e DISCORD_BOT_TOKEN=your-token \
  -e DISCORD_APPLICATION_ID=your-app-id \
  yeggnuts
```

### Option 3: Screen/Tmux

```bash
screen -S yeggnuts
npm start
# Press Ctrl+A, D to detach
```

## Troubleshooting

### Bot doesn't respond to commands
- Make sure the bot has been invited with the `applications.commands` scope
- Wait a few minutes for global commands to propagate (or use `-guild` flag during development)
- Check the bot has permissions in your server

### "No sounds available" error
- Go to Server Settings → Soundboard and add some sounds
- Make sure sounds are enabled for the server
- Check the bot has permission to view the soundboard

### Bot can't play sounds
- Ensure the bot has `Connect` and `Speak` permissions in the voice channel
- Verify soundboard sounds are properly configured in Discord

### Commands register slowly
- Use the `--guild YOUR_GUILD_ID` flag during development for instant registration
- Global commands can take up to 1 hour to propagate

## Contributing

This is a personal project for fun with friends, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with [discord.js](https://github.com/discordjs/discord.js)
- Inspired by friends who wanted more chaos in voice chat

## Notes

This project was migrated from Go to TypeScript to use the more stable and feature-rich discord.js library. The Go version had issues with the discordgo voice connection implementation.
