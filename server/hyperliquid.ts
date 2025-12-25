/**
 * Hyperliquid Exchange Integration
 * Real perpetual futures trading on Hyperliquid L1
 */

import { ethers } from "ethers";

// Hyperliquid API endpoints
const MAINNET_API = "https://api.hyperliquid.xyz";
const TESTNET_API = "https://api.hyperliquid-testnet.xyz";

// Use testnet by default for safety
let API_BASE = TESTNET_API;
let IS_MAINNET = false;

// Wallet configuration
let wallet: ethers.Wallet | null = null;
let walletAddress: string | null = null;

// Connection status
let isConnected = false;
let lastError: string | null = null;

export interface HyperliquidConfig {
  privateKey: string;
  useMainnet?: boolean;
}

export interface Position {
  coin: string;
  size: number;
  entryPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
}

export interface Order {
  oid: number;
  coin: string;
  side: "B" | "A"; // B = Buy, A = Ask/Sell
  limitPx: number;
  sz: number;
  timestamp: number;
  orderType: string;
}

export interface AccountState {
  marginSummary: {
    accountValue: number;
    totalMarginUsed: number;
    totalNtlPos: number;
    totalRawUsd: number;
  };
  crossMarginSummary: {
    accountValue: number;
    totalMarginUsed: number;
  };
  assetPositions: Position[];
  withdrawable: number;
}

export interface MarketData {
  coin: string;
  markPrice: number;
  midPrice: number;
  bestBid: number;
  bestAsk: number;
  volume24h: number;
  openInterest: number;
  funding: number;
  change24h: number;
}

export interface TradeResult {
  success: boolean;
  orderId?: number;
  filledSize?: number;
  avgPrice?: number;
  error?: string;
}

/**
 * Initialize Hyperliquid connection with wallet
 */
export function initializeHyperliquid(config: HyperliquidConfig): boolean {
  console.log("[Hyperliquid] initializeHyperliquid called");
  console.log(`[Hyperliquid] Config received: useMainnet=${config.useMainnet}, keyLength=${config.privateKey?.length || 0}`);
  
  try {
    // Clean up the private key
    let privateKey = config.privateKey?.trim() || "";
    console.log(`[Hyperliquid] After trim, keyLength=${privateKey.length}`);
    
    // Remove any whitespace or newlines
    privateKey = privateKey.replace(/\s/g, "");
    console.log(`[Hyperliquid] After whitespace removal, keyLength=${privateKey.length}`);
    
    // Validate private key - should be 64 hex chars (without 0x) or 66 (with 0x)
    if (!privateKey) {
      lastError = "Private key is required";
      console.error("[Hyperliquid] Private key is empty");
      return false;
    }
    
    // Add 0x prefix if missing
    if (!privateKey.startsWith("0x")) {
      privateKey = `0x${privateKey}`;
    }
    
    // Check length (should be 66 with 0x prefix)
    if (privateKey.length !== 66) {
      lastError = `Invalid private key length: ${privateKey.length} (expected 66 with 0x prefix)`;
      console.error(`[Hyperliquid] ${lastError}`);
      return false;
    }
    
    // Validate hex format
    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      lastError = "Invalid private key format - must be hexadecimal";
      console.error("[Hyperliquid] Invalid hex format");
      return false;
    }

    // Create wallet from private key
    try {
      wallet = new ethers.Wallet(privateKey);
      walletAddress = wallet.address;
    } catch (walletError) {
      lastError = `Failed to create wallet: ${walletError instanceof Error ? walletError.message : "Unknown error"}`;
      console.error(`[Hyperliquid] ${lastError}`);
      return false;
    }

    // Set network
    IS_MAINNET = config.useMainnet || false;
    API_BASE = IS_MAINNET ? MAINNET_API : TESTNET_API;

    isConnected = true;
    lastError = null;
    
    console.log(`[Hyperliquid] Successfully connected to ${IS_MAINNET ? "MAINNET" : "TESTNET"}`);
    console.log(`[Hyperliquid] Wallet address: ${walletAddress}`);
    
    return true;
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Unknown error during initialization";
    console.error(`[Hyperliquid] Connection error: ${lastError}`);
    isConnected = false;
    return false;
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
  connected: boolean;
  network: string;
  wallet: string | null;
  error: string | null;
} {
  return {
    connected: isConnected,
    network: IS_MAINNET ? "mainnet" : "testnet",
    wallet: walletAddress,
    error: lastError,
  };
}

/**
 * Sign a message for Hyperliquid API authentication
 */
