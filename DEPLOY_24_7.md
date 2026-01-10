# Run the bot 24/7 (always-on)

A Vercel/Manus static deployment only hosts the dashboard UI.
To run the trading engine 24/7, you need an **always-on Node process** (container or VM).

This repo already auto-starts the trading loop on server boot (see `server/_core/index.ts`).

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

4) Set secrets (minimum)
```bash
fly secrets set \
  JWT_SECRET="your-long-random-string" \
  HYPERLIQUID_PRIVATE_KEY="your_private_key" \
  HYPERLIQUID_USE_MAINNET="true"
```

If you have a DB (recommended):
```bash
fly secrets set DATABASE_URL="your_db_url"
```

5) Deploy
```bash
fly deploy
```

6) Your always-on URL
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
