# Freqtrade Dashboard - Setup & Configuration Guide

This guide explains how to connect your Freqtrade trading bot to the dashboard.

## Quick Start

The dashboard automatically connects to your Freqtrade bot using environment variables. Follow these steps:

### Step 1: Set Your Freqtrade API URL

When you start the dashboard, set the `FREQTRADE_API_URL` environment variable to point to your bot:

```bash
# On Windows (Command Prompt)
set FREQTRADE_API_URL=http://localhost:8080

# On Windows (PowerShell)
$env:FREQTRADE_API_URL="http://localhost:8080"

# On Linux/Mac
export FREQTRADE_API_URL=http://localhost:8080
```

### Step 2: Set API Credentials (if required)

If your Freqtrade bot requires authentication:

```bash
# Set username
set FREQTRADE_API_USERNAME=your_username

# Set password
set FREQTRADE_API_PASSWORD=your_password
```

### Step 3: Start the Dashboard

```bash
npm run dev
```

The dashboard will automatically connect to your Freqtrade bot and begin polling for data.

---

## Default Configuration

| Setting | Default Value | Environment Variable |
|---------|---------------|----------------------|
| API URL | `http://localhost:8080` | `FREQTRADE_API_URL` |
| Username | (none) | `FREQTRADE_API_USERNAME` |
| Password | (none) | `FREQTRADE_API_PASSWORD` |
| Poll Interval | 5 seconds | (built-in) |

---

## Freqtrade REST API Setup

Before connecting the dashboard, ensure your Freqtrade bot has the REST API enabled.

### Enable REST API in Freqtrade Config

Edit your Freqtrade `config.json` file:

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

- **`enabled`**: Set to `true` to enable the REST API
- **`listen_ip_address`**: `127.0.0.1` for local access, `0.0.0.0` for network access
- **`listen_port`**: Default is `8080` (can be changed)
- **`jwt_secret_key`**: Required for authentication (generate a secure random string)

---

## Testing the Connection

Once configured, the dashboard will:

1. **Automatically test the connection** on startup
2. **Display "Connected" status** in the top-right corner when successful
3. **Show "Disconnected"** if the bot is unreachable
4. **Poll for updates** every 5-10 seconds

### Manual Testing

To verify your Freqtrade API is working, open your browser and visit:

```
http://localhost:8080/api/v1/status
```

You should see a JSON response with your bot's status.

---

## Troubleshooting

### Dashboard Shows "Disconnected"

**Problem**: The dashboard can't reach your Freqtrade bot.

**Solutions**:
1. Verify Freqtrade is running: `freqtrade start`
2. Check the API is enabled in your config.json
3. Verify the correct port (default: 8080)
4. Check firewall settings if accessing from another machine
5. Verify `FREQTRADE_API_URL` is set correctly

### "Unauthorized" or "Invalid Credentials"

**Problem**: API authentication failed.

**Solutions**:
1. Verify `FREQTRADE_API_USERNAME` and `FREQTRADE_API_PASSWORD` are correct
2. Check your Freqtrade config has `jwt_secret_key` set
3. Ensure you're using the correct credentials from your Freqtrade setup

### No Data Showing in Dashboard

**Problem**: Dashboard connects but shows no trades or metrics.

**Solutions**:
1. Verify your Freqtrade bot has trades (check bot logs)
2. Ensure the strategy is running and generating trades
3. Check that the REST API endpoints are responding: `http://localhost:8080/api/v1/trades`
4. Restart both Freqtrade and the dashboard

---

## Environment Variables Reference

### Dashboard Environment Variables

```bash
# Freqtrade API Configuration
FREQTRADE_API_URL=http://localhost:8080
FREQTRADE_API_USERNAME=optional_username
FREQTRADE_API_PASSWORD=optional_password

# Dashboard Settings
VITE_APP_TITLE=George's Trade Bot
VITE_APP_LOGO=path/to/logo.png
```

### How to Set Environment Variables

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

**Windows (.env file)**:
Create a `.env.local` file in the project root:
```
FREQTRADE_API_URL=http://localhost:8080
FREQTRADE_API_USERNAME=your_username
FREQTRADE_API_PASSWORD=your_password
```

**Linux/Mac**:
```bash
export FREQTRADE_API_URL=http://localhost:8080
npm run dev
```

---

## API Endpoints Used

The dashboard uses these Freqtrade REST API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/status` | Bot status and version |
| `/api/v1/trades` | Open trades |
| `/api/v1/trades?limit=50` | Trade history |
| `/api/v1/performance` | Performance metrics |
| `/api/v1/stats` | Daily statistics |
| `/api/v1/show_config` | Strategy configuration |
| `/api/v1/health` | Bot health check |

---

## Next Steps

1. **Set up Freqtrade** on your Windows PC following the [official guide](https://www.freqtrade.io/en/stable/)
2. **Enable the REST API** in your Freqtrade config.json
3. **Configure the dashboard** with your bot's API URL
4. **Start the dashboard** and verify the "Connected" status
5. **Monitor your trades** in real-time!

---

## Support

For issues with:
- **Freqtrade setup**: Visit [Freqtrade Documentation](https://www.freqtrade.io/en/stable/)
- **Dashboard configuration**: Check the environment variables section above
- **API connectivity**: Verify your Freqtrade REST API is enabled and accessible

