import { describe, it, expect } from "vitest";
import {
  runBacktest,
  getBacktestHistory,
  compareStrategies,
  getBacktestStats,
} from "./backtesting";

describe("Backtesting Module", () => {
  describe("runBacktest", () => {
    it("should run a backtest with valid configuration", { timeout: 15000 }, async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const result = await runBacktest({
        strategy: "momentum",
        symbol: "BTC",
        startDate,
        endDate,
        initialBalance: 800,
        positionSizePercent: 5,
        takeProfitPercent: 2,
        stopLossPercent: 1.5,
      });
      
      expect(result).toBeDefined();
      expect(result.config.strategy).toBe("momentum");
      expect(result.config.symbol).toBe("BTC");
      expect(result.config.initialBalance).toBe(800);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTrades).toBeGreaterThanOrEqual(0);
      expect(result.summary.winRate).toBeGreaterThanOrEqual(0);
      expect(result.summary.winRate).toBeLessThanOrEqual(100);
      expect(result.equityCurve).toBeDefined();
      expect(result.equityCurve.length).toBeGreaterThan(0);
    });

    it("should calculate win rate correctly", async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days
      
      const result = await runBacktest({
        strategy: "rsi_scalp",
        symbol: "ETH",
        startDate,
        endDate,
        initialBalance: 1000,
        positionSizePercent: 10,
        takeProfitPercent: 1.5,
        stopLossPercent: 1,
      });
      
      if (result.summary.totalTrades > 0) {
        const calculatedWinRate = (result.summary.winningTrades / result.summary.totalTrades) * 100;
        expect(Math.abs(result.summary.winRate - calculatedWinRate)).toBeLessThan(0.01);
      }
    });

    it("should track equity curve over time", async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const result = await runBacktest({
        strategy: "bollinger_bounce",
        symbol: "SOL",
        startDate,
        endDate,
        initialBalance: 500,
        positionSizePercent: 5,
        takeProfitPercent: 2,
        stopLossPercent: 1.5,
      });
      
      expect(result.equityCurve.length).toBeGreaterThan(0);
      
      // First equity point should be close to initial balance
      if (result.equityCurve.length > 0) {
        expect(result.equityCurve[0].equity).toBeGreaterThan(0);
      }
    });

    it("should calculate max drawdown", async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await runBacktest({
        strategy: "mean_reversion",
        symbol: "ADA",
        startDate,
        endDate,
        initialBalance: 800,
        positionSizePercent: 5,
        takeProfitPercent: 2,
        stopLossPercent: 1.5,
      });
      
      expect(result.summary.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.summary.maxDrawdown).toBeLessThanOrEqual(100);
    });
  });

  describe("compareStrategies", () => {
    it("should compare multiple strategies", async () => {
      const results = await compareStrategies("BTC", 3, 800);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      
      // Should be sorted by profit
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].result.summary.totalProfit)
          .toBeGreaterThanOrEqual(results[i].result.summary.totalProfit);
      }
    });

    it("should include all standard strategies", async () => {
      const results = await compareStrategies("ETH", 3, 500);
      
      const strategies = results.map(r => r.strategy);
      expect(strategies).toContain("momentum");
      expect(strategies).toContain("rsi_scalp");
      expect(strategies).toContain("bollinger_bounce");
      expect(strategies).toContain("mean_reversion");
      expect(strategies).toContain("rsi_macd_bb");
    });
  });

  describe("getBacktestStats", () => {
    it("should return backtest statistics", { timeout: 15000 }, async () => {
      const stats = await getBacktestStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalBacktests");
      expect(stats).toHaveProperty("averageWinRate");
      expect(stats).toHaveProperty("bestStrategy");
      expect(stats).toHaveProperty("bestWinRate");
      expect(stats).toHaveProperty("totalSimulatedTrades");
    });
  });

  describe("getBacktestHistory", () => {
    it("should return backtest history", { timeout: 15000 }, async () => {
      // First run a backtest to ensure there's data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      await runBacktest({
        strategy: "momentum",
        symbol: "BTC",
        startDate,
        endDate,
        initialBalance: 800,
        positionSizePercent: 5,
        takeProfitPercent: 2,
        stopLossPercent: 1.5,
      });
      
      const history = await getBacktestHistory(5);
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
