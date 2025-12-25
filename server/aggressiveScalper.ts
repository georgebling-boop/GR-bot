/**
 * Aggressive Scalping Trading System
 * $800 starting balance with buy-low-sell-high strategy
 * Many small trades for consistent profits
 */

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

// Simulated price data with realistic movements
const CRYPTO_BASE_PRICES: Record<string, number> = {
  BTC: 43250,
  ETH: 2280,
  ADA: 0.62,
  SOL: 98.5,
  XRP: 0.62,
  DOGE: 0.082,
};

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
 * Get simulated live price with realistic movement
 */
export function getLivePrice(symbol: string): PriceData {
  const basePrice = CRYPTO_BASE_PRICES[symbol] || 100;
  
  // Add price to history
  if (!priceHistory[symbol]) {
    priceHistory[symbol] = [basePrice];
  }
  
  const lastPrice = priceHistory[symbol][priceHistory[symbol].length - 1] || basePrice;
  
  // Simulate realistic price movement (0.1% to 0.5% variation)
  const volatility = 0.003; // 0.3% base volatility
  const trend = Math.random() > 0.5 ? 1 : -1;
  const change = lastPrice * volatility * trend * (0.5 + Math.random());
  const newPrice = Math.max(lastPrice * 0.95, Math.min(lastPrice * 1.05, lastPrice + change));
  
  // Keep last 100 prices
  priceHistory[symbol].push(newPrice);
  if (priceHistory[symbol].length > 100) {
    priceHistory[symbol].shift();
  }
  
  const prices = priceHistory[symbol];
  const high24h = Math.max(...prices.slice(-24));
  const low24h = Math.min(...prices.slice(-24));
  const change24h = ((newPrice - prices[0]) / prices[0]) * 100;
  
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
 * Execute a single trading cycle
 */
export function executeTradingCycle(): { 
  session: ScalpingSession; 
  actions: string[];
  newTrades: ScalpingTrade[];
  closedTrades: ScalpingTrade[];
} {
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
    }
  });
  
  // Remove closed trades from open trades
  session.openTrades = session.openTrades.filter(t => t.status === "OPEN");
  session.closedTrades.push(...closedTradesThisCycle);
  
  // Look for new trading opportunities
  if (session.isRunning && session.openTrades.length < 5) { // Max 5 concurrent trades
    for (const symbol of symbols) {
      if (session.openTrades.some(t => t.symbol === symbol)) continue; // Skip if already have position
      
      const analysis = analyzeScalpingOpportunity(symbol);
      
      if (analysis.action === "BUY" && analysis.confidence >= 65) {
        const priceData = getLivePrice(symbol);
        const currentPrice = priceData.price;
        
        // Stake 5-10% of balance per trade for aggressive scalping
        const stakePercent = 0.05 + (analysis.confidence / 100) * 0.05;
        const stake = Math.min(session.currentBalance * stakePercent, session.currentBalance * 0.15);
        
        if (stake >= 10 && session.currentBalance >= stake) { // Minimum $10 trade
          const quantity = stake / currentPrice;
          const stopLoss = currentPrice * 0.98; // 2% stop loss
          const takeProfit = currentPrice * 1.015; // 1.5% take profit (scalping)
          
          const trade: ScalpingTrade = {
            id: tradeIdCounter++,
            symbol,
            side: "BUY",
            entryPrice: currentPrice,
            exitPrice: null,
            quantity,
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
          
          actions.push(`BUY: ${symbol} @ $${currentPrice.toFixed(4)} | Stake: $${stake.toFixed(2)} | ${analysis.reason}`);
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
 * Get all live prices
 */
export function getAllPrices(): PriceData[] {
  return Object.keys(CRYPTO_BASE_PRICES).map(symbol => getLivePrice(symbol));
}

/**
 * Run backtest with historical simulation
 */
export function runBacktest(days: number = 30): {
  finalBalance: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  bestStrategy: string;
  trades: ScalpingTrade[];
} {
  // Initialize fresh session for backtest
  const backtestSession = initializeSession(800);
  backtestSession.isRunning = true;
  
  const trades: ScalpingTrade[] = [];
  let maxBalance = 800;
  let maxDrawdown = 0;
  
  // Simulate trading cycles (4 per hour, 24 hours, for X days)
  const cycles = days * 24 * 4;
  
  for (let i = 0; i < cycles; i++) {
    const result = executeTradingCycle();
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
