import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startTrading, executeTradingCycle, getSession } from "../aggressiveScalper";
import { loadBrainFromDatabase, saveBrainToDatabase } from "../brainPersistence";
import { getActiveHyperliquidConnection } from "../db";
import { initializeHyperliquid, getConnectionStatus } from "../hyperliquid";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Auto-start trading bot on server startup
    autoStartTradingBot();
  });
}

/**
 * Auto-start the trading bot when server starts
 * This ensures 24/7 continuous operation
 */
async function autoStartTradingBot() {
  console.log('[AutoStart] Initializing trading bot...');
  
  try {
    // Auto-reconnect Hyperliquid if there's a saved connection
    console.log('[AutoStart] Checking for saved Hyperliquid connection...');
    try {
      const savedConnection = await getActiveHyperliquidConnection();
      if (savedConnection) {
        console.log('[AutoStart] Found saved Hyperliquid connection, reconnecting...');
        const success = initializeHyperliquid({
          privateKey: savedConnection.privateKey,
          useMainnet: savedConnection.useMainnet,
        });
        if (success) {
          const status = getConnectionStatus();
          console.log(`[AutoStart] Hyperliquid reconnected successfully to ${status.network}`);
          console.log(`[AutoStart] Wallet: ${status.wallet}`);
        } else {
          console.error('[AutoStart] Failed to reconnect to Hyperliquid');
        }
      } else {
        console.log('[AutoStart] No saved Hyperliquid connection found');
      }
    } catch (hlError) {
      console.error('[AutoStart] Error reconnecting Hyperliquid:', hlError);
    }
    
    // Load AI brain state from database
    console.log('[AutoStart] Loading AI brain from database...');
    const brainLoaded = await loadBrainFromDatabase();
    if (brainLoaded) {
      console.log('[AutoStart] AI brain loaded successfully - resuming learned state');
    } else {
      console.log('[AutoStart] No saved brain found - starting fresh');
    }
    
    // Start trading session
    console.log('[AutoStart] Starting trading session...');
    startTrading();
    console.log('[AutoStart] Trading bot is now LIVE and learning!');
    
    // Start continuous trading loop
    startContinuousTradingLoop();
    
    // Start periodic brain save (every 5 minutes)
    startPeriodicBrainSave();
    
  } catch (error) {
    console.error('[AutoStart] Error starting trading bot:', error);
  }
}

/**
 * Continuous trading loop - runs every 10 seconds
 */
function startContinuousTradingLoop() {
  const TRADING_INTERVAL = 10000; // 10 seconds
  
  setInterval(async () => {
    try {
      const session = getSession();
      if (session?.isRunning) {
        await executeTradingCycle();
      }
    } catch (error) {
      console.error('[TradingLoop] Error in trading cycle:', error);
    }
  }, TRADING_INTERVAL);
  
  console.log(`[AutoStart] Trading loop started - executing every ${TRADING_INTERVAL/1000}s`);
}

/**
 * Periodic brain save - saves AI state every 5 minutes
 */
function startPeriodicBrainSave() {
  const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  setInterval(async () => {
    try {
      console.log('[BrainSave] Auto-saving AI brain state...');
      await saveBrainToDatabase();
      console.log('[BrainSave] Brain state saved successfully');
    } catch (error) {
      console.error('[BrainSave] Error saving brain:', error);
    }
  }, SAVE_INTERVAL);
  
  console.log(`[AutoStart] Brain auto-save enabled - saving every ${SAVE_INTERVAL/60000} minutes`);
}

startServer().catch(console.error);