async function signL1Action(action: object, nonce: number): Promise<string> {
  if (!wallet) throw new Error("Wallet not initialized");

  const message = {
    action,
    nonce,
    vaultAddress: null,
  };

  const messageString = JSON.stringify(message);
  const signature = await wallet.signMessage(messageString);
  return signature;
}

/**
 * Make authenticated API request
 */
async function apiRequest(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: object
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all available markets/coins
 */
export async function getMarkets(): Promise<string[]> {
  try {
    const response = await apiRequest("/info", "POST", {
      type: "meta",
    });
    
    return response.universe.map((m: any) => m.name);
  } catch (error) {
    console.error("[Hyperliquid] Failed to get markets:", error);
    return [];
  }
}

/**
 * Get real-time market data for a coin
 */
export async function getMarketData(coin: string): Promise<MarketData | null> {
  try {
    const response = await apiRequest("/info", "POST", {
      type: "allMids",
    });

    const midPrice = parseFloat(response[coin] || "0");
    
    // Get additional market info
    const metaResponse = await apiRequest("/info", "POST", {
      type: "metaAndAssetCtxs",
    });

    const assetCtx = metaResponse[1]?.find((a: any) => a.coin === coin);
    
    return {
      coin,
      markPrice: midPrice,
      midPrice,
      bestBid: midPrice * 0.9999,
      bestAsk: midPrice * 1.0001,
      volume24h: assetCtx?.dayNtlVlm || 0,
      openInterest: assetCtx?.openInterest || 0,
      funding: assetCtx?.funding || 0,
      change24h: assetCtx?.premium || 0,
    };
  } catch (error) {
    console.error(`[Hyperliquid] Failed to get market data for ${coin}:`, error);
    return null;
  }
}

/**
 * Get all market prices
 */
export async function getAllPrices(): Promise<Record<string, number>> {
  try {
    const response = await apiRequest("/info", "POST", {
      type: "allMids",
    });
    
    const prices: Record<string, number> = {};
    for (const [coin, price] of Object.entries(response)) {
      prices[coin] = parseFloat(price as string);
    }
    
    return prices;
  } catch (error) {
    console.error("[Hyperliquid] Failed to get prices:", error);
    return {};
  }
}

/**
 * Get account state (balances, positions, margin)
 */
export async function getAccountState(): Promise<AccountState | null> {
  if (!walletAddress) {
    console.error("[Hyperliquid] Wallet not initialized");
    return null;
  }

  try {
    const response = await apiRequest("/info", "POST", {
      type: "clearinghouseState",
      user: walletAddress,
    });

    return {
      marginSummary: {
        accountValue: parseFloat(response.marginSummary?.accountValue || "0"),
        totalMarginUsed: parseFloat(response.marginSummary?.totalMarginUsed || "0"),
        totalNtlPos: parseFloat(response.marginSummary?.totalNtlPos || "0"),
        totalRawUsd: parseFloat(response.marginSummary?.totalRawUsd || "0"),
      },
      crossMarginSummary: {
        accountValue: parseFloat(response.crossMarginSummary?.accountValue || "0"),
        totalMarginUsed: parseFloat(response.crossMarginSummary?.totalMarginUsed || "0"),
      },
      assetPositions: (response.assetPositions || []).map((p: any) => ({
        coin: p.position.coin,
        size: parseFloat(p.position.szi || "0"),
        entryPrice: parseFloat(p.position.entryPx || "0"),
        unrealizedPnl: parseFloat(p.position.unrealizedPnl || "0"),
        leverage: parseFloat(p.position.leverage?.value || "1"),
        liquidationPrice: parseFloat(p.position.liquidationPx || "0"),
        marginUsed: parseFloat(p.position.marginUsed || "0"),
      })),
      withdrawable: parseFloat(response.withdrawable || "0"),
    };
  } catch (error) {
    console.error("[Hyperliquid] Failed to get account state:", error);
    return null;
  }
}

/**
 * Get open orders
 */
export async function getOpenOrders(): Promise<Order[]> {
  if (!walletAddress) return [];

  try {
    const response = await apiRequest("/info", "POST", {
      type: "openOrders",
      user: walletAddress,
    });

    return (response || []).map((o: any) => ({
      oid: o.oid,
      coin: o.coin,
      side: o.side,
      limitPx: parseFloat(o.limitPx),
      sz: parseFloat(o.sz),
      timestamp: o.timestamp,
      orderType: o.orderType,
    }));
  } catch (error) {
    console.error("[Hyperliquid] Failed to get open orders:", error);
    return [];
  }
}

/**
 * Get recent trades/fills
 */
export async function getRecentTrades(limit: number = 50): Promise<any[]> {
  if (!walletAddress) return [];

  try {
    const response = await apiRequest("/info", "POST", {
      type: "userFills",
      user: walletAddress,
    });

    return (response || []).slice(0, limit);
  } catch (error) {
    console.error("[Hyperliquid] Failed to get recent trades:", error);
    return [];
  }
}

/**
 * Place a market order
 */
export async function placeMarketOrder(
  coin: string,
  side: "buy" | "sell",
  size: number,
  reduceOnly: boolean = false
): Promise<TradeResult> {
  if (!wallet || !walletAddress) {
    return { success: false, error: "Wallet not initialized" };
  }

  try {
    // Get current price for slippage calculation
    const prices = await getAllPrices();
    const currentPrice = prices[coin];
    
    if (!currentPrice) {
      return { success: false, error: `No price found for ${coin}` };
    }

    // Add 0.5% slippage for market orders
    const slippageMultiplier = side === "buy" ? 1.005 : 0.995;
    const limitPrice = currentPrice * slippageMultiplier;

    const nonce = Date.now();
    const action = {
      type: "order",
      orders: [{
        a: getAssetIndex(coin),
        b: side === "buy",
        p: limitPrice.toFixed(6),
        s: size.toFixed(6),
        r: reduceOnly,
        t: { limit: { tif: "Ioc" } }, // Immediate or cancel for market-like behavior
      }],
      grouping: "na",
    };

    const signature = await signL1Action(action, nonce);

    const response = await apiRequest("/exchange", "POST", {
      action,
      nonce,
      signature,
      vaultAddress: null,
    });

    if (response.status === "ok") {
      const fill = response.response?.data?.statuses?.[0];
      return {
        success: true,
        orderId: fill?.resting?.oid || fill?.filled?.oid,
        filledSize: parseFloat(fill?.filled?.totalSz || "0"),
        avgPrice: parseFloat(fill?.filled?.avgPx || "0"),
      };
    } else {
      return { success: false, error: response.response || "Order failed" };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Hyperliquid] Market order failed:`, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Place a limit order
 */
export async function placeLimitOrder(
  coin: string,
  side: "buy" | "sell",
  size: number,
  price: number,
  reduceOnly: boolean = false,
  postOnly: boolean = false
): Promise<TradeResult> {
  if (!wallet || !walletAddress) {
    return { success: false, error: "Wallet not initialized" };
  }

  try {
    const nonce = Date.now();
    const action = {
      type: "order",
      orders: [{
        a: getAssetIndex(coin),
        b: side === "buy",
        p: price.toFixed(6),
        s: size.toFixed(6),
        r: reduceOnly,
        t: { limit: { tif: postOnly ? "Alo" : "Gtc" } },
      }],
      grouping: "na",
    };

    const signature = await signL1Action(action, nonce);

    const response = await apiRequest("/exchange", "POST", {
      action,
      nonce,
      signature,
      vaultAddress: null,
    });

    if (response.status === "ok") {
      const fill = response.response?.data?.statuses?.[0];
      return {
        success: true,
        orderId: fill?.resting?.oid || fill?.filled?.oid,
        filledSize: parseFloat(fill?.filled?.totalSz || "0"),
        avgPrice: parseFloat(fill?.filled?.avgPx || price.toString()),
      };
    } else {
      return { success: false, error: response.response || "Order failed" };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Hyperliquid] Limit order failed:`, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Place a stop-loss order
 */
export async function placeStopLoss(
  coin: string,
  side: "buy" | "sell",
  size: number,
  triggerPrice: number
): Promise<TradeResult> {
  if (!wallet || !walletAddress) {
    return { success: false, error: "Wallet not initialized" };
  }

  try {
    const nonce = Date.now();
    const action = {
      type: "order",
      orders: [{
        a: getAssetIndex(coin),
        b: side === "buy",
        p: triggerPrice.toFixed(6),
        s: size.toFixed(6),
        r: true, // Reduce only for stop-loss
        t: { 
          trigger: { 
            triggerPx: triggerPrice.toFixed(6),
            isMarket: true,
            tpsl: "sl",
          } 
        },
      }],
      grouping: "na",
    };

    const signature = await signL1Action(action, nonce);

    const response = await apiRequest("/exchange", "POST", {
      action,
      nonce,
      signature,
      vaultAddress: null,
    });

    if (response.status === "ok") {
      return { success: true, orderId: response.response?.data?.statuses?.[0]?.resting?.oid };
    } else {
      return { success: false, error: response.response || "Stop-loss failed" };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Hyperliquid] Stop-loss order failed:`, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Place a take-profit order
 */
export async function placeTakeProfit(
  coin: string,
  side: "buy" | "sell",
  size: number,
  triggerPrice: number
): Promise<TradeResult> {
  if (!wallet || !walletAddress) {
    return { success: false, error: "Wallet not initialized" };
  }

  try {
    const nonce = Date.now();
    const action = {
      type: "order",
      orders: [{
        a: getAssetIndex(coin),
        b: side === "buy",
        p: triggerPrice.toFixed(6),
        s: size.toFixed(6),
        r: true, // Reduce only for take-profit
        t: { 
          trigger: { 
            triggerPx: triggerPrice.toFixed(6),
            isMarket: true,
            tpsl: "tp",
          } 
        },
      }],
      grouping: "na",
    };

    const signature = await signL1Action(action, nonce);

    const response = await apiRequest("/exchange", "POST", {
      action,
      nonce,
      signature,
      vaultAddress: null,
    });

    if (response.status === "ok") {
      return { success: true, orderId: response.response?.data?.statuses?.[0]?.resting?.oid };
    } else {
      return { success: false, error: response.response || "Take-profit failed" };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Hyperliquid] Take-profit order failed:`, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(coin: string, orderId: number): Promise<boolean> {
  if (!wallet || !walletAddress) return false;

  try {
    const nonce = Date.now();
    const action = {
      type: "cancel",
      cancels: [{
        a: getAssetIndex(coin),
        o: orderId,
      }],
    };

    const signature = await signL1Action(action, nonce);

    const response = await apiRequest("/exchange", "POST", {
      action,
      nonce,
      signature,
      vaultAddress: null,
    });

    return response.status === "ok";
  } catch (error) {
    console.error(`[Hyperliquid] Cancel order failed:`, error);
    return false;
  }
}

/**
 * Cancel all orders for a coin
 */
export async function cancelAllOrders(coin?: string): Promise<boolean> {
  if (!wallet || !walletAddress) return false;

  try {
    const openOrders = await getOpenOrders();
    const ordersToCancel = coin 
      ? openOrders.filter(o => o.coin === coin)
      : openOrders;

    for (const order of ordersToCancel) {
      await cancelOrder(order.coin, order.oid);
    }

    return true;
  } catch (error) {
    console.error(`[Hyperliquid] Cancel all orders failed:`, error);
    return false;
  }
}

/**
 * Close a position
 */
export async function closePosition(coin: string): Promise<TradeResult> {
  const accountState = await getAccountState();
  if (!accountState) {
    return { success: false, error: "Failed to get account state" };
  }

  const position = accountState.assetPositions.find(p => p.coin === coin);
  if (!position || position.size === 0) {
    return { success: false, error: "No position to close" };
  }

  // Close by placing opposite order
  const side = position.size > 0 ? "sell" : "buy";
  const size = Math.abs(position.size);

  return placeMarketOrder(coin, side, size, true);
}

/**
 * Set leverage for a coin
 */
export async function setLeverage(coin: string, leverage: number): Promise<boolean> {
  if (!wallet || !walletAddress) return false;

  try {
    const nonce = Date.now();
    const action = {
      type: "updateLeverage",
      asset: getAssetIndex(coin),
      isCross: true,
      leverage,
    };

    const signature = await signL1Action(action, nonce);

    const response = await apiRequest("/exchange", "POST", {
      action,
      nonce,
      signature,
      vaultAddress: null,
    });

    return response.status === "ok";
  } catch (error) {
    console.error(`[Hyperliquid] Set leverage failed:`, error);
    return false;
  }
}

/**
 * Get asset index for a coin (used in API calls)
 */
function getAssetIndex(coin: string): number {
  // Common coins mapping - this should be fetched from meta in production
  const assetMap: Record<string, number> = {
    "BTC": 0,
    "ETH": 1,
    "SOL": 2,
    "AVAX": 3,
    "ARB": 4,
    "DOGE": 5,
    "MATIC": 6,
    "LINK": 7,
    "OP": 8,
    "APT": 9,
    "INJ": 10,
    "SUI": 11,
    "BLUR": 12,
    "LDO": 13,
    "TIA": 14,
    "JTO": 15,
    "PYTH": 16,
    "WIF": 17,
    "JUP": 18,
    "STRK": 19,
  };

  return assetMap[coin] ?? 0;
}

/**
 * Disconnect and cleanup
 */
export function disconnect(): void {
  wallet = null;
  walletAddress = null;
  isConnected = false;
  lastError = null;
  console.log("[Hyperliquid] Disconnected");
}

/**
 * Switch between mainnet and testnet
 */
export function switchNetwork(useMainnet: boolean): void {
  IS_MAINNET = useMainnet;
  API_BASE = useMainnet ? MAINNET_API : TESTNET_API;
  console.log(`[Hyperliquid] Switched to ${useMainnet ? "MAINNET" : "TESTNET"}`);
}
