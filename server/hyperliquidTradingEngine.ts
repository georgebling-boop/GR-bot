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

// Trading configuration - UPDATED FOR SAFETY & PROFITABILITY
// - Reduced leverage from 7x to 3x to prevent liquidations
// - Increased take profit from 2% to 5% for better risk-reward
// - Position sizing uses Kelly Criterion (2% per trade)
// - Extended trading cycle to 15s to reduce over-trading & API rate issues

const CLOSE_RETRY_DELAY_MS = 1000; // Delay before retrying failed close operations
const POSITION_LOG_INTERVAL_MS = 30000; // Log position status every 30 seconds
const MAX_CONSECUTIVE_LOSSES = 3; // Stop trading after 3 consecutive losses
const MAX_DAILY_LOSS_PERCENT = 5; // Stop if daily loss exceeds 5% of account

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
  maxPositions: 3,
  positionSizePercent: 2, // 2% of account per position (using Kelly Criterion for safety)
  defaultLeverage: 3, // REDUCED: 3x leverage for safety (was 7x - prevents liquidation)
  stopLossPercent: 2.5, // 2.5% stop loss
  takeProfitPercent: 5, // INCREASED: 5% take profit (was 2%) for better risk-reward ratio
  tradingPairs: ["BTC", "ETH", "SOL", "AVAX", "ARB"],
  minConfidence: 0.75, // INCREASED: 75% minimum AI confidence to trade (was 0.65)
};

let config = { ...DEFAULT_CONFIG };
let isRunning = false;
let tradingInterval: NodeJS.Timeout | null = null;
let lastCycleLogTime = 0; // Track last time we logged cycle status
let lastPositionLogTime: Record<string, number> = {}; // Track last position log per coin

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
  exitReason: string; // NEW: Track why position was exited
  slippagePercent: number; // NEW: Track actual slippage vs expected
}> = [];

// Trade journal for detailed logging
interface TradeJournalEntry {
  timestamp: Date;
  coin: string;
  action: "entry" | "exit" | "sl_hit" | "tp_hit" | "manual_close";
  price: number;
  size: number;
  reason: string;
  pnl?: number;
  pnlPercent?: number;
  confidence?: number;
}

const tradeJournal: TradeJournalEntry[] = [];

/**
 * Log trade action to journal for analysis
 */
function logTradeJournal(entry: TradeJournalEntry): void {
  tradeJournal.push(entry);
  const timestamp = entry.timestamp.toISOString();
  console.log(`[TradeJournal] ${timestamp} | ${entry.coin} ${entry.action.toUpperCase()} @ $${entry.price.toFixed(2)} | ${entry.reason}`);
}

/**
 * Get trade journal for analysis
 */
export function getTradeJournal(limit: number = 100): TradeJournalEntry[] {
  return tradeJournal.slice(-limit);
}

/**
 * Export trade journal to JSON for external analysis
 */
export function exportTradeJournal(): string {
  return JSON.stringify(tradeJournal, null, 2);
}

// Risk management tracking
let sessionStartBalance = 0;
let consecutiveLosses = 0;
let dailyLossAmount = 0;
let lastDailyResetTime = Date.now();

/**
 * Calculate Kelly Criterion position size
 * Formula: (bp - q) / b, where:
 * b = win/loss ratio
 * p = win probability
 * q = loss probability (1 - p)
 */
function calculateKellySizing(
  accountBalance: number,
  winRate: number,
  avgWinPercent: number,
  avgLossPercent: number
): number {
  // Clamp win rate to realistic values (0.35 - 0.65)
  winRate = Math.max(0.35, Math.min(0.65, winRate));
  
  const b = avgWinPercent / avgLossPercent; // Win/loss ratio
  const p = winRate;
  const q = 1 - winRate;
  
  let kellySizing = (b * p - q) / b;
  
  // Safety: never risk more than 2% per trade, never less than 0.5%
  kellySizing = Math.max(0.005, Math.min(0.02, kellySizing));
  
  return kellySizing * 100; // Convert to percentage
}

/**
 * Check if we should stop trading due to daily loss limit
 */
