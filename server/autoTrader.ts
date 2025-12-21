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
 * Generate signal for a specific strategy
 */
function generateSignalForStrategy(price: any, strategy: string): TradeSignal | null {
  const symbol = price.symbol;
  const currentPrice = price.current_price;
  const change24h = price.price_change_percentage_24h;
  const high24h = price.high_24h;
  const low24h = price.low_24h;

  switch (strategy) {
    case "momentum": {
      // Buy on positive momentum, sell on negative
      if (change24h > 2) {
        return {
          symbol: `${symbol}-USD`,
          action: "buy",
          strategy: "momentum",
          confidence: Math.min(Math.abs(change24h) / 10, 1),
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.95, // 5% stop loss
          takeProfit: currentPrice * 1.1, // 10% take profit
          reason: `Positive momentum: +${change24h.toFixed(2)}% in 24h`,
        };
      }
      break;
    }

    case "mean-reversion": {
      // Buy when price is near 24h low, sell when near high
      const range = high24h - low24h;
      const position = (currentPrice - low24h) / range;

      if (position < 0.3) {
        // Price near low - good buying opportunity
        return {
          symbol: `${symbol}-USD`,
          action: "buy",
          strategy: "mean-reversion",
          confidence: 1 - position,
          entryPrice: currentPrice,
          stopLoss: low24h * 0.98,
          takeProfit: (high24h + currentPrice) / 2,
          reason: `Price near 24h low (${position.toFixed(2)}% of range)`,
        };
      }
      break;
    }

    case "volatility": {
      // Trade when volatility is high
      const range = high24h - low24h;
      const volatility = (range / currentPrice) * 100;

      if (volatility > 5) {
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
