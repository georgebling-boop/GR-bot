/**
 * Hyperliquid Trading Engine
 * Integrates Hyperliquid exchange with the AI continuous learning system
 */

import {
  initializeHyperliquid,
  getConnectionStatus,
  getAllPrices,
  getAccountState,
  getOpenOrders,
  placeMarketOrder,
  placeStopLoss,
  placeTakeProfit,
  closePosition,
  setLeverage,
  type Position,
  type TradeResult,
} from "./hyperliquid";
import {
  learnFromTrade,
  getEntryConfidence,
  type MarketState,
  type IndicatorSnapshot,
} from "./continuousLearningAI";

// Trading configuration
interface TradingConfig {
  maxPositions: number;
  positionSizePercent: number;
  defaultLeverage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  tradingPairs: string[];
  minConfidence: number;
}

const DEFAULT_CONFIG: TradingConfig = {
  maxPositions: 5,
  positionSizePercent: 10, // 10% of account per position
  defaultLeverage: 5,
  stopLossPercent: 2, // 2% stop loss
  takeProfitPercent: 4, // 4% take profit
  tradingPairs: ["BTC", "ETH", "SOL", "AVAX", "ARB"],
  minConfidence: 0.65, // Minimum AI confidence to trade
};

let config = { ...DEFAULT_CONFIG };
let isRunning = false;
let tradingInterval: NodeJS.Timeout | null = null;

// Trade tracking
interface LiveTrade {
  id: string;
  coin: string;
  side: "long" | "short";
  entryPrice: number;
  size: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: Date;
  leverage: number;
}

const activeTrades: Map<string, LiveTrade> = new Map();
const tradeHistory: Array<{
  trade: LiveTrade;
  exitPrice: number;
  exitTime: Date;
  pnl: number;
  pnlPercent: number;
}> = [];

/**
 * Initialize the Hyperliquid trading engine
 */
export function initializeTradingEngine(
  privateKey: string,
  useMainnet: boolean = false,
  customConfig?: Partial<TradingConfig>
): boolean {
  // Initialize Hyperliquid connection
  const connected = initializeHyperliquid({ privateKey, useMainnet });
  
  if (!connected) {
    console.error("[HyperliquidEngine] Failed to connect to Hyperliquid");
    return false;
  }

  // Apply custom config
  if (customConfig) {
    config = { ...config, ...customConfig };
  }

  console.log("[HyperliquidEngine] Trading engine initialized");
  console.log(`[HyperliquidEngine] Config: ${JSON.stringify(config)}`);
  
  return true;
}

/**
 * Start automated trading
 */
export function startTrading(): void {
  if (isRunning) {
    console.log("[HyperliquidEngine] Already running");
    return;
  }

  const status = getConnectionStatus();
  if (!status.connected) {
    console.error("[HyperliquidEngine] Not connected to Hyperliquid");
    return;
  }

  isRunning = true;
  console.log("[HyperliquidEngine] Starting automated trading...");

  // Run trading cycle every 10 seconds
  tradingInterval = setInterval(async () => {
    try {
      await executeTradingCycle();
    } catch (error) {
      console.error("[HyperliquidEngine] Trading cycle error:", error);
    }
  }, 10000);

  // Run immediately
  executeTradingCycle();
}

/**
 * Stop automated trading
 */
export function stopTrading(): void {
  if (!isRunning) return;

  isRunning = false;
  if (tradingInterval) {
    clearInterval(tradingInterval);
    tradingInterval = null;
  }

  console.log("[HyperliquidEngine] Trading stopped");
}

/**
 * Execute a single trading cycle
 */
async function executeTradingCycle(): Promise<void> {
  if (!isRunning) return;

  try {
    // Get current prices
    const prices = await getAllPrices();
    if (Object.keys(prices).length === 0) {
      console.warn("[HyperliquidEngine] No prices available");
      return;
    }

    // Get account state
    const accountState = await getAccountState();
    if (!accountState) {
      console.warn("[HyperliquidEngine] Could not get account state");
      return;
    }

    // Update active trades from positions
    await syncPositions(accountState.assetPositions);

    // Check for exit signals on active trades
    await checkExitSignals(prices);

    // Look for new entry signals if we have room
    if (activeTrades.size < config.maxPositions) {
      await lookForEntries(prices, accountState.marginSummary.accountValue);
    }

    // Run AI learning cycle
    // Run learning cycle handled by main auto-start

  } catch (error) {
    console.error("[HyperliquidEngine] Cycle error:", error);
  }
}

/**
 * Sync active trades with actual positions
 */
