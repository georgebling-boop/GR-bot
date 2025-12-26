/**
 * Aggressive Scalping Trading System
 * $800 starting balance with buy-low-sell-high strategy
 * Many small trades for consistent profits
 * Integrated with Continuous Learning AI
 */

import {
  learnFromTrade,
  getOptimizedParameters,
  getStrategyWeights,
  getBestStrategyForSymbol,
  isGoodTradingTime,
  getEntryConfidence,
  type TradeLesson,
  type MarketState,
  type IndicatorSnapshot,
} from "./continuousLearningAI";
import { 
  getAllPrices as getHyperliquidPrices, 
  getConnectionStatus,
  placeMarketOrder as hlPlaceMarketOrder,
  getAccountState as hlGetAccountState,
  closePosition as hlClosePosition,
  type TradeResult
} from "./hyperliquid";

export interface ScalpingTrade {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stake: number;
  profit: number;
  profitPercent: number;
  status: "OPEN" | "CLOSED" | "PENDING";
  strategy: string;
  openedAt: string;
  closedAt: string | null;
  stopLoss: number;
  takeProfit: number;
}

export interface ScalpingSession {
  id: string;
  startingBalance: number;
  currentBalance: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  openTrades: ScalpingTrade[];
  closedTrades: ScalpingTrade[];
  isRunning: boolean;
  startedAt: string;
  lastUpdated: string;
  strategyStats: StrategyStats[];
}

export interface StrategyStats {
  name: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  avgProfit: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
}

// Base prices (used as fallback when Hyperliquid is not connected)
const CRYPTO_BASE_PRICES: Record<string, number> = {
  BTC: 43250,
  ETH: 2280,
  ADA: 0.62,
  SOL: 98.5,
  XRP: 0.62,
  DOGE: 0.082,
};

// Symbol mapping from our symbols to Hyperliquid symbols
const HYPERLIQUID_SYMBOL_MAP: Record<string, string> = {
  BTC: "BTC",
  ETH: "ETH",
  SOL: "SOL",
  DOGE: "DOGE",
  XRP: "XRP",
  ADA: "ADA",
};

// Cache for Hyperliquid prices
let hyperliquidPriceCache: Record<string, number> = {};
let lastHyperliquidFetch = 0;
const PRICE_CACHE_TTL = 2000; // 2 seconds

/**
 * Fetch prices from Hyperliquid and update cache
 */
async function updateHyperliquidPrices(): Promise<void> {
  const now = Date.now();
  if (now - lastHyperliquidFetch < PRICE_CACHE_TTL) {
    return; // Use cached prices
  }
  
  try {
    const status = getConnectionStatus();
    if (!status.connected) {
      return;
    }
    
    const prices = await getHyperliquidPrices();
    if (Object.keys(prices).length > 0) {
      hyperliquidPriceCache = prices;
      lastHyperliquidFetch = now;
      console.log("[Scalper] Updated prices from Hyperliquid");
    }
  } catch (error) {
    console.error("[Scalper] Failed to fetch Hyperliquid prices:", error);
  }
}

/**
 * Get real price from Hyperliquid or fallback to simulated
 */
function getRealPrice(symbol: string): number {
  const hlSymbol = HYPERLIQUID_SYMBOL_MAP[symbol];
  if (hlSymbol && hyperliquidPriceCache[hlSymbol]) {
    return hyperliquidPriceCache[hlSymbol];
  }
  return CRYPTO_BASE_PRICES[symbol] || 100;
}

// Session state
let session: ScalpingSession | null = null;
let tradeIdCounter = 1;
let priceHistory: Record<string, number[]> = {};

/**
 * Initialize price history for trend analysis
 */
