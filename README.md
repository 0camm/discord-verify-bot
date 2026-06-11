# Discord Verification Bot

A professional, production-ready Discord verification bot built with **Discord.js v14** and **Node.js**.

---

## Features

- `/panel` — Admin command to deploy a beautiful verification panel in any channel
- **Generate Key** button — Sends a unique, time-limited key to the user via DM
- `/verify <key>` — Users submit their key to receive the verified role
- **Auto-role on join** — New members automatically receive an unverified role
- **Rate limiting** — Prevents spam (configurable: 3 keys per 30 minutes)
- **Key expiry** — Keys expire after 10 minutes by default (configurable)
- **One-time use** — Each key is consumed on successful verification
- **Logging** — All events logged to console and `logs/` files

---

## Project Structure

```
discord-verify-bot/
├── src/
│   ├── index.js                  # Bot entry point
│   ├── commands/
│   │   ├── panel.js              # /panel command
│   │   └── verify.js             # /verify command
│   ├── events/
│   │   ├── ready.js              # On bot start; registers slash commands
│   │   ├── interactionCreate.js  # Handles commands + button clicks
│   │   └── guildMemberAdd.js     # Auto-role on new member join
│   └── utils/
│       ├── embeds.js             # Embed builders
│       ├── keyStore.js           # Key generation, storage, rate limiting
│       └── logger.js             # Winston logger
├── logs/                         # Created automatically
├── .env                          # Your secrets (never commit this!)
├── .env.example                  # Template for .env
├── .gitignore
├── ecosystem.config.js           # PM2 process manager config
└── package.json
```

---

## Step 1 — Create Your Discord Application & Bot

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → give it a name (e.g. "Verify Bot") → **Create**
3. In the left sidebar click **Bot**
4. Click **Add Bot** → **Yes, do it!**
5. Under **TOKEN** click **Reset Token**, then **Copy** — this is your `BOT_TOKEN`
   - ⚠️ **Keep this secret.** Never share it or commit it to Git.
6. Scroll down to **Privileged Gateway Intents** and enable:
   - ✅ **Server Members Intent** (required for auto-role on join)
7. Click **Save Changes**

---

## Step 2 — Invite the Bot to Your Server

1. In the left sidebar click **OAuth2** → **URL Generator**
2. Under **Scopes** check: `bot`, `applications.commands`
3. Under **Bot Permissions** check:
   - `Manage Roles`
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
   - `View Channels`
4. Copy the generated URL at the bottom and open it in your browser
5. Select your server → **Authorise**

> ⚠️ **Important:** The bot's role in your server must be **above** the Verified and Unverified roles in the role list. Go to **Server Settings → Roles** and drag the bot's role higher.

---

## Step 3 — Set Up Your Discord Roles

You already have two role IDs configured:

| Role | ID | Purpose |
|---|---|---|
| Verified | `1514732060856549437` | Given after successful verification |
| Unverified | `1514733536622415972` | Given to every new member on join |

Make sure these roles exist in your server. The **Unverified** role should restrict access to most channels (deny `View Channel` permission on your main channels). The **Verified** role should grant access.

---

## Step 4 — Set Up the Project on macOS

### 4a. Install Node.js (if not already installed)

```bash
# Install Homebrew first (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js v20 (LTS)
brew install node
```

Verify the installation:
```bash
node --version   # should show v20.x.x or higher
npm --version    # should show 10.x.x or higher
```

### 4b. Download the Bot Files

