/**
 * Auto Trading Service
 * Automatically executes trades using different strategies to learn and optimize
 */

import { fetchCryptoPrices } from "./marketData";

export interface AutoTradeConfig {
  enabled: boolean;
  interval: number; // milliseconds between trades
  maxOpenTrades: number;
  stakeAmount: number;
  strategies: string[];
}

export interface TradeSignal {
  symbol: string;
  action: "buy" | "sell";
  strategy: string;
  confidence: number; // 0-1
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
}

/**
 * Generate trading signals based on different strategies
 * ENHANCED: Now requires multi-indicator confirmation for better accuracy
 */
export function generateTradeSignals(
  prices: any[],
  strategy: string
): TradeSignal[] {
  const signals: TradeSignal[] = [];

  for (const price of prices) {
    const signal = generateSignalForStrategy(price, strategy);
    if (signal) {
      signals.push(signal);
    }
  }

  return signals;
}

/**
 * HELPER: Analyze market condition with multiple confirmations
 * Requires 2+ indicators to align before giving high-confidence signal
 */
function getMultiIndicatorConfirmation(price: any): {
  momentum: number;
  meanReversion: number;
  volatility: number;
  alignedSignals: number;
} {
  const symbol = price.symbol;
  const currentPrice = price.current_price;
  const change24h = price.price_change_percentage_24h;
  const high24h = price.high_24h;
  const low24h = price.low_24h;
  const volume = price.total_volume || 0;

  // Momentum score (-1 to 1)
  const momentumScore = Math.max(-1, Math.min(1, change24h / 5)); // Normalize to -1 to 1

  // Mean reversion score (0 to 1)
  const range = high24h - low24h;
  const position = range > 0 ? (currentPrice - low24h) / range : 0.5;
  const meanReversionScore = position < 0.3 ? 1 : position > 0.7 ? -1 : 0;

  // Volatility score (0 to 1)
  const volatility = range > 0 ? (range / currentPrice) * 100 : 0;
  const volatilityScore = volatility > 5 ? 1 : volatility > 2 ? 0.5 : 0;

  // Count aligned signals
  let alignedSignals = 0;
  if (momentumScore > 0.3) alignedSignals++;
  if (meanReversionScore > 0.3) alignedSignals++;
  if (volatilityScore > 0.3) alignedSignals++;

  return {
    momentum: momentumScore,
    meanReversion: meanReversionScore,
    volatility: volatilityScore,
    alignedSignals,
  };
}

/**
 * Generate signal for a specific strategy
 * ENHANCED: Requires multi-indicator confluence for entry
 */
