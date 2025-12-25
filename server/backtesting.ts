/**
 * Backtesting Module
 * Test AI strategies against historical data to validate improvements
 */

import { getDb } from "./db";
import { backtestResults, tradeHistory } from "../drizzle/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import {
  getStrategyWeights,
  getOptimizedParameters,
  getBrainState,
} from "./continuousLearningAI";

export interface BacktestConfig {
  strategy: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  positionSizePercent: number;
  takeProfitPercent: number;
  stopLossPercent: number;
}

export interface BacktestTrade {
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  profit: number;
  profitPercent: number;
  isWin: boolean;
  reason: string;
}

export interface BacktestResult {
  id?: number;
  config: BacktestConfig;
  trades: BacktestTrade[];
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfit: number;
    totalProfitPercent: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    averageTradeDuration: number;
    finalBalance: number;
  };
  equityCurve: Array<{ time: Date; equity: number }>;
  createdAt: Date;
}

// Simulated historical price data generator
function generateHistoricalPrices(
  symbol: string,
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 15
): Array<{ time: Date; open: number; high: number; low: number; close: number; volume: number }> {
  const prices: Array<{ time: Date; open: number; high: number; low: number; close: number; volume: number }> = [];
  
  // Base prices for different symbols
  const basePrices: Record<string, number> = {
    BTC: 43000,
    ETH: 2300,
    ADA: 0.62,
    SOL: 98,
    XRP: 0.62,
    DOGE: 0.082,
  };
  
  let currentPrice = basePrices[symbol] || 100;
  let currentTime = new Date(startDate);
  
  while (currentTime <= endDate) {
    const volatility = 0.002; // 0.2% per interval
    const trend = Math.random() > 0.48 ? 1 : -1; // Slight bullish bias
    const change = currentPrice * volatility * trend * (0.5 + Math.random());
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.001);
    const low = Math.min(open, close) * (1 - Math.random() * 0.001);
    
    prices.push({
      time: new Date(currentTime),
      open,
      high,
      low,
      close,
      volume: currentPrice * 1000000 * (0.8 + Math.random() * 0.4),
    });
    
    currentPrice = close;
    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
  }
  
  return prices;
}

// Calculate RSI from price data
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

// Calculate SMA
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Calculate Bollinger Bands
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

// Strategy signal generators
function getMomentumSignal(prices: number[]): { action: "BUY" | "SELL" | "HOLD"; confidence: number } {
  const sma5 = calculateSMA(prices, 5);
  const sma20 = calculateSMA(prices, 20);
  const currentPrice = prices[prices.length - 1];
  
  if (sma5 > sma20 * 1.005 && currentPrice > sma5) {
    return { action: "BUY", confidence: 70 + Math.random() * 20 };
  } else if (sma5 < sma20 * 0.995 && currentPrice < sma5) {
    return { action: "SELL", confidence: 70 + Math.random() * 20 };
  }
  return { action: "HOLD", confidence: 0 };
}

function getRSISignal(prices: number[]): { action: "BUY" | "SELL" | "HOLD"; confidence: number } {
  const rsi = calculateRSI(prices);
  
  if (rsi < 30) {
    return { action: "BUY", confidence: 60 + (30 - rsi) };
  } else if (rsi > 70) {
    return { action: "SELL", confidence: 60 + (rsi - 70) };
  }
  return { action: "HOLD", confidence: 0 };
}

function getBollingerSignal(prices: number[]): { action: "BUY" | "SELL" | "HOLD"; confidence: number } {
  const bb = calculateBollingerBands(prices);
  const currentPrice = prices[prices.length - 1];
  
  if (currentPrice <= bb.lower * 1.01) {
    return { action: "BUY", confidence: 75 };
  } else if (currentPrice >= bb.upper * 0.99) {
    return { action: "SELL", confidence: 75 };
  }
  return { action: "HOLD", confidence: 0 };
}

function getMeanReversionSignal(prices: number[]): { action: "BUY" | "SELL" | "HOLD"; confidence: number } {
  const sma20 = calculateSMA(prices, 20);
  const currentPrice = prices[prices.length - 1];
  const deviation = (currentPrice - sma20) / sma20 * 100;
  
  if (deviation < -2) {
    return { action: "BUY", confidence: 65 + Math.abs(deviation) * 5 };
  } else if (deviation > 2) {
    return { action: "SELL", confidence: 65 + Math.abs(deviation) * 5 };
  }
  return { action: "HOLD", confidence: 0 };
}

// Get signal based on strategy name
function getStrategySignal(strategy: string, prices: number[]): { action: "BUY" | "SELL" | "HOLD"; confidence: number } {
  switch (strategy) {
    case "momentum":
      return getMomentumSignal(prices);
    case "rsi_scalp":
      return getRSISignal(prices);
    case "bollinger_bounce":
      return getBollingerSignal(prices);
    case "mean_reversion":
      return getMeanReversionSignal(prices);
    case "rsi_macd_bb":
      // Combined strategy
      const rsiSig = getRSISignal(prices);
      const bbSig = getBollingerSignal(prices);
      if (rsiSig.action === bbSig.action && rsiSig.action !== "HOLD") {
        return { action: rsiSig.action, confidence: (rsiSig.confidence + bbSig.confidence) / 2 + 10 };
      }
      return { action: "HOLD", confidence: 0 };
    default:
      return getMomentumSignal(prices);
  }
}

