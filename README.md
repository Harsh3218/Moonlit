# Discord Moderation Bot

A feature-rich Discord bot with **reaction roles** and full **moderation** tooling.

---

## Setup

### 1. Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to the **Bot** tab → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy your **Bot Token**

### 2. Invite the Bot to Your Server

Go to **OAuth2 → URL Generator**, select:
- Scopes: `bot`
- Bot Permissions: `Administrator` (or pick specific ones)

Open the generated URL and add to your server.

### 3. Configure the Bot

Edit `config.json`:
```json
{
  "token": "PASTE_YOUR_TOKEN_HERE",
  "prefix": "!",
  "modLogChannel": "mod-logs",
  "muteRole": "Muted"
}
```

### 4. Install & Run

```bash
npm install
npm start
```

Create a channel called `mod-logs` in your server to receive moderation logs.

---

## Commands

### 🔨 Moderation

| Command | Description | Permission |
|---------|-------------|------------|
| `!ban @user [reason]` | Permanently ban a member | Ban Members |
| `!kick @user [reason]` | Kick a member | Kick Members |
| `!mute @user <duration> [reason]` | Timeout a member (e.g. `10m`, `2h`, `1d`) | Moderate Members |
| `!unmute @user [reason]` | Remove timeout | Moderate Members |
| `!warn @user [reason]` | Warn a member (saved + DMed) | Moderate Members |
| `!warnings @user` | View all warnings for a user | Moderate Members |
| `!clear <1-100>` | Bulk delete messages | Manage Messages |
| `!slowmode <seconds>` | Set channel slowmode (0 to disable) | Manage Channels |
| `!lock` | Lock channel (no one can send) | Manage Channels |
| `!unlock` | Unlock channel | Manage Channels |

### 🎭 Reaction Roles

**Step 1:** Create a reaction role message in a channel:
```
!reactionrole create Choose your roles!
```
Copy the **message ID** from the bot's response.

**Step 2:** Add emoji → role pairs:
```
!reactionrole add 1234567890 🎮 @Gamer
!reactionrole add 1234567890 🎵 @Music Lover
!reactionrole add 1234567890 📢 @Announcements
```

**Step 3:** Members react to get the role — unreact to remove it!

**Other subcommands:**
```
!reactionrole remove <msgId> <emoji>   # Remove a pair
!reactionrole list                      # List all setups
```

### ℹ️ Info

| Command | Description |
|---------|-------------|
| `!userinfo [@user]` | Display user information |
| `!serverinfo` | Display server information |
| `!help [command]` | Show help |

---

## File Structure

```
discord-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── commands/
│   │   ├── ban.js
│   │   ├── kick.js
│   │   ├── mute.js
│   │   ├── unmute.js
│   │   ├── warn.js
│   │   ├── warnings.js
│   │   ├── clear.js
│   │   ├── slowmode.js
│   │   ├── lock.js
│   │   ├── unlock.js
│   │   ├── reactionrole.js
│   │   ├── userinfo.js
│   │   ├── serverinfo.js
│   │   └── help.js
│   ├── events/
│   │   ├── ready.js
│   │   ├── messageCreate.js
│   │   ├── reactionAdd.js
│   │   └── reactionRemove.js
│   └── utils/
│       └── modlog.js
├── data/                     # Auto-created: warnings.json, reactionRoles.json
├── config.json
├── package.json
└── README.md
```

---

## Adding New Commands

Create a new file in `src/commands/`:

```js
module.exports = {
  name: 'commandname',
  description: 'What it does',
  usage: '!commandname <args>',
  permissions: ['ManageMessages'], // optional
  async execute(message, args, client) {
    // your logic
  },
};
```

It will be auto-loaded on next start — no other changes needed.