async function syncPositions(positions: Position[]): Promise<void> {
  for (const position of positions) {
    if (position.size === 0) continue;

    const existingTrade = activeTrades.get(position.coin);
    if (!existingTrade) {
      // Position exists but we don't have a trade record - create one
      const trade: LiveTrade = {
        id: `${position.coin}-${Date.now()}`,
        coin: position.coin,
        side: position.size > 0 ? "long" : "short",
        entryPrice: position.entryPrice,
        size: Math.abs(position.size),
        stopLoss: position.size > 0 
          ? position.entryPrice * (1 - config.stopLossPercent / 100)
          : position.entryPrice * (1 + config.stopLossPercent / 100),
        takeProfit: position.size > 0
          ? position.entryPrice * (1 + config.takeProfitPercent / 100)
          : position.entryPrice * (1 - config.takeProfitPercent / 100),
        entryTime: new Date(),
        leverage: position.leverage,
      };
      activeTrades.set(position.coin, trade);
    }
  }

  // Remove trades for positions that no longer exist
  for (const [coin, trade] of Array.from(activeTrades.entries())) {
    const position = positions.find(p => p.coin === coin);
    if (!position || position.size === 0) {
      // Position closed - record in history
      const prices = await getAllPrices();
      const exitPrice = prices[coin] || trade.entryPrice;
      const pnl = trade.side === "long"
        ? (exitPrice - trade.entryPrice) * trade.size
        : (trade.entryPrice - exitPrice) * trade.size;
      const pnlPercent = (pnl / (trade.entryPrice * trade.size)) * 100;

      tradeHistory.push({
        trade,
        exitPrice,
        exitTime: new Date(),
        pnl,
        pnlPercent,
      });

      // Learn from this trade
      const exitTime = new Date();
      learnFromTrade({
        tradeId: trade.id,
        symbol: coin,
        strategy: "hyperliquid_ai",
        entryPrice: trade.entryPrice,
        exitPrice,
        profit: pnl,
        profitPercent: pnlPercent,
        duration: Date.now() - trade.entryTime.getTime(),
        isWin: pnl > 0,
        marketState: getMarketStateFromPrices(prices, coin),
        indicators: getIndicatorsFromPrices(prices, coin),
        entryTiming: { 
          hourOfDay: trade.entryTime.getHours(), 
          dayOfWeek: trade.entryTime.getDay(),
          priceVelocity: 0,
          timeSinceLastTrade: 0,
        },
        exitTiming: {
          hourOfDay: exitTime.getHours(),
          dayOfWeek: exitTime.getDay(),
          priceVelocity: 0,
          timeSinceLastTrade: 0,
        },
        timestamp: exitTime,
      });

      activeTrades.delete(coin);
    }
  }
}

/**
 * Check for exit signals on active trades
 */
async function checkExitSignals(prices: Record<string, number>): Promise<void> {
  for (const [coin, trade] of Array.from(activeTrades.entries())) {
    const currentPrice = prices[coin];
    if (!currentPrice) continue;

    let shouldExit = false;
    let exitReason = "";

    // Check stop loss
    if (trade.side === "long" && currentPrice <= trade.stopLoss) {
      shouldExit = true;
      exitReason = "stop_loss";
    } else if (trade.side === "short" && currentPrice >= trade.stopLoss) {
      shouldExit = true;
      exitReason = "stop_loss";
    }

    // Check take profit
    if (trade.side === "long" && currentPrice >= trade.takeProfit) {
      shouldExit = true;
      exitReason = "take_profit";
    } else if (trade.side === "short" && currentPrice <= trade.takeProfit) {
      shouldExit = true;
      exitReason = "take_profit";
    }

    // Get AI exit signal - if confidence is low, consider exiting
    const marketState = getMarketStateFromPrices(prices, coin);
    const indicators = getIndicatorsFromPrices(prices, coin);
    const aiSignal = getEntryConfidence(coin, "hyperliquid_ai", marketState, indicators);
    if (!aiSignal.shouldEnter && aiSignal.confidence < 30) {
      shouldExit = true;
      exitReason = "ai_low_confidence";
    }

    if (shouldExit) {
      console.log(`[HyperliquidEngine] Closing ${coin} position: ${exitReason}`);
      const result = await closePosition(coin);
      if (result.success) {
        console.log(`[HyperliquidEngine] Closed ${coin} at ${currentPrice}`);
      }
    }
  }
}

/**
 * Look for new entry signals
 */