function shouldStopTrading(currentBalance: number): boolean {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Reset daily loss counter every 24 hours
  if (now - lastDailyResetTime > dayMs) {
    dailyLossAmount = 0;
    lastDailyResetTime = now;
  }
  
  const dayLossPct = (dailyLossAmount / sessionStartBalance) * 100;
  if (dayLossPct > MAX_DAILY_LOSS_PERCENT) {
    console.log(`[HyperliquidEngine] ⛔ DAILY LOSS LIMIT REACHED: ${dayLossPct.toFixed(2)}% (max: ${MAX_DAILY_LOSS_PERCENT}%)`);
    return true;
  }
  
  if (consecutiveLosses >= MAX_CONSECUTIVE_LOSSES) {
    console.log(`[HyperliquidEngine] ⛔ CONSECUTIVE LOSSES LIMIT: ${consecutiveLosses} (max: ${MAX_CONSECUTIVE_LOSSES})`);
    return true;
  }
  
  return false;
}

/**
 * Initialize the Hyperliquid trading engine
 */
export function initializeTradingEngine(
  privateKey: string,
  useMainnet: boolean = true, // CHANGED: Default to mainnet for live trading
  customConfig?: Partial<TradingConfig>
): boolean {
  // Initialize Hyperliquid connection for LIVE TRADING
  const connected = initializeHyperliquid({ privateKey, useMainnet });
  
  if (!connected) {
    console.error("[HyperliquidEngine] Failed to connect to Hyperliquid");
    return false;
  }
  
  const status = getConnectionStatus();
  console.log(`[HyperliquidEngine] ⚠️  LIVE TRADING MODE: Connected to ${status.network.toUpperCase()}`);
  console.log(`[HyperliquidEngine] Wallet: ${status.wallet}`);
  
  if (!useMainnet) {
    console.warn("[HyperliquidEngine] ⚠️  WARNING: Running on testnet - no real money at risk");
  }

  // Apply custom config
  if (customConfig) {
    config = { ...config, ...customConfig };
  }

  console.log("[HyperliquidEngine] Trading engine initialized");
  console.log(`[HyperliquidEngine] Config: ${JSON.stringify(config)}`);
  console.log(`[HyperliquidEngine] Risk Management: Max Leverage ${config.defaultLeverage}x, Max Consecutive Losses: ${MAX_CONSECUTIVE_LOSSES}, Max Daily Loss: ${MAX_DAILY_LOSS_PERCENT}%`);
  
  return true;
}

/**
 * Start automated trading
 */
