import { describe, it, expect } from "vitest";
import {
  generateTradeSignals,
  getAvailableStrategies,
  calculatePositionSize,
  simulateTradeOutcome,
} from "./autoTrader";

describe("Auto Trading Service", () => {
  describe("getAvailableStrategies", () => {
    it("should return list of available strategies", () => {
      const strategies = getAvailableStrategies();

      expect(strategies).toContain("momentum");
      expect(strategies).toContain("mean-reversion");
      expect(strategies).toContain("volatility");
      expect(strategies).toContain("rsi");
      expect(strategies).toContain("trend-following");
      expect(strategies.length).toBe(5);
    });
  });

  describe("generateTradeSignals", () => {
    it("should generate signals for momentum strategy", () => {
      const mockPrices = [
        {
          symbol: "BTC",
          current_price: 45000,
          price_change_percentage_24h: 5,
          high_24h: 46000,
          low_24h: 44000,
        },
      ];

      const signals = generateTradeSignals(mockPrices, "momentum");

      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].strategy).toBe("momentum");
      expect(signals[0].action).toBe("buy");
    });

    it("should generate signals for mean-reversion strategy", () => {
      const mockPrices = [
        {
          symbol: "ETH",
          current_price: 2120,
          price_change_percentage_24h: -3,
          high_24h: 2400,
          low_24h: 2100,
        },
      ];

      const signals = generateTradeSignals(mockPrices, "mean-reversion");

      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].strategy).toBe("mean-reversion");
    });

    it("should generate signals for volatility strategy", () => {
      const mockPrices = [
        {
          symbol: "ADA",
          current_price: 1.0,
          price_change_percentage_24h: 8,
          high_24h: 1.1,
          low_24h: 0.9,
        },
      ];

      const signals = generateTradeSignals(mockPrices, "volatility");

      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].strategy).toBe("volatility");
    });

    it("should generate signals for RSI strategy", () => {
      const mockPrices = [
        {
          symbol: "SOL",
          current_price: 100,
          price_change_percentage_24h: -12,
          high_24h: 110,
          low_24h: 95,
        },
      ];

      const signals = generateTradeSignals(mockPrices, "rsi");

      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].strategy).toBe("rsi");
    });

    it("should generate signals for trend-following strategy", () => {
      const mockPrices = [
        {
          symbol: "XRP",
          current_price: 2.5,
          price_change_percentage_24h: 2.5,
          high_24h: 2.6,
          low_24h: 2.4,
        },
      ];

      const signals = generateTradeSignals(mockPrices, "trend-following");

      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].strategy).toBe("trend-following");
    });

    it("should return empty array for unknown strategy", () => {
      const mockPrices = [
        {
          symbol: "BTC",
          current_price: 45000,
          price_change_percentage_24h: 5,
          high_24h: 46000,
          low_24h: 44000,
        },
      ];

      const signals = generateTradeSignals(mockPrices, "unknown");

      expect(signals.length).toBe(0);
    });
  });

  describe("calculatePositionSize", () => {
    it("should calculate correct position size with default risk", () => {
      const positionSize = calculatePositionSize(10000);

      expect(positionSize).toBe(100); // 1% of 10000
    });

    it("should calculate correct position size with custom risk", () => {
      const positionSize = calculatePositionSize(10000, 2);

      expect(positionSize).toBe(200); // 2% of 10000
    });

    it("should handle zero account equity", () => {
      const positionSize = calculatePositionSize(0);

      expect(positionSize).toBe(0);
    });

    it("should handle large account equity", () => {
      const positionSize = calculatePositionSize(1000000, 0.5);

      expect(positionSize).toBe(5000); // 0.5% of 1000000
    });
  });

  describe("simulateTradeOutcome", () => {
    it("should simulate buy trade outcome", () => {
      const signal = {
        symbol: "BTC-USD",
        action: "buy" as const,
        strategy: "momentum",
        confidence: 0.8,
        entryPrice: 45000,
        stopLoss: 42750,
        takeProfit: 49500,
        reason: "Test signal",
      };

      const outcome = simulateTradeOutcome(signal, 45000);

      expect(outcome).toHaveProperty("profit");
      expect(outcome).toHaveProperty("profitRatio");
      expect(outcome).toHaveProperty("success");
      expect(typeof outcome.profit).toBe("number");
      expect(typeof outcome.profitRatio).toBe("number");
      expect(typeof outcome.success).toBe("boolean");
    });

    it("should simulate sell trade outcome", () => {
      const signal = {
        symbol: "ETH-USD",
        action: "sell" as const,
        strategy: "momentum",
        confidence: 0.8,
        entryPrice: 2500,
        stopLoss: 2650,
        takeProfit: 2250,
        reason: "Test signal",
      };

      const outcome = simulateTradeOutcome(signal, 2500);

      expect(outcome).toHaveProperty("profit");
      expect(outcome).toHaveProperty("profitRatio");
      expect(outcome).toHaveProperty("success");
    });

    it("should have reasonable profit/loss range", () => {
      const signal = {
        symbol: "BTC-USD",
        action: "buy" as const,
        strategy: "momentum",
        confidence: 0.8,
        entryPrice: 45000,
        stopLoss: 42750,
        takeProfit: 49500,
        reason: "Test signal",
      };

      // Run multiple simulations to check range
      for (let i = 0; i < 10; i++) {
        const outcome = simulateTradeOutcome(signal, 45000);

        // Profit should be within stop loss and take profit range
        expect(outcome.profit).toBeLessThanOrEqual(49500 - 45000);
        expect(outcome.profit).toBeGreaterThanOrEqual(42750 - 45000);
      }
    });
  });
});