function generateSignalForStrategy(price: any, strategy: string): TradeSignal | null {
  const symbol = price.symbol;
  const currentPrice = price.current_price;
  const change24h = price.price_change_percentage_24h;
  const high24h = price.high_24h;
  const low24h = price.low_24h;

  // Get multi-indicator analysis
  const indicators = getMultiIndicatorConfirmation(price);

  switch (strategy) {
    case "momentum": {
      // Require positive momentum + volume or mean reversion confirmation
      if (change24h > 2 && (indicators.alignedSignals >= 2 || indicators.volatility > 0.3)) {
        return {
          symbol: `${symbol}-USD`,
          action: "buy",
          strategy: "momentum",
          confidence: Math.min((Math.abs(change24h) / 10) * (0.5 + indicators.alignedSignals * 0.25), 1),
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.975, // 2.5% stop loss (updated from 5%)
          takeProfit: currentPrice * 1.05, // 5% take profit (updated from 10%)
          reason: `Momentum confirmed by ${indicators.alignedSignals} indicators: +${change24h.toFixed(2)}%`,
        };
      }
      break;
    }

    case "mean-reversion": {
      // Buy when price is near 24h low WITH volatility confirmation
      const range = high24h - low24h;
      const position = range > 0 ? (currentPrice - low24h) / range : 0.5;

      if (position < 0.3 && indicators.volatility > 0.3) {
        // Price near low with high volatility - good buying opportunity
        return {
          symbol: `${symbol}-USD`,
          action: "buy",
          strategy: "mean-reversion",
          confidence: (1 - position) * (0.5 + indicators.volatility * 0.5),
          entryPrice: currentPrice,
          stopLoss: low24h * 0.98,
          takeProfit: (high24h + currentPrice) / 2,
          reason: `Price at ${(position * 100).toFixed(0)}% of range + volatility confirmation`,
        };
      }
      break;
    }

    case "volatility": {
      // Trade when volatility is high AND momentum is present
      const range = high24h - low24h;
      const volatility = range > 0 ? (range / currentPrice) * 100 : 0;

      if (volatility > 5 && Math.abs(indicators.momentum) > 0.3) {
        const action = change24h > 0 ? "buy" : "sell";
        return {
          symbol: `${symbol}-USD`,
          action,
          strategy: "volatility",
          confidence: Math.min(volatility / 20, 1),
          entryPrice: currentPrice,
          stopLoss: currentPrice * (action === "buy" ? 0.93 : 1.07),
          takeProfit: currentPrice * (action === "buy" ? 1.12 : 0.88),
          reason: `High volatility: ${volatility.toFixed(2)}% range`,
        };
      }
      break;
    }

    case "rsi": {
      // Simplified RSI: buy oversold, sell overbought
      // Using price change as proxy for RSI
      const rsi = 50 + change24h * 2.5; // Simplified calculation

      if (rsi < 30) {
        return {
          symbol: `${symbol}-USD`,
          action: "buy",
          strategy: "rsi",
          confidence: (30 - rsi) / 30,
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.94,
          takeProfit: currentPrice * 1.08,
          reason: `Oversold condition (RSI ~${rsi.toFixed(0)})`,
        };
      } else if (rsi > 70) {
        return {
          symbol: `${symbol}-USD`,
          action: "sell",
          strategy: "rsi",
          confidence: (rsi - 70) / 30,
          entryPrice: currentPrice,
          stopLoss: currentPrice * 1.06,
          takeProfit: currentPrice * 0.92,
          reason: `Overbought condition (RSI ~${rsi.toFixed(0)})`,
        };
      }
      break;
    }

    case "trend-following": {
      // Follow the trend based on 24h change
      if (Math.abs(change24h) > 1.5) {
        const action = change24h > 0 ? "buy" : "sell";
        return {
          symbol: `${symbol}-USD`,
          action,
          strategy: "trend-following",
          confidence: Math.min(Math.abs(change24h) / 10, 1),
          entryPrice: currentPrice,
          stopLoss: currentPrice * (action === "buy" ? 0.96 : 1.04),
          takeProfit: currentPrice * (action === "buy" ? 1.09 : 0.91),
          reason: `Strong trend: ${change24h > 0 ? "Uptrend" : "Downtrend"} ${Math.abs(change24h).toFixed(2)}%`,
        };
      }
      break;
    }

    default:
      return null;
  }

  return null;
}

/**
 * Get all available strategies
 */
export function getAvailableStrategies(): string[] {
  return ["momentum", "mean-reversion", "volatility", "rsi", "trend-following"];
}

/**
 * Calculate position size based on account equity and risk
 */
export function calculatePositionSize(
  accountEquity: number,
  riskPercentage: number = 1
): number {
  return (accountEquity * riskPercentage) / 100;
}

/**
 * Simulate trade outcome
 */
export function simulateTradeOutcome(
  signal: TradeSignal,
  currentPrice: number
): { profit: number; profitRatio: number; success: boolean } {
  let closePrice: number;
  let success: boolean;

  // Simulate random price movement
  const random = Math.random();

  if (signal.action === "buy") {
    // 60% chance to hit take profit, 30% stop loss, 10% break even
    if (random < 0.6) {
      closePrice = signal.takeProfit;
      success = true;
    } else if (random < 0.9) {
      closePrice = signal.stopLoss;
      success = false;
    } else {
      closePrice = signal.entryPrice;
      success = true;
    }
  } else {
    // Sell signal
    if (random < 0.6) {
      closePrice = signal.takeProfit;
      success = true;
    } else if (random < 0.9) {
      closePrice = signal.stopLoss;
      success = false;
    } else {
      closePrice = signal.entryPrice;
      success = true;
    }
  }

  const profit = signal.action === "buy" 
    ? closePrice - signal.entryPrice
    : signal.entryPrice - closePrice;

  const profitRatio = profit / signal.entryPrice;

  return { profit, profitRatio, success };
}