function initializePriceHistory(): void {
  Object.keys(CRYPTO_BASE_PRICES).forEach(symbol => {
    priceHistory[symbol] = [];
    const basePrice = CRYPTO_BASE_PRICES[symbol];
    // Generate 100 historical prices
    for (let i = 0; i < 100; i++) {
      const variation = (Math.random() - 0.5) * 0.02 * basePrice;
      priceHistory[symbol].push(basePrice + variation);
    }
  });
}

/**
 * Get live price - uses Hyperliquid real prices when connected, otherwise simulated
 */
export function getLivePrice(symbol: string): PriceData {
  // Try to get real price from Hyperliquid
  const realPrice = getRealPrice(symbol);
  const basePrice = CRYPTO_BASE_PRICES[symbol] || 100;
  
  // Use real price if available, otherwise use base price
  const currentPrice = realPrice !== basePrice ? realPrice : basePrice;
  
  // Add price to history
  if (!priceHistory[symbol]) {
    priceHistory[symbol] = [currentPrice];
  }
  
  // If we have a real price, use it directly
  const status = getConnectionStatus();
  let newPrice: number;
  
  if (status.connected && hyperliquidPriceCache[HYPERLIQUID_SYMBOL_MAP[symbol]]) {
    // Use real Hyperliquid price
    newPrice = realPrice;
  } else {
    // Fallback to simulated movement
    const lastPrice = priceHistory[symbol][priceHistory[symbol].length - 1] || basePrice;
    const volatility = 0.003;
    const trend = Math.random() > 0.5 ? 1 : -1;
    const change = lastPrice * volatility * trend * (0.5 + Math.random());
    newPrice = Math.max(lastPrice * 0.95, Math.min(lastPrice * 1.05, lastPrice + change));
  }
  
  // Keep last 100 prices
  priceHistory[symbol].push(newPrice);
  if (priceHistory[symbol].length > 100) {
    priceHistory[symbol].shift();
  }
  
  const prices = priceHistory[symbol];
  const high24h = Math.max(...prices.slice(-24));
  const low24h = Math.min(...prices.slice(-24));
  const firstPrice = prices[0] || newPrice;
  const change24h = firstPrice > 0 ? ((newPrice - firstPrice) / firstPrice) * 100 : 0;
  
  return {
    symbol,
    price: newPrice,
    change24h,
    high24h,
    low24h,
    volume: basePrice * 1000000 * (0.8 + Math.random() * 0.4),
  };
}

/**
 * Calculate RSI indicator
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number } {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (stdDev * 2),
    middle: sma,
    lower: sma - (stdDev * 2),
  };
}

/**
 * Aggressive Scalping Strategy - Buy Low, Sell High
 */