async function lookForEntries(
  prices: Record<string, number>,
  accountValue: number
): Promise<void> {
  for (const coin of config.tradingPairs) {
    // Skip if we already have a position
    if (activeTrades.has(coin)) continue;

    const currentPrice = prices[coin];
    if (!currentPrice) continue;

    // Get AI signal
    const marketState = getMarketStateFromPrices(prices, coin);
    const indicators = getIndicatorsFromPrices(prices, coin);
    const signal = getEntryConfidence(coin, "hyperliquid_ai", marketState, indicators);
    
    // Only trade if confidence is high enough and AI recommends entry
    if (signal.confidence < config.minConfidence * 100) continue;
    if (!signal.shouldEnter) continue;

    // Determine direction based on market state
    const side = marketState.trend === "bullish" ? "buy" : "sell";

    // Calculate position size
    const positionValue = accountValue * (config.positionSizePercent / 100);
    const size = positionValue / currentPrice;

    // Set leverage
    await setLeverage(coin, config.defaultLeverage);
    console.log(`[HyperliquidEngine] Opening ${side} ${coin} - Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
    
    const result = await placeMarketOrder(coin, side, size);
    
    if (result.success) {
      const entryPrice = result.avgPrice || currentPrice;
      
      // Calculate stop loss and take profit
      const stopLoss = side === "buy"
        ? entryPrice * (1 - config.stopLossPercent / 100)
        : entryPrice * (1 + config.stopLossPercent / 100);
      
      const takeProfit = side === "buy"
        ? entryPrice * (1 + config.takeProfitPercent / 100)
        : entryPrice * (1 - config.takeProfitPercent / 100);

      // Place stop loss order
      await placeStopLoss(coin, side === "buy" ? "sell" : "buy", size, stopLoss);
      
      // Place take profit order
      await placeTakeProfit(coin, side === "buy" ? "sell" : "buy", size, takeProfit);

      // Track the trade
      const trade: LiveTrade = {
        id: `${coin}-${Date.now()}`,
        coin,
        side: side === "buy" ? "long" : "short",
        entryPrice,
        size: result.filledSize || size,
        stopLoss,
        takeProfit,
        entryTime: new Date(),
        leverage: config.defaultLeverage,
      };
      
      activeTrades.set(coin, trade);
      console.log(`[HyperliquidEngine] Opened ${side} ${coin} at ${entryPrice}`);
    }
  }
}

/**
 * Get current trading status
 */
export function getTradingStatus(): {
  isRunning: boolean;
  connected: boolean;
  network: string;
  activeTrades: number;
  totalTrades: number;
  config: TradingConfig;
} {
  const status = getConnectionStatus();
  return {
    isRunning,
    connected: status.connected,
    network: status.network,
    activeTrades: activeTrades.size,
    totalTrades: tradeHistory.length,
    config,
  };
}

/**
 * Get active trades
 */
export function getActiveTrades(): LiveTrade[] {
  return Array.from(activeTrades.values());
}

/**
 * Get trade history
 */
export function getTradeHistory(): typeof tradeHistory {
  return tradeHistory;
}

/**
 * Update trading configuration
 */
export function updateConfig(newConfig: Partial<TradingConfig>): void {
  config = { ...config, ...newConfig };
  console.log(`[HyperliquidEngine] Config updated: ${JSON.stringify(config)}`);
}

/**
 * Helper: Get market state from prices
 */
function getMarketStateFromPrices(prices: Record<string, number>, coin: string): MarketState {
  const price = prices[coin] || 0;
  // Simple market state estimation based on price
  // In production, this would use historical data and proper indicators
  return {
    trend: "sideways" as const,
    volatility: 50,
    momentum: 0,
    volume: "normal" as const,
    pricePosition: "neutral" as const,
  };
}

/**
 * Helper: Get indicators from prices
 */
function getIndicatorsFromPrices(prices: Record<string, number>, coin: string): IndicatorSnapshot {
  const price = prices[coin] || 0;
  // Simple indicator estimation
  // In production, this would calculate real indicators from historical data
  return {
    rsi: 50,
    macd: 0,
    macdSignal: 0,
    macdHistogram: 0,
    bollingerUpper: price * 1.02,
    bollingerLower: price * 0.98,
    bollingerMiddle: price,
    ema9: price,
    ema21: price,
    ema50: price,
    atr: price * 0.01,
    volumeRatio: 1,
  };
}

/**
 * Get trading statistics
 */
export function getTradingStats(): {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  avgPnlPercent: number;
  bestTrade: number;
  worstTrade: number;
} {
  const wins = tradeHistory.filter(t => t.pnl > 0);
  const losses = tradeHistory.filter(t => t.pnl <= 0);
  const totalPnl = tradeHistory.reduce((sum, t) => sum + t.pnl, 0);
  const avgPnlPercent = tradeHistory.length > 0
    ? tradeHistory.reduce((sum, t) => sum + t.pnlPercent, 0) / tradeHistory.length
    : 0;
  const pnls = tradeHistory.map(t => t.pnl);

  return {
    totalTrades: tradeHistory.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: tradeHistory.length > 0 ? (wins.length / tradeHistory.length) * 100 : 0,
    totalPnl,
    avgPnlPercent,
    bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
  };
}