/**
 * Run a backtest with the given configuration
 */
export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  const historicalPrices = generateHistoricalPrices(
    config.symbol,
    config.startDate,
    config.endDate
  );
  
  const trades: BacktestTrade[] = [];
  const equityCurve: Array<{ time: Date; equity: number }> = [];
  
  let balance = config.initialBalance;
  let position: { entryPrice: number; entryTime: Date; quantity: number } | null = null;
  let maxEquity = balance;
  let maxDrawdown = 0;
  
  const closePrices: number[] = [];
  
  for (let i = 0; i < historicalPrices.length; i++) {
    const candle = historicalPrices[i];
    closePrices.push(candle.close);
    
    // Need at least 50 candles for indicators
    if (closePrices.length < 50) continue;
    
    // Record equity
    const currentEquity = position 
      ? balance + (candle.close - position.entryPrice) * position.quantity
      : balance;
    
    equityCurve.push({ time: candle.time, equity: currentEquity });
    
    // Track max drawdown
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity;
    }
    const drawdown = ((maxEquity - currentEquity) / maxEquity) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
    
    // Check for exit if in position
    if (position) {
      const profitPercent = ((candle.close - position.entryPrice) / position.entryPrice) * 100;
      
      // Check take profit
      if (profitPercent >= config.takeProfitPercent) {
        const profit = (candle.close - position.entryPrice) * position.quantity;
        trades.push({
          entryPrice: position.entryPrice,
          exitPrice: candle.close,
          entryTime: position.entryTime,
          exitTime: candle.time,
          profit,
          profitPercent,
          isWin: true,
          reason: "Take Profit",
        });
        balance += profit + position.entryPrice * position.quantity;
        position = null;
        continue;
      }
      
      // Check stop loss
      if (profitPercent <= -config.stopLossPercent) {
        const profit = (candle.close - position.entryPrice) * position.quantity;
        trades.push({
          entryPrice: position.entryPrice,
          exitPrice: candle.close,
          entryTime: position.entryTime,
          exitTime: candle.time,
          profit,
          profitPercent,
          isWin: false,
          reason: "Stop Loss",
        });
        balance += profit + position.entryPrice * position.quantity;
        position = null;
        continue;
      }
    }
    
    // Check for entry if not in position
    if (!position) {
      const signal = getStrategySignal(config.strategy, closePrices);
      
      if (signal.action === "BUY" && signal.confidence >= 65) {
        const positionSize = balance * (config.positionSizePercent / 100);
        if (positionSize >= 10) {
          const quantity = positionSize / candle.close;
          position = {
            entryPrice: candle.close,
            entryTime: candle.time,
            quantity,
          };
          balance -= positionSize;
        }
      }
    }
  }
  
  // Close any remaining position at the end
  if (position && historicalPrices.length > 0) {
    const lastCandle = historicalPrices[historicalPrices.length - 1];
    const profitPercent = ((lastCandle.close - position.entryPrice) / position.entryPrice) * 100;
    const profit = (lastCandle.close - position.entryPrice) * position.quantity;
    trades.push({
      entryPrice: position.entryPrice,
      exitPrice: lastCandle.close,
      entryTime: position.entryTime,
      exitTime: lastCandle.time,
      profit,
      profitPercent,
      isWin: profit > 0,
      reason: "End of Period",
    });
    balance += profit + position.entryPrice * position.quantity;
  }
  
  // Calculate summary statistics
  const winningTrades = trades.filter(t => t.isWin);
  const losingTrades = trades.filter(t => !t.isWin);
  
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const totalWins = winningTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
  
  const averageWin = winningTrades.length > 0 
    ? totalWins / winningTrades.length 
    : 0;
  const averageLoss = losingTrades.length > 0 
    ? totalLosses / losingTrades.length 
    : 0;
  
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  
  // Calculate Sharpe Ratio (simplified)
  const returns = trades.map(t => t.profitPercent);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const returnVariance = returns.length > 0 
    ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length 
    : 0;
  const returnStdDev = Math.sqrt(returnVariance);
  const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0;
  
  // Average trade duration
  const avgDuration = trades.length > 0
    ? trades.reduce((sum, t) => sum + (t.exitTime.getTime() - t.entryTime.getTime()), 0) / trades.length / (60 * 1000)
    : 0;
  
  const result: BacktestResult = {
    config,
    trades,
    summary: {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalProfit,
      totalProfitPercent: (totalProfit / config.initialBalance) * 100,
      maxDrawdown: maxDrawdown,
      maxDrawdownPercent: maxDrawdown,
      sharpeRatio,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit)) : 0,
      averageTradeDuration: avgDuration,
      finalBalance: balance,
    },
    equityCurve,
    createdAt: new Date(),
  };
  
  // Save to database
  await saveBacktestResult(result);
  
  return result;
}