function analyzeScalpingOpportunity(symbol: string): { 
  action: "BUY" | "SELL" | "HOLD"; 
  confidence: number; 
  strategy: string;
  reason: string;
} {
  const prices = priceHistory[symbol] || [];
  if (prices.length < 20) {
    return { action: "HOLD", confidence: 0, strategy: "insufficient_data", reason: "Not enough price data" };
  }
  
  const currentPrice = prices[prices.length - 1];
  const rsi = calculateRSI(prices);
  const sma5 = calculateSMA(prices, 5);
  const sma20 = calculateSMA(prices, 20);
  const bb = calculateBollingerBands(prices);
  
  let action: "BUY" | "SELL" | "HOLD" = "HOLD";
  let confidence = 0;
  let strategy = "";
  let reason = "";
  
  // Strategy 1: RSI Oversold/Overbought (Scalping)
  if (rsi < 30) {
    action = "BUY";
    confidence = Math.min(90, 60 + (30 - rsi));
    strategy = "rsi_oversold";
    reason = `RSI at ${rsi.toFixed(1)} - Oversold, expecting bounce`;
  } else if (rsi > 70) {
    action = "SELL";
    confidence = Math.min(90, 60 + (rsi - 70));
    strategy = "rsi_overbought";
    reason = `RSI at ${rsi.toFixed(1)} - Overbought, expecting pullback`;
  }
  
  // Strategy 2: Bollinger Band Bounce
  if (currentPrice <= bb.lower * 1.01 && action !== "SELL") {
    action = "BUY";
    confidence = Math.max(confidence, 75);
    strategy = "bb_lower_bounce";
    reason = `Price near lower Bollinger Band - Buy the dip`;
  } else if (currentPrice >= bb.upper * 0.99 && action !== "BUY") {
    action = "SELL";
    confidence = Math.max(confidence, 75);
    strategy = "bb_upper_touch";
    reason = `Price near upper Bollinger Band - Take profit`;
  }
  
  // Strategy 3: Quick Momentum (SMA Crossover)
  if (sma5 > sma20 * 1.005 && currentPrice > sma5 && action !== "SELL") {
    action = "BUY";
    confidence = Math.max(confidence, 65);
    strategy = "momentum_up";
    reason = `Bullish momentum - SMA5 above SMA20`;
  } else if (sma5 < sma20 * 0.995 && currentPrice < sma5 && action !== "BUY") {
    action = "SELL";
    confidence = Math.max(confidence, 65);
    strategy = "momentum_down";
    reason = `Bearish momentum - SMA5 below SMA20`;
  }
  
  // Strategy 4: Dip Buying (Price significantly below recent high)
  const recentHigh = Math.max(...prices.slice(-10));
  const recentLow = Math.min(...prices.slice(-10));
  const priceRange = recentHigh - recentLow;
  
  if (currentPrice < recentLow + priceRange * 0.2 && action !== "SELL") {
    action = "BUY";
    confidence = Math.max(confidence, 70);
    strategy = "dip_buy";
    reason = `Price near recent low - Buy the dip`;
  } else if (currentPrice > recentHigh - priceRange * 0.2 && action !== "BUY") {
    action = "SELL";
    confidence = Math.max(confidence, 70);
    strategy = "peak_sell";
    reason = `Price near recent high - Take profit`;
  }
  
  return { action, confidence, strategy, reason };
}

/**
 * Initialize trading session with $800
 */
export function initializeSession(startingBalance: number = 800): ScalpingSession {
  initializePriceHistory();
  
  session = {
    id: `session_${Date.now()}`,
    startingBalance,
    currentBalance: startingBalance,
    totalProfit: 0,
    totalProfitPercent: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    openTrades: [],
    closedTrades: [],
    isRunning: false,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    strategyStats: [],
  };
  
  tradeIdCounter = 1;
  return session;
}

/**
 * Get current session
 */
export function getSession(): ScalpingSession | null {
  return session;
}

/**
 * Start automated trading
 */
export function startTrading(): ScalpingSession | null {
  if (!session) {
    session = initializeSession(800);
  }
  session.isRunning = true;
  session.lastUpdated = new Date().toISOString();
  return session;
}

/**
 * Stop automated trading
 */
export function stopTrading(): ScalpingSession | null {
  if (session) {
    session.isRunning = false;
    session.lastUpdated = new Date().toISOString();
  }
  return session;
}

/**
 * Learn from a closed trade - sends data to Continuous Learning AI
 */
