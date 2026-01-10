# Run the bot 24/7 (always-on)

A Vercel/Manus static deployment only hosts the dashboard UI.
To run the trading engine 24/7, you need an **always-on Node process** (container or VM).

This repo already auto-starts the trading loop on server boot (see `server/_core/index.ts`).

## Option 0: Run 24/7 on your home PC (free)

### A) Start the bot locally

```bash
corepack pnpm install
corepack pnpm run build
corepack pnpm start
```

Open on the same PC:
- `http://localhost:3000/`
- Health: `http://localhost:3000/health`

### B) Auto-start on login (so it comes back after reboot)

This repo includes a restart-on-crash launcher:
- `scripts/run-bot-forever.ps1`
- `scripts/run-bot-forever.cmd`

Auto-start method (no admin): copy the launcher into your Startup folder:
```powershell
$startup = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
Copy-Item -Force "C:\Users\georg\GR-bot\scripts\run-bot-forever.cmd" (Join-Path $startup "GR-bot-24-7.cmd")
```

### C) Access from your phone on the same Wi‑Fi

Find your LAN IP (example: `192.168.0.127`) and open:
- `http://<LAN-IP>:3000/`

If it does not load, Windows Firewall is blocking port 3000.
Run PowerShell **as Administrator** and add an inbound rule:
```powershell
New-NetFirewallRule -DisplayName "GR-bot TCP 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private
```

### D) Access securely from anywhere (safer than public tunnels)

Use Tailscale (private VPN). Install and sign in on your PC and your phone, then open:
- `http://<tailscale-ip>:3000/`

Install:
```powershell
winget install --id Tailscale.Tailscale -e
```

Enable/login:
```powershell
tailscale up
```

Get your PC’s Tailscale IP:
```powershell
tailscale ip -4
```

## Recommended: Deploy the full app as a container

This repo includes a `Dockerfile` that builds `dist/` and runs `node dist/index.js`.

### Option A: Fly.io (container, always-on)

1) Install Fly CLI
- https://fly.io/docs/flyctl/install/

2) Login
```bash
fly auth login
```

3) Launch (creates the app)
```bash
fly launch
```
- Choose an app name (e.g. `gr-bot-live`)
- Region: pick closest
- When asked about Postgres: choose based on your DB plan (optional)

4) Create + attach Postgres (recommended)

Create a Postgres cluster:
```bash
fly postgres create --name gr-bot-db --region lhr
```

Attach it to your app (this sets `DATABASE_URL` automatically):
```bash
fly postgres attach --app gr-bot-live gr-bot-db
```

5) Set secrets (minimum)
```bash
fly secrets set \
  JWT_SECRET="your-long-random-string" \
  HYPERLIQUID_PRIVATE_KEY="your_private_key" \
  HYPERLIQUID_USE_MAINNET="true"
```

6) Deploy
```bash
fly deploy
```

7) Your always-on URL
Fly prints a URL like:
- `https://<app-name>.fly.dev`

### Option B: Railway (container)

1) Create a new Railway project
2) Deploy from GitHub repo (or use the CLI)
3) Railway detects Dockerfile automatically
4) Set environment variables (same as `.env.example`)

### Option C: Render (container)

Render can run Docker services; free plans may sleep.
Use Docker deploy and set the same environment variables.

## Notes

- Vercel URL you already have is a **static UI**. For live trading + UI in one URL, deploy the full app (client+server) to Fly/Railway/Render and use that URL.
- The server exposes a health endpoint:
  - `/health`

## Local run (sanity)

```bash
corepack pnpm install
corepack pnpm dev
```
Open:
- `http://localhost:3000/`