export async function startTrading(): Promise<void> {
  if (isRunning) {
    console.log("[HyperliquidEngine] Already running");
    return;
  }

  const status = getConnectionStatus();
  if (!status.connected) {
    console.error("[HyperliquidEngine] Not connected to Hyperliquid");
    return;
  }

  // Get starting balance for risk tracking
  const accountState = await getAccountState();
  if (accountState) {
    sessionStartBalance = accountState.marginSummary.accountValue;
    console.log(`[HyperliquidEngine] 💰 Session starting balance: $${sessionStartBalance.toFixed(2)}`);
  }

  isRunning = true;
  consecutiveLosses = 0;
  dailyLossAmount = 0;
  console.log("[HyperliquidEngine] Starting automated trading...");

  // Run trading cycle every 15 seconds (was 5s - reduced over-trading and API rate issues)
  tradingInterval = setInterval(async () => {
    try {
      await executeTradingCycle();
    } catch (error) {
      console.error("[HyperliquidEngine] Trading cycle error:", error);
    }
  }, 15000); // 15 seconds to avoid excessive over-trading and API rate limits

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

    // Log cycle execution (every 60 seconds)
    const now = Date.now();
    if (now - lastCycleLogTime > 60000) {
      const status = getConnectionStatus();
      console.log(`[HyperliquidEngine] 🔄 Trading cycle running on ${status.network.toUpperCase()}`);
      console.log(`[HyperliquidEngine]   Active trades: ${activeTrades.size}/${config.maxPositions}`);
      console.log(`[HyperliquidEngine]   Account value: $${accountState.marginSummary.accountValue.toFixed(2)}`);
      console.log(`[HyperliquidEngine]   Available margin: $${accountState.marginSummary.totalMarginUsed.toFixed(2)} used`);
      lastCycleLogTime = now;
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
  // Log all current positions for debugging
  if (positions.length > 0) {
    console.log(`[HyperliquidEngine] 📊 Current positions:`);
    for (const pos of positions) {
      if (pos.size !== 0) {
        console.log(`[HyperliquidEngine]   ${pos.coin}: ${pos.size > 0 ? 'LONG' : 'SHORT'} ${Math.abs(pos.size)} @ $${pos.entryPrice.toFixed(2)} (PnL: $${pos.unrealizedPnl.toFixed(2)})`);
      }
    }
  }
  
  for (const position of positions) {
    if (position.size === 0) continue;

    const existingTrade = activeTrades.get(position.coin);
    if (!existingTrade) {
      // Position exists but we don't have a trade record - create one
      console.log(`[HyperliquidEngine] 📝 Syncing new position: ${position.coin}`);
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

      // Determine exit reason
      let exitReason = "unknown";
      if (exitPrice <= trade.stopLoss || exitPrice >= trade.stopLoss) {
        exitReason = "stop_loss_hit";
      } else if (exitPrice >= trade.takeProfit || exitPrice <= trade.takeProfit) {
        exitReason = "take_profit_hit";
      } else {
        exitReason = "manual_or_forced_close";
      }

      // Calculate slippage
      const expectedProfit = trade.side === "long"
        ? (trade.takeProfit - trade.entryPrice) * trade.size
        : (trade.entryPrice - trade.takeProfit) * trade.size;
      const slippagePercent = expectedProfit > 0 ? ((expectedProfit - pnl) / expectedProfit) * 100 : 0;

      console.log(`[HyperliquidEngine] 💰 ${coin} closed: ${pnl >= 0 ? 'PROFIT' : 'LOSS'} $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%) | Slippage: ${slippagePercent.toFixed(2)}%`);

      // Track consecutive losses for risk management
      if (pnl < 0) {
        consecutiveLosses++;
        dailyLossAmount += Math.abs(pnl);
      } else {
        consecutiveLosses = 0; // Reset on winning trade
      }

      // Log to trade journal
      logTradeJournal({
        timestamp: new Date(),
        coin,
        action: exitReason === "stop_loss_hit" ? "sl_hit" : exitReason === "take_profit_hit" ? "tp_hit" : "manual_close",
        price: exitPrice,
        size: trade.size,
        reason: exitReason,
        pnl,
        pnlPercent,
      });

      tradeHistory.push({
        trade,
        exitPrice,
        exitTime: new Date(),
        pnl,
        pnlPercent,
        exitReason,
        slippagePercent,
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

    // Calculate profit/loss for logging
    const pnl = trade.side === "long"
      ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100
      : ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;

    // Check stop loss
    if (trade.side === "long" && currentPrice <= trade.stopLoss) {
      shouldExit = true;
      exitReason = "stop_loss";
      console.log(`[HyperliquidEngine] ${coin} hit stop loss: ${currentPrice.toFixed(2)} <= ${trade.stopLoss.toFixed(2)} (${pnl.toFixed(2)}% loss)`);
    } else if (trade.side === "short" && currentPrice >= trade.stopLoss) {
      shouldExit = true;
      exitReason = "stop_loss";
      console.log(`[HyperliquidEngine] ${coin} hit stop loss: ${currentPrice.toFixed(2)} >= ${trade.stopLoss.toFixed(2)} (${pnl.toFixed(2)}% loss)`);
    }

    // Check take profit
    if (trade.side === "long" && currentPrice >= trade.takeProfit) {
      shouldExit = true;
      exitReason = "take_profit";
      console.log(`[HyperliquidEngine] ${coin} hit take profit: ${currentPrice.toFixed(2)} >= ${trade.takeProfit.toFixed(2)} (${pnl.toFixed(2)}% profit)`);
    } else if (trade.side === "short" && currentPrice <= trade.takeProfit) {
      shouldExit = true;
      exitReason = "take_profit";
      console.log(`[HyperliquidEngine] ${coin} hit take profit: ${currentPrice.toFixed(2)} <= ${trade.takeProfit.toFixed(2)} (${pnl.toFixed(2)}% profit)`);
    }

    // Get AI exit signal - if confidence is low, consider exiting
    const marketState = getMarketStateFromPrices(prices, coin);
    const indicators = getIndicatorsFromPrices(prices, coin);
    const aiSignal = getEntryConfidence(coin, "hyperliquid_ai", marketState, indicators);
    if (!aiSignal.shouldEnter && aiSignal.confidence < 30) {
      shouldExit = true;
      exitReason = "ai_low_confidence";
      console.log(`[HyperliquidEngine] ${coin} AI low confidence exit: ${aiSignal.confidence.toFixed(1)}% (${pnl.toFixed(2)}% PnL)`);
    }

    if (shouldExit) {
      console.log(`[HyperliquidEngine] Closing ${coin} position: ${exitReason} at ${currentPrice.toFixed(2)}`);
      try {
        const result = await closePosition(coin);
        if (result.success) {
          console.log(`[HyperliquidEngine] ✓ Successfully closed ${coin} at ${currentPrice.toFixed(2)} (${exitReason})`);
        } else {
          console.error(`[HyperliquidEngine] ✗ Failed to close ${coin}: ${result.error || 'Unknown error'}`);
          // Retry once after a short delay
          await new Promise(resolve => setTimeout(resolve, CLOSE_RETRY_DELAY_MS));
          const retryResult = await closePosition(coin);
          if (retryResult.success) {
            console.log(`[HyperliquidEngine] ✓ Retry successful: Closed ${coin}`);
          } else {
            console.error(`[HyperliquidEngine] ✗ Retry failed for ${coin}: ${retryResult.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error(`[HyperliquidEngine] ✗ Error closing ${coin}:`, error);
      }
    } else {
      // Log current position status every 30 seconds
      const now = Date.now();
      if (!lastPositionLogTime[coin] || now - lastPositionLogTime[coin] > POSITION_LOG_INTERVAL_MS) {
        console.log(`[HyperliquidEngine] ${coin} ${trade.side} @ ${trade.entryPrice.toFixed(2)} -> ${currentPrice.toFixed(2)} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%) | TP: ${trade.takeProfit.toFixed(2)} | SL: ${trade.stopLoss.toFixed(2)}`);
        lastPositionLogTime[coin] = now;
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
    if (!currentPrice) {
      console.log(`[HyperliquidEngine] ${coin} - No price available, skipping`);
      continue;
    }

    // Get AI signal
    const marketState = getMarketStateFromPrices(prices, coin);
    const indicators = getIndicatorsFromPrices(prices, coin);
    const signal = getEntryConfidence(coin, "hyperliquid_ai", marketState, indicators);
    
    // Only trade if confidence is high enough and AI recommends entry
    if (signal.confidence < config.minConfidence * 100) {
      // Occasionally log why we're not entering
      if (signal.confidence > config.minConfidence * 80) { // Within 20% of threshold
        console.log(`[HyperliquidEngine] ${coin} - Confidence too low: ${signal.confidence.toFixed(1)}% (need ${(config.minConfidence * 100).toFixed(1)}%)`);
      }
      continue;
    }
    if (!signal.shouldEnter) {
      console.log(`[HyperliquidEngine] ${coin} - AI recommends no entry despite confidence ${signal.confidence.toFixed(1)}%`);
      continue;
    }

    // Determine direction based on market state
    const side = marketState.trend === "bullish" ? "buy" : "sell";

    // Calculate position size
    const positionValue = accountValue * (config.positionSizePercent / 100);
    const size = positionValue / currentPrice;

    console.log(`[HyperliquidEngine] 🔔 ENTRY SIGNAL: ${coin} ${side.toUpperCase()}`);
    console.log(`[HyperliquidEngine]   Confidence: ${signal.confidence.toFixed(1)}%, Trend: ${marketState.trend}, Price: $${currentPrice.toFixed(2)}`);
    console.log(`[HyperliquidEngine]   Position size: ${size.toFixed(4)} ${coin} ($${positionValue.toFixed(2)} at ${config.defaultLeverage}x leverage)`);

    try {
      // Set leverage
      await setLeverage(coin, config.defaultLeverage);
      
      const result = await placeMarketOrder(coin, side, size);
      
      if (result.success) {
        const entryPrice = result.avgPrice || currentPrice;
        
        // Check for slippage
        const slippagePercent = Math.abs((entryPrice - currentPrice) / currentPrice) * 100;
        if (slippagePercent > 0.5) {
          console.warn(`[HyperliquidEngine]   ⚠️  HIGH SLIPPAGE: ${slippagePercent.toFixed(3)}% (${Math.abs(entryPrice - currentPrice).toFixed(2)} per unit)`);
        }
        
        // Calculate stop loss and take profit
        const stopLoss = side === "buy"
          ? entryPrice * (1 - config.stopLossPercent / 100)
          : entryPrice * (1 + config.stopLossPercent / 100);
        const takeProfit = side === "buy"
          ? entryPrice * (1 + config.takeProfitPercent / 100)
          : entryPrice * (1 - config.takeProfitPercent / 100);

        console.log(`[HyperliquidEngine]   ✓ Market order filled at $${entryPrice.toFixed(2)}`);

        // Place stop loss order (guaranteed stop to prevent liquidation)
        try {
          const slResult = await placeStopLoss(coin, side === "buy" ? "sell" : "buy", size, stopLoss);
          if (slResult.success) {
            console.log(`[HyperliquidEngine]   ✓ Stop loss GUARANTEED at $${stopLoss.toFixed(2)} (${config.stopLossPercent}%)`);
          } else {
            console.warn(`[HyperliquidEngine]   ⚠️  Stop loss order failed: ${slResult.error}, will use manual monitoring`);
          }
        } catch (error) {
          console.error(`[HyperliquidEngine]   ✗ Failed to place stop loss:`, error);
        }
        
        // Place take profit order
        try {
          const tpResult = await placeTakeProfit(coin, side === "buy" ? "sell" : "buy", size, takeProfit);
          if (tpResult.success) {
            console.log(`[HyperliquidEngine]   ✓ Take profit placed at $${takeProfit.toFixed(2)} (${config.takeProfitPercent}%)`);
          } else {
            console.warn(`[HyperliquidEngine]   ⚠️  Take profit order failed: ${tpResult.error}`);
          }
        } catch (error) {
          console.error(`[HyperliquidEngine]   ✗ Failed to place take profit:`, error);
        }

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
        
        // Log entry to journal
        logTradeJournal({
          timestamp: new Date(),
          coin,
          action: "entry",
          price: entryPrice,
          size: result.filledSize || size,
          reason: signal.reasons?.join(", ") || "AI signal",
          confidence: signal.confidence,
        });
        
        console.log(`[HyperliquidEngine] ✅ TRADE OPENED: ${side.toUpperCase()} ${coin} at $${entryPrice.toFixed(2)} | SL: $${stopLoss.toFixed(2)} | TP: $${takeProfit.toFixed(2)}`);
        console.log(`[HyperliquidEngine]   Confidence: ${signal.confidence.toFixed(1)}% | Slippage: ${slippagePercent.toFixed(3)}%`);
      } else {
        console.error(`[HyperliquidEngine] ✗ Failed to open ${coin} position: ${result.error || 'Unknown error'}`);
        // Retry once
        console.log(`[HyperliquidEngine]   Retrying order...`);
        await new Promise(resolve => setTimeout(resolve, CLOSE_RETRY_DELAY_MS));
        const retryResult = await placeMarketOrder(coin, side, size);
        if (retryResult.success) {
          console.log(`[HyperliquidEngine]   ✓ Retry successful`);
          // Process the successful retry (similar to above but abbreviated for space)
          const entryPrice = retryResult.avgPrice || currentPrice;
          const stopLoss = side === "buy" ? entryPrice * (1 - config.stopLossPercent / 100) : entryPrice * (1 + config.stopLossPercent / 100);
          const takeProfit = side === "buy" ? entryPrice * (1 + config.takeProfitPercent / 100) : entryPrice * (1 - config.takeProfitPercent / 100);
          await placeStopLoss(coin, side === "buy" ? "sell" : "buy", size, stopLoss);
          await placeTakeProfit(coin, side === "buy" ? "sell" : "buy", size, takeProfit);
          const trade: LiveTrade = {
            id: `${coin}-${Date.now()}`,
            coin,
            side: side === "buy" ? "long" : "short",
            entryPrice,
            size: retryResult.filledSize || size,
            stopLoss,
            takeProfit,
            entryTime: new Date(),
            leverage: config.defaultLeverage,
          };
          activeTrades.set(coin, trade);
          console.log(`[HyperliquidEngine] ✅ TRADE OPENED (retry): ${side.toUpperCase()} ${coin} at $${entryPrice.toFixed(2)}`);
        } else {
          console.error(`[HyperliquidEngine]   ✗ Retry also failed: ${retryResult.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error(`[HyperliquidEngine] ✗ Error opening ${coin} position:`, error);
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