function learnFromClosedTrade(trade: ScalpingTrade, priceData: PriceData): void {
  const prices = priceHistory[trade.symbol] || [];
  const rsi = calculateRSI(prices);
  const sma5 = calculateSMA(prices, 5);
  const sma20 = calculateSMA(prices, 20);
  const bb = calculateBollingerBands(prices);
  
  // Determine market state
  const trend = sma5 > sma20 ? "bullish" : sma5 < sma20 ? "bearish" : "sideways";
  const volatility = Math.abs(priceData.change24h) * 10; // Scale to 0-100
  
  const marketState: MarketState = {
    trend: trend as "bullish" | "bearish" | "sideways",
    volatility: Math.min(100, Math.max(0, volatility)),
    momentum: priceData.change24h,
    volume: priceData.volume > 1000000000 ? "high" : priceData.volume < 500000000 ? "low" : "normal",
    pricePosition: rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral",
  };
  
  const indicators: IndicatorSnapshot = {
    rsi,
    macd: sma5 - sma20,
    macdSignal: calculateSMA(prices, 9) - calculateSMA(prices, 26),
    macdHistogram: (sma5 - sma20) - (calculateSMA(prices, 9) - calculateSMA(prices, 26)),
    bollingerUpper: bb.upper,
    bollingerLower: bb.lower,
    bollingerMiddle: bb.middle,
    ema9: calculateSMA(prices, 9),
    ema21: calculateSMA(prices, 21),
    ema50: calculateSMA(prices, 50),
    atr: (priceData.high24h - priceData.low24h) / priceData.price * 100,
    volumeRatio: 1,
  };
  
  const now = new Date();
  const openedAt = new Date(trade.openedAt);
  const duration = (now.getTime() - openedAt.getTime()) / 1000 / 60; // Duration in minutes
  
  const lesson: TradeLesson = {
    tradeId: `trade_${trade.id}`,
    symbol: trade.symbol,
    strategy: trade.strategy,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice || priceData.price,
    profit: trade.profit,
    profitPercent: trade.profitPercent,
    duration,
    isWin: trade.profit > 0,
    marketState,
    indicators,
    entryTiming: {
      hourOfDay: openedAt.getHours(),
      dayOfWeek: openedAt.getDay(),
      priceVelocity: 0,
      timeSinceLastTrade: 0,
    },
    exitTiming: {
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      priceVelocity: trade.profitPercent,
      timeSinceLastTrade: duration,
    },
    timestamp: now,
  };
  
  // Send to continuous learning AI
  learnFromTrade(lesson);
}

/**
 * Execute a single trading cycle
 */