Option A — Clone from Git (if you've pushed to GitHub):
```bash
git clone https://github.com/YOUR_USERNAME/discord-verify-bot.git
cd discord-verify-bot
```

Option B — Just copy the folder to your desired location:
```bash
cd ~/Documents  # or wherever you want it
# place the discord-verify-bot folder here
cd discord-verify-bot
```

### 4c. Install Dependencies

```bash
npm install
```

This installs `discord.js`, `dotenv`, `winston`, and `nodemon`.

### 4d. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` in a text editor and paste in your bot token:
```
BOT_TOKEN=paste_your_token_here
VERIFIED_ROLE_ID=1514732060856549437
UNVERIFIED_ROLE_ID=1514733536622415972
KEY_EXPIRY_MINUTES=10
RATE_LIMIT_COUNT=3
RATE_LIMIT_MINUTES=30
```

---

## Step 5 — Run the Bot Locally

```bash
npm start
```

You should see output like:
```
[2024-01-01 12:00:00] INFO: Logged in as VerifyBot#1234 (123456789012345678)
[2024-01-01 12:00:00] INFO: Registering 2 slash command(s)...
[2024-01-01 12:00:01] INFO: Slash commands registered successfully.
```

> **Note:** Slash commands can take up to 1 hour to appear globally. For instant testing, you can register them to a specific guild — see the Troubleshooting section.

### Test It

1. Go to your server and type `/panel` in any channel
2. Select the channel where the panel should appear
3. The verification panel will be posted
4. Click **Generate Key** — you'll get a DM with your key
5. Run `/verify XXXX-XXXX-XXXX-XXXX` (replace with your actual key)
6. You should receive the Verified role automatically

---

## Step 6 — Host the Bot 24/7 (Even When Your Mac is Off)

Running the bot on your Mac only works while your Mac is on. To keep it online 24/7, deploy it to a cloud server.

### Recommended: Railway (Easiest — Free Tier Available)

1. Push your code to GitHub (make sure `.env` is in `.gitignore` — it is by default)
2. Go to [https://railway.app](https://railway.app) and sign in with GitHub
3. Click **New Project** → **Deploy from GitHub repo** → select your repo
4. In the **Variables** tab, add all your `.env` values:
   - `BOT_TOKEN`, `VERIFIED_ROLE_ID`, `UNVERIFIED_ROLE_ID`, `KEY_EXPIRY_MINUTES`, etc.
5. Set the **Start Command** to: `node src/index.js`
6. Deploy — Railway will keep it running 24/7 and restart it if it crashes

### Alternative: DigitalOcean Droplet (VPS — $6/month)

```bash
# 1. Create a Ubuntu 22.04 droplet at digitalocean.com
# 2. SSH into it
ssh root@YOUR_DROPLET_IP

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager for auto-restart)
npm install -g pm2

# 5. Upload your bot files (from your Mac)
# Run this on your Mac, not the VPS:
scp -r ./discord-verify-bot root@YOUR_DROPLET_IP:/root/

# 6. Back on the VPS, install dependencies
cd /root/discord-verify-bot
npm install

# 7. Create your .env file
nano .env
# Paste your environment variables, then Ctrl+X → Y → Enter to save

# 8. Start the bot with PM2
pm2 start ecosystem.config.js

# 9. Make PM2 start on server reboot
pm2 startup
pm2 save
```

Useful PM2 commands:
```bash
pm2 status            # check if bot is running
pm2 logs              # view live logs
pm2 restart all       # restart the bot
pm2 stop all          # stop the bot
```

### Alternative: Render (Free Tier — May Sleep)

1. Push to GitHub
2. Go to [https://render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Set: **Build Command** = `npm install`, **Start Command** = `node src/index.js`
5. Add your environment variables in the **Environment** tab
6. Deploy

> ⚠️ Render's free tier spins down after inactivity. Use Railway or a VPS for guaranteed uptime.

---

## Auto-Restart on Crash

If you're using **PM2** (VPS option), crashes are automatically handled — PM2 restarts the process with a 5-second delay (configured in `ecosystem.config.js`).

If you're using **Railway** or **Render**, crashes are also automatically restarted by the platform.

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `BOT_TOKEN` | — | Your bot token from the Developer Portal |
| `VERIFIED_ROLE_ID` | `1514732060856549437` | Role assigned after verification |
| `UNVERIFIED_ROLE_ID` | `1514733536622415972` | Role assigned on member join |
| `KEY_EXPIRY_MINUTES` | `10` | Minutes before a key expires |
| `RATE_LIMIT_COUNT` | `3` | Max keys per rate-limit window |
| `RATE_LIMIT_MINUTES` | `30` | Duration of rate-limit window |

---

## Troubleshooting

**Slash commands don't appear after running the bot**
> Global commands can take up to 1 hour to propagate. For instant testing, modify `ready.js` to use `Routes.applicationGuildCommands(clientId, guildId)` instead of `Routes.applicationCommands(clientId)`, passing your server's ID.

**"I couldn't send you a Direct Message"**
> The user needs to allow DMs from server members. In Discord: right-click the server icon → Privacy Settings → enable Direct Messages.

**"Verified role not found" error**
> Make sure the role IDs in your `.env` are correct and the roles exist in your server. Get role IDs by enabling Developer Mode (User Settings → Advanced → Developer Mode) then right-clicking a role.

**Bot can't assign roles**
> The bot's own role must be higher in the role list than the roles it's trying to assign. Go to Server Settings → Roles and drag the bot's role above the Verified/Unverified roles.

**Bot goes offline after closing Terminal (local run)**
> That's expected for local development. Use Railway, Render, or a VPS to keep it online 24/7.

**Permission errors on the `/panel` command**
> Only server administrators can run `/panel`. This is enforced by `setDefaultMemberPermissions(PermissionFlagsBits.Administrator)`.
