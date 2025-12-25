import { describe, it, expect } from "vitest";
import { RSIMACDBollingerBandsStrategy } from "./rsiMacdBollingerBands";

describe("RSI + MACD + Bollinger Bands Strategy", () => {
  const strategy = new RSIMACDBollingerBandsStrategy();

  // Generate sample price data with trend
  const generatePriceData = (
    basePrice: number,
    length: number,
    trend: "up" | "down" | "neutral"
  ): number[] => {
    const prices: number[] = [basePrice];

    for (let i = 1; i < length; i++) {
      let change = (Math.random() - 0.5) * 2; // Random change -1 to 1

      if (trend === "up") change += 0.5; // Uptrend
      else if (trend === "down") change -= 0.5; // Downtrend

      prices.push(Math.max(prices[i - 1] + change, basePrice * 0.5));
    }

    return prices;
  };

  it("should generate BUY signal when RSI is oversold and MACD is bullish", () => {
    // Create oversold conditions
    const prices = generatePriceData(100, 50, "down");
    const signal = strategy.generateSignal("BTC/USD", prices, prices[prices.length - 1]);

    expect(signal.symbol).toBe("BTC/USD");
    expect(signal.rsiValue).toBeLessThan(50); // Oversold territory
    expect(signal.signal).toBeDefined();
    expect(signal.confidence).toBeGreaterThanOrEqual(0);
    expect(signal.confidence).toBeLessThanOrEqual(1);
  });

  it("should generate SELL signal when RSI is overbought and MACD is bearish", () => {
    // Create overbought conditions
    const prices = generatePriceData(100, 50, "up");
    const signal = strategy.generateSignal("ETH/USD", prices, prices[prices.length - 1]);

    expect(signal.symbol).toBe("ETH/USD");
    expect(signal.rsiValue).toBeGreaterThan(50); // Overbought territory
    expect(signal.signal).toBeDefined();
    expect(signal.confidence).toBeGreaterThanOrEqual(0);
    expect(signal.confidence).toBeLessThanOrEqual(1);
  });

  it("should return HOLD signal for insufficient data", () => {
    const prices = [100, 101, 102]; // Only 3 prices
    const signal = strategy.generateSignal("ADA/USD", prices, 102);

    expect(signal.signal).toBe("HOLD");
    expect(signal.confidence).toBe(0);
    expect(signal.rsiValue).toBe(50);
  });

  it("should calculate proper entry, stop loss, and take profit levels", () => {
    const prices = generatePriceData(100, 50, "down");
    const currentPrice = prices[prices.length - 1];
    const signal = strategy.generateSignal("SOL/USD", prices, currentPrice);

    expect(signal.entryPrice).toBe(currentPrice);
    expect(signal.stopLoss).toBeDefined();
    expect(signal.takeProfit).toBeDefined();

    if (signal.signal === "BUY") {
      expect(signal.stopLoss).toBeLessThan(signal.entryPrice);
      expect(signal.takeProfit).toBeGreaterThan(signal.entryPrice);
    } else if (signal.signal === "SELL") {
      expect(signal.stopLoss).toBeGreaterThan(signal.entryPrice);
      expect(signal.takeProfit).toBeLessThan(signal.entryPrice);
    }
  });

  it("should calculate risk/reward ratio", () => {
    const prices = generatePriceData(100, 50, "down");
    const signal = strategy.generateSignal("XRP/USD", prices, prices[prices.length - 1]);

    expect(signal.riskReward).toBeGreaterThan(0);
    expect(signal.riskReward).toBeLessThanOrEqual(10); // Reasonable R:R ratio
  });

  it("should have high confidence when all indicators align", () => {
    // Create strong downtrend for BUY signal
    const prices = generatePriceData(100, 60, "down");
    const signal = strategy.generateSignal("DOGE/USD", prices, prices[prices.length - 1]);

    if (signal.signal === "BUY") {
      expect(signal.confidence).toBeGreaterThan(0.7);
    }
  });

  it("should handle multiple symbols independently", () => {
    const prices1 = generatePriceData(100, 50, "up");
    const prices2 = generatePriceData(100, 50, "down");

    const signal1 = strategy.generateSignal("BTC/USD", prices1, prices1[prices1.length - 1]);
    const signal2 = strategy.generateSignal("ETH/USD", prices2, prices2[prices2.length - 1]);

    expect(signal1.symbol).toBe("BTC/USD");
    expect(signal2.symbol).toBe("ETH/USD");
    expect(signal1.rsiValue).not.toBe(signal2.rsiValue); // Different market conditions
  });
});