export async function executeTradingCycle(): Promise<{ 
  session: ScalpingSession; 
  actions: string[];
  newTrades: ScalpingTrade[];
  closedTrades: ScalpingTrade[];
}> {
  if (!session) {
    session = initializeSession(800);
  }
  
  const actions: string[] = [];
  const newTrades: ScalpingTrade[] = [];
  const closedTradesThisCycle: ScalpingTrade[] = [];
  
  const symbols = Object.keys(CRYPTO_BASE_PRICES);
  
  // Update prices and check open trades
  session.openTrades.forEach(trade => {
    const priceData = getLivePrice(trade.symbol);
    const currentPrice = priceData.price;
    
    // Check stop loss
    if (currentPrice <= trade.stopLoss) {
      const profit = (currentPrice - trade.entryPrice) * trade.quantity;
      trade.exitPrice = currentPrice;
      trade.profit = profit;
      trade.profitPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
      trade.status = "CLOSED";
      trade.closedAt = new Date().toISOString();
      
      session!.currentBalance += trade.stake + profit;
      session!.totalProfit += profit;
      session!.losingTrades++;
      
      closedTradesThisCycle.push(trade);
      actions.push(`STOP LOSS: ${trade.symbol} @ $${currentPrice.toFixed(4)} (${trade.profitPercent.toFixed(2)}%)`);
      
      // LEARN FROM THIS TRADE - Continuous Learning AI
      learnFromClosedTrade(trade, priceData);
    }
    // Check take profit
    else if (currentPrice >= trade.takeProfit) {
      const profit = (currentPrice - trade.entryPrice) * trade.quantity;
      trade.exitPrice = currentPrice;
      trade.profit = profit;
      trade.profitPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
      trade.status = "CLOSED";
      trade.closedAt = new Date().toISOString();
      
      session!.currentBalance += trade.stake + profit;
      session!.totalProfit += profit;
      session!.winningTrades++;
      
      closedTradesThisCycle.push(trade);
      actions.push(`TAKE PROFIT: ${trade.symbol} @ $${currentPrice.toFixed(4)} (+${trade.profitPercent.toFixed(2)}%)`);
      
      // LEARN FROM THIS TRADE - Continuous Learning AI
      learnFromClosedTrade(trade, priceData);
    }
  });
  
  // Remove closed trades from open trades
  session.openTrades = session.openTrades.filter(t => t.status === "OPEN");
  session.closedTrades.push(...closedTradesThisCycle);
  
  // Look for new trading opportunities
  if (session.isRunning && session.openTrades.length < 3) { // Max 3 concurrent trades (low risk)
    for (const symbol of symbols) {
      if (session.openTrades.some(t => t.symbol === symbol)) continue; // Skip if already have position
      
      const analysis = analyzeScalpingOpportunity(symbol);
      
      if (analysis.action === "BUY" && analysis.confidence >= 75) { // Higher confidence = safer trades
        const priceData = getLivePrice(symbol);
        const currentPrice = priceData.price;
        
        // Stake 1-2% of balance per trade for LOW RISK trading
        const stakePercent = 0.01 + (analysis.confidence / 100) * 0.01; // 1-2% per trade
        const stake = Math.min(session.currentBalance * stakePercent, session.currentBalance * 0.03); // Max 3%
        
        if (stake >= 5 && session.currentBalance >= stake) { // Minimum $5 trade
          const quantity = stake / currentPrice;
          const stopLoss = currentPrice * 0.99; // 1% stop loss (tighter)
          const takeProfit = currentPrice * 1.01; // 1% take profit (smaller but safer)
          
          // Try to place real order on Hyperliquid if connected
          const hlStatus = getConnectionStatus();
          let realOrderPlaced = false;
          let actualEntryPrice = currentPrice;
          let actualQuantity = quantity;
          
          if (hlStatus.connected) {
            try {
              // Calculate size for Hyperliquid (in contracts)
              const hlSize = Number((stake / currentPrice).toFixed(6));
              console.log(`[Scalper] Placing REAL order on Hyperliquid: BUY ${hlSize} ${symbol}`);
              
              const result = await hlPlaceMarketOrder(symbol, "buy", hlSize, false);
              
              if (result.success && result.filledSize && result.avgPrice) {
                realOrderPlaced = true;
                actualEntryPrice = result.avgPrice;
                actualQuantity = result.filledSize;
                console.log(`[Scalper] REAL order filled: ${actualQuantity} ${symbol} @ $${actualEntryPrice}`);
              } else {
                console.log(`[Scalper] Real order failed: ${result.error}, using paper trade`);
              }
            } catch (err) {
              console.error(`[Scalper] Hyperliquid order error:`, err);
            }
          }
          
          const trade: ScalpingTrade = {
            id: tradeIdCounter++,
            symbol,
            side: "BUY",
            entryPrice: actualEntryPrice,
            exitPrice: null,
            quantity: actualQuantity,
            stake,
            profit: 0,
            profitPercent: 0,
            status: "OPEN",
            strategy: analysis.strategy,
            openedAt: new Date().toISOString(),
            closedAt: null,
            stopLoss,
            takeProfit,
          };
          
          session.currentBalance -= stake;
          session.openTrades.push(trade);
          session.totalTrades++;
          newTrades.push(trade);
          
          const orderType = realOrderPlaced ? "REAL" : "PAPER";
          actions.push(`[${orderType}] BUY: ${symbol} @ $${actualEntryPrice.toFixed(4)} | Stake: $${stake.toFixed(2)} | ${analysis.reason}`);
        }
      }
    }
  }
  
  // Update session stats
  const totalClosed = session.winningTrades + session.losingTrades;
  session.winRate = totalClosed > 0 ? (session.winningTrades / totalClosed) * 100 : 0;
  session.totalProfitPercent = (session.totalProfit / session.startingBalance) * 100;
  session.lastUpdated = new Date().toISOString();
  
  // Update strategy stats
  updateStrategyStats();
  
  return {
    session,
    actions,
    newTrades,
    closedTrades: closedTradesThisCycle,
  };
}

