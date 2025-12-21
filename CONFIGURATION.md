# Dashboard Configuration Guide

This guide explains how to configure the dashboard to connect to your Freqtrade bot.

## Environment Variables

The dashboard uses the following environment variables to connect to your Freqtrade bot:

### Required Configuration

```
FREQTRADE_API_URL=http://localhost:8080
```

This is the URL where your Freqtrade bot's REST API is running. The default is `http://localhost:8080`.

### Optional Configuration

```
FREQTRADE_API_USERNAME=your_username
FREQTRADE_API_PASSWORD=your_password
```

Only set these if your Freqtrade bot requires authentication.

---

## How to Set Environment Variables

### Option 1: Command Line (Temporary)

**Windows (Command Prompt)**:
```batch
set FREQTRADE_API_URL=http://localhost:8080
npm run dev
```

**Windows (PowerShell)**:
```powershell
$env:FREQTRADE_API_URL="http://localhost:8080"
npm run dev
```

**Linux/Mac**:
```bash
export FREQTRADE_API_URL=http://localhost:8080
npm run dev
```

### Option 2: .env.local File (Persistent)

Create a `.env.local` file in the project root directory:

```
FREQTRADE_API_URL=http://localhost:8080
FREQTRADE_API_USERNAME=your_username
FREQTRADE_API_PASSWORD=your_password
```

Then start the dashboard:
```bash
npm run dev
```

### Option 3: System Environment Variables (Permanent)

Set environment variables in your system settings so they persist across restarts.

**Windows**:
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Click "New" under "User variables"
5. Set `FREQTRADE_API_URL` to your bot's URL
6. Restart your terminal/IDE

**Linux/Mac**:
Add to your shell profile (~/.bashrc, ~/.zshrc, etc.):
```bash
export FREQTRADE_API_URL=http://localhost:8080
```

---

## Verifying Your Configuration

### Step 1: Check Freqtrade is Running

Make sure your Freqtrade bot is running:
```bash
freqtrade start
```

### Step 2: Test the API Connection

Open your browser and visit:
```
http://localhost:8080/api/v1/ping
```

You should see a JSON response like:
```json
{
  "status": "running"
}
```

### Step 3: Start the Dashboard

```bash
npm run dev
```

### Step 4: Check Connection Status

Open the dashboard in your browser. You should see:
- **"Connected"** status in the top-right corner (green dot)
- Trading metrics displayed (profit, win rate, open trades, etc.)

If you see **"Disconnected"**, check:
1. Freqtrade is running
2. `FREQTRADE_API_URL` is set correctly
3. The REST API is enabled in your Freqtrade config

---

## Freqtrade Configuration

For the dashboard to work, your Freqtrade bot must have the REST API enabled.

### Enable REST API in Freqtrade

Edit your Freqtrade `config.json`:

```json
{
  "api_server": {
    "enabled": true,
    "listen_ip_address": "127.0.0.1",
    "listen_port": 8080,
    "verbosity": "info",
    "enable_openapi": true,
    "jwt_secret_key": "your-secret-key-here"
  }
}
```

### Key Settings:

- **`enabled`**: Must be `true`
- **`listen_ip_address`**: 
  - `127.0.0.1` for local access only
  - `0.0.0.0` for network access
- **`listen_port`**: Default is `8080` (change if needed)
- **`jwt_secret_key`**: Required for authentication

---

## Troubleshooting

### Dashboard Shows "Disconnected"

1. **Verify Freqtrade is running**:
   ```bash
   freqtrade start
   ```

2. **Check the API is enabled** in `config.json`:
   ```json
   "api_server": {
     "enabled": true
   }
   ```

3. **Verify the correct port** (default 8080):
   ```bash
   http://localhost:8080/api/v1/ping
   ```

4. **Check environment variable**:
   ```bash
   # Windows
   echo %FREQTRADE_API_URL%
   
   # Linux/Mac
   echo $FREQTRADE_API_URL
   ```

5. **Check firewall** if accessing from another machine

### "Unauthorized" Error

1. Verify credentials are correct
2. Check `jwt_secret_key` is set in Freqtrade config
3. Ensure `FREQTRADE_API_USERNAME` and `FREQTRADE_API_PASSWORD` match your Freqtrade setup

### No Data Showing

1. Verify Freqtrade has active trades
2. Check bot logs for errors
3. Verify REST API endpoints are responding:
   - `http://localhost:8080/api/v1/status`
   - `http://localhost:8080/api/v1/trades`
4. Restart both Freqtrade and the dashboard

---

## Default Values

| Variable | Default | Purpose |
|----------|---------|---------|
| `FREQTRADE_API_URL` | `http://localhost:8080` | Freqtrade REST API URL |
| `FREQTRADE_API_USERNAME` | (none) | API authentication username |
| `FREQTRADE_API_PASSWORD` | (none) | API authentication password |

---

## Next Steps

1. Set up Freqtrade on your Windows PC
2. Enable the REST API in your Freqtrade config
3. Configure the dashboard with your bot's URL
4. Start the dashboard and verify connection
5. Monitor your trades in real-time!

For more information, see [FREQTRADE_SETUP.md](./FREQTRADE_SETUP.md)