/**
 * Save backtest result to database
 */
async function saveBacktestResult(result: BacktestResult): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    
    await db.insert(backtestResults).values({
      strategy: result.config.strategy,
      symbol: result.config.symbol,
      startDate: result.config.startDate,
      endDate: result.config.endDate,
      totalTrades: result.summary.totalTrades,
      winningTrades: result.summary.winningTrades,
      losingTrades: result.summary.losingTrades,
      winRate: Math.round(result.summary.winRate * 100),
      totalProfit: result.summary.totalProfit.toFixed(2),
      maxDrawdown: result.summary.maxDrawdown.toFixed(2),
      sharpeRatio: result.summary.sharpeRatio.toFixed(4),
      resultData: JSON.stringify({
        config: result.config,
        trades: result.trades,
        equityCurve: result.equityCurve,
      }),
    });
  } catch (error) {
    console.error("Failed to save backtest result:", error);
  }
}

/**
 * Get recent backtest results
 */
export async function getBacktestHistory(limit: number = 10): Promise<BacktestResult[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    
    const results = await db
      .select()
      .from(backtestResults)
      .orderBy(desc(backtestResults.createdAt))
      .limit(limit);
    
    return results.map(r => {
      const data = JSON.parse(r.resultData);
      return {
        id: r.id,
        config: data.config,
        trades: data.trades,
        summary: {
          totalTrades: r.totalTrades,
          winningTrades: r.winningTrades,
          losingTrades: r.losingTrades,
          winRate: r.winRate / 100,
          totalProfit: parseFloat(r.totalProfit),
          totalProfitPercent: (parseFloat(r.totalProfit) / data.config.initialBalance) * 100,
          maxDrawdown: parseFloat(r.maxDrawdown),
          maxDrawdownPercent: parseFloat(r.maxDrawdown),
          sharpeRatio: parseFloat(r.sharpeRatio),
          profitFactor: 0,
          averageWin: 0,
          averageLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          averageTradeDuration: 0,
          finalBalance: data.config.initialBalance + parseFloat(r.totalProfit),
        },
        equityCurve: data.equityCurve || [],
        createdAt: r.createdAt,
      };
    });
  } catch (error) {
    console.error("Failed to get backtest history:", error);
    return [];
  }
}

/**
 * Compare strategies using backtesting
 */
export async function compareStrategies(
  symbol: string,
  days: number = 30,
  initialBalance: number = 800
): Promise<Array<{ strategy: string; result: BacktestResult }>> {
  const strategies = ["momentum", "rsi_scalp", "bollinger_bounce", "mean_reversion", "rsi_macd_bb"];
  const params = getOptimizedParameters();
  
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  const results: Array<{ strategy: string; result: BacktestResult }> = [];
  
  for (const strategy of strategies) {
    const result = await runBacktest({
      strategy,
      symbol,
      startDate,
      endDate,
      initialBalance,
      positionSizePercent: params.positionSizePercent,
      takeProfitPercent: params.takeProfitPercent,
      stopLossPercent: params.stopLossPercent,
    });
    
    results.push({ strategy, result });
  }
  
  // Sort by total profit
  results.sort((a, b) => b.result.summary.totalProfit - a.result.summary.totalProfit);
  
  return results;
}

/**
 * Get backtest summary statistics
 */
export async function getBacktestStats(): Promise<{
  totalBacktests: number;
  averageWinRate: number;
  bestStrategy: string;
  bestWinRate: number;
  totalSimulatedTrades: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        totalBacktests: 0,
        averageWinRate: 0,
        bestStrategy: "N/A",
        bestWinRate: 0,
        totalSimulatedTrades: 0,
      };
    }
    
    const results = await db
      .select()
      .from(backtestResults)
      .orderBy(desc(backtestResults.winRate))
      .limit(100);
    
    if (results.length === 0) {
      return {
        totalBacktests: 0,
        averageWinRate: 0,
        bestStrategy: "N/A",
        bestWinRate: 0,
        totalSimulatedTrades: 0,
      };
    }
    
    const totalWinRate = results.reduce((sum, r) => sum + r.winRate, 0);
    const totalTrades = results.reduce((sum, r) => sum + r.totalTrades, 0);
    
    return {
      totalBacktests: results.length,
      averageWinRate: totalWinRate / results.length / 100,
      bestStrategy: results[0].strategy,
      bestWinRate: results[0].winRate / 100,
      totalSimulatedTrades: totalTrades,
    };
  } catch (error) {
    console.error("Failed to get backtest stats:", error);
    return {
      totalBacktests: 0,
      averageWinRate: 0,
      bestStrategy: "N/A",
      bestWinRate: 0,
      totalSimulatedTrades: 0,
    };
  }
}