/**
 * Update strategy performance statistics
 */
function updateStrategyStats(): void {
  if (!session) return;
  
  const statsMap: Record<string, StrategyStats> = {};
  
  session.closedTrades.forEach(trade => {
    if (!statsMap[trade.strategy]) {
      statsMap[trade.strategy] = {
        name: trade.strategy,
        trades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalProfit: 0,
        avgProfit: 0,
      };
    }
    
    const stats = statsMap[trade.strategy];
    stats.trades++;
    stats.totalProfit += trade.profit;
    
    if (trade.profit > 0) {
      stats.wins++;
    } else {
      stats.losses++;
    }
    
    stats.winRate = (stats.wins / stats.trades) * 100;
    stats.avgProfit = stats.totalProfit / stats.trades;
  });
  
  session.strategyStats = Object.values(statsMap).sort((a, b) => b.winRate - a.winRate);
}

/**
 * Reset session
 */
export function resetSession(): ScalpingSession {
  return initializeSession(800);
}

/**
 * Get all live prices - fetches from Hyperliquid when connected
 */
export async function getAllPricesAsync(): Promise<PriceData[]> {
  // Update Hyperliquid prices cache
  await updateHyperliquidPrices();
  return Object.keys(CRYPTO_BASE_PRICES).map(symbol => getLivePrice(symbol));
}

/**
 * Get all live prices (sync version for compatibility)
 */
export function getAllPrices(): PriceData[] {
  // Trigger async update in background
  updateHyperliquidPrices().catch(console.error);
  return Object.keys(CRYPTO_BASE_PRICES).map(symbol => getLivePrice(symbol));
}

/**
 * Run backtest with historical simulation
 */
export async function runBacktest(days: number = 30): Promise<{
  finalBalance: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  bestStrategy: string;
  trades: ScalpingTrade[];
}> {
  // Initialize fresh session for backtest
  const backtestSession = initializeSession(800);
  backtestSession.isRunning = true;
  
  const trades: ScalpingTrade[] = [];
  let maxBalance = 800;
  let maxDrawdown = 0;
  
  // Simulate trading cycles (4 per hour, 24 hours, for X days)
  const cycles = days * 24 * 4;
  
  for (let i = 0; i < cycles; i++) {
    const result = await executeTradingCycle();
    trades.push(...result.closedTrades);
    
    // Track max drawdown
    if (session!.currentBalance > maxBalance) {
      maxBalance = session!.currentBalance;
    }
    const drawdown = ((maxBalance - session!.currentBalance) / maxBalance) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Close all remaining open trades at current prices
  session!.openTrades.forEach(trade => {
    const priceData = getLivePrice(trade.symbol);
    const profit = (priceData.price - trade.entryPrice) * trade.quantity;
    trade.exitPrice = priceData.price;
    trade.profit = profit;
    trade.profitPercent = ((priceData.price - trade.entryPrice) / trade.entryPrice) * 100;
    trade.status = "CLOSED";
    trade.closedAt = new Date().toISOString();
    
    session!.currentBalance += trade.stake + profit;
    session!.totalProfit += profit;
    
    if (profit > 0) session!.winningTrades++;
    else session!.losingTrades++;
    
    trades.push(trade);
  });
  
  session!.openTrades = [];
  
  // Find best strategy
  updateStrategyStats();
  const bestStrategy = session!.strategyStats.length > 0 
    ? session!.strategyStats[0].name 
    : "none";
  
  return {
    finalBalance: session!.currentBalance,
    totalProfit: session!.totalProfit,
    totalProfitPercent: session!.totalProfitPercent,
    totalTrades: session!.totalTrades,
    winRate: session!.winRate,
    maxDrawdown,
    bestStrategy,
    trades,
  };
}
