# Deploying GR-bot Dashboard on Manus

This guide explains how to deploy the GR-bot dashboard as a static site on Manus.

## Overview

The GR-bot dashboard can be deployed as a standalone static site that runs entirely in the browser without requiring a backend server. This is ideal for:
- Preview deployments
- Testing and development
- Situations where you want to view trading data without connecting to live APIs

## Prerequisites

- A Manus account
- The GR-bot repository

## Deployment Steps

### 1. Configure Your Manus Project

Create or update your Manus configuration with the following settings:

**Build Command:**
```bash
pnpm run build
```

**Output Directory:**
```
dist/public
```

**Environment Variables:**
Set the following environment variable to enable mock/preview mode:
```
VITE_PREVIEW_MODE=mock
```

### 2. SPA Routing Configuration

The dashboard uses client-side routing (SPA). Ensure your Manus configuration includes URL rewrites to properly handle routes:

**Rewrites:**
All routes should redirect to `/index.html` to support SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This configuration is already present in `vercel.json` and should be automatically detected by Manus.

### 3. Deploy

Push your code to your repository. Manus will automatically:
1. Install dependencies with `pnpm install`
2. Generate build information (git SHA + timestamp)
3. Build the static site with `pnpm run build`
4. Deploy the contents of `dist/public`

## Mock Mode vs. Live Mode

### Mock Mode (Default for Static Deployments)
When `VITE_PREVIEW_MODE=mock` is set, the dashboard will:
- Use simulated trading data
- Not require a backend server
- Work as a fully static site

This is the recommended mode for static deployments on Manus.

### Live Mode (Server Required)
To connect to a real trading backend:
1. Deploy the full stack (client + server)
2. Do not set `VITE_PREVIEW_MODE` or set it to a different value
3. Configure additional environment variables for your Freqtrade API connection (see `CONFIGURATION.md`)

## Verifying Your Deployment

After deployment, verify that:
1. The dashboard loads correctly
2. Navigation between pages works (Home, Settings, etc.)
3. The build version info is displayed in the footer showing:
   - Git commit SHA (short form)
   - Git branch name
   - Build timestamp

The version info helps you confirm you're viewing the latest deployment.

## Troubleshooting

### Routes return 404
Make sure the rewrite rules are configured correctly to redirect all routes to `/index.html`.

### Build Info Shows "unknown"
This can happen if git information is not available during the build. The dashboard will still work, but won't show specific version details.

### Mock Data Not Loading
Ensure `VITE_PREVIEW_MODE=mock` is set in your environment variables.

## Additional Configuration

For more detailed configuration options, see:
- `CONFIGURATION.md` - Environment variables and API configuration
- `vercel.json` - Static site deployment configuration
- `vite.config.ts` - Build configuration

## Local Testing

To test the static build locally:

```bash
# Build the static site
pnpm run build

# Serve the static files (requires a local server)
# Option 1: Using Python
cd dist/public && python3 -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server dist/public -p 8000
```

Then visit `http://localhost:8000` in your browser.

## Support

For issues or questions:
- Check the main project README
- Review `CONFIGURATION.md` for environment setup
- Check the Manus deployment logs for build errors
