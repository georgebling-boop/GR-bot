import { describe, it, expect, beforeEach } from "vitest";
import {
  analyzeTrade,
  detectMarketCondition,
  getOptimizedParameters,
  getBestStrategy,
  rankStrategies,
  getLearningState,
  runLearningCycle,
  resetLearning,
  getDiscoveredPatterns,
} from "./selfLearning";

describe("Self-Learning System", () => {
  beforeEach(() => {
    resetLearning();
  });

  describe("analyzeTrade", () => {
    it("should analyze a winning trade and update state", () => {
      const insights = analyzeTrade({
        symbol: "BTC/USDT",
        strategy: "momentum",
        entryPrice: 50000,
        exitPrice: 51000,
        profit: 100,
        profitPercent: 2,
        duration: 3600,
      });

      const state = getLearningState();
      expect(state.totalAnalyzedTrades).toBe(1);
      expect(insights).toBeDefined();
    });

    it("should analyze a losing trade and adjust parameters", () => {
      const insights = analyzeTrade({
        symbol: "ETH/USDT",
        strategy: "rsi",
        entryPrice: 3000,
        exitPrice: 2850,
        profit: -50,
        profitPercent: -5,
        duration: 1800,
      });

      const state = getLearningState();
      expect(state.totalAnalyzedTrades).toBe(1);
      expect(insights.some(i => i.type === "warning")).toBe(true);
    });

    it("should update win rate after multiple trades", () => {
      // Add winning trades
      for (let i = 0; i < 5; i++) {
        analyzeTrade({
          symbol: "BTC/USDT",
          strategy: "momentum",
          entryPrice: 50000,
          exitPrice: 51000,
          profit: 100,
          profitPercent: 2,
          duration: 3600,
        });
      }

      // Add losing trades
      for (let i = 0; i < 5; i++) {
        analyzeTrade({
          symbol: "BTC/USDT",
          strategy: "momentum",
          entryPrice: 50000,
          exitPrice: 49000,
          profit: -100,
          profitPercent: -2,
          duration: 3600,
        });
      }

      const state = getLearningState();
      expect(state.totalAnalyzedTrades).toBe(10);
      expect(state.currentWinRate).toBe(50);
    });
  });

  describe("detectMarketCondition", () => {
    it("should detect bullish market", () => {
      const condition = detectMarketCondition([
        { symbol: "BTC", price: 50000, change24h: 5 },
        { symbol: "ETH", price: 3000, change24h: 4 },
        { symbol: "ADA", price: 1, change24h: 3 },
      ]);

      expect(condition.trend).toBe("bullish");
    });

    it("should detect bearish market", () => {
      const condition = detectMarketCondition([
        { symbol: "BTC", price: 50000, change24h: -5 },
        { symbol: "ETH", price: 3000, change24h: -4 },
        { symbol: "ADA", price: 1, change24h: -3 },
      ]);

      expect(condition.trend).toBe("bearish");
    });

    it("should detect sideways market", () => {
      const condition = detectMarketCondition([
        { symbol: "BTC", price: 50000, change24h: 0.5 },
        { symbol: "ETH", price: 3000, change24h: -0.5 },
        { symbol: "ADA", price: 1, change24h: 0 },
      ]);

      expect(condition.trend).toBe("sideways");
    });

    it("should detect high volatility", () => {
      const condition = detectMarketCondition([
        { symbol: "BTC", price: 50000, change24h: 10 },
        { symbol: "ETH", price: 3000, change24h: -5 },
        { symbol: "ADA", price: 1, change24h: 8 },
      ]);

      expect(condition.volatility).toBe("high");
    });
  });

  describe("getOptimizedParameters", () => {
    it("should return default parameters", () => {
      const params = getOptimizedParameters();
      expect(params.takeProfitPercent).toBeDefined();
      expect(params.stopLossPercent).toBeDefined();
      expect(params.positionSizePercent).toBeDefined();
    });

    it("should adjust parameters for high volatility", () => {
      detectMarketCondition([
        { symbol: "BTC", price: 50000, change24h: 15 },
        { symbol: "ETH", price: 3000, change24h: -10 },
      ]);

      const params = getOptimizedParameters();
      // High volatility should increase take profit
      expect(params.takeProfitPercent).toBeGreaterThan(1.5);
    });
  });

  describe("getBestStrategy", () => {
    it("should return default strategy when no trades", () => {
      const strategy = getBestStrategy();
      expect(strategy).toBeDefined();
      expect(typeof strategy).toBe("string");
    });

    it("should rank strategies after trades", () => {
      // Add trades for different strategies
      for (let i = 0; i < 5; i++) {
        analyzeTrade({
          symbol: "BTC/USDT",
          strategy: "momentum",
          entryPrice: 50000,
          exitPrice: 51000,
          profit: 100,
          profitPercent: 2,
          duration: 3600,
        });
      }

      for (let i = 0; i < 5; i++) {
        analyzeTrade({
          symbol: "BTC/USDT",
          strategy: "rsi",
          entryPrice: 50000,
          exitPrice: 49500,
          profit: -50,
          profitPercent: -1,
          duration: 3600,
        });
      }

      const strategy = getBestStrategy();
      expect(strategy).toBe("momentum");
    });
  });

  describe("rankStrategies", () => {
    it("should return empty array when no trades", () => {
      const rankings = rankStrategies();
      expect(rankings).toEqual([]);
    });

    it("should rank strategies by performance", () => {
      // Add winning trades for momentum
      for (let i = 0; i < 5; i++) {
        analyzeTrade({
          symbol: "BTC/USDT",
          strategy: "momentum",
          entryPrice: 50000,
          exitPrice: 51500,
          profit: 150,
          profitPercent: 3,
          duration: 3600,
        });
      }

      // Add mixed trades for rsi
      for (let i = 0; i < 3; i++) {
        analyzeTrade({
          symbol: "BTC/USDT",
          strategy: "rsi",
          entryPrice: 50000,
          exitPrice: 50500,
          profit: 50,
          profitPercent: 1,
          duration: 3600,
        });
      }

      const rankings = rankStrategies();
      expect(rankings.length).toBe(2);
      expect(rankings[0].name).toBe("momentum");
      expect(rankings[0].winRate).toBe(100);
    });
  });

  describe("runLearningCycle", () => {
    it("should run learning cycle and update state", () => {
      // Add some trades first
      analyzeTrade({
        symbol: "BTC/USDT",
        strategy: "momentum",
        entryPrice: 50000,
        exitPrice: 51000,
        profit: 100,
        profitPercent: 2,
        duration: 3600,
      });

      const state = runLearningCycle();
      expect(state.insights.length).toBeGreaterThan(0);
      expect(state.lastLearningCycle).toBeDefined();
    });
  });

  describe("resetLearning", () => {
    it("should reset all learning state", () => {
      // Add trades
      analyzeTrade({
        symbol: "BTC/USDT",
        strategy: "momentum",
        entryPrice: 50000,
        exitPrice: 51000,
        profit: 100,
        profitPercent: 2,
        duration: 3600,
      });

      resetLearning();

      const state = getLearningState();
      expect(state.totalAnalyzedTrades).toBe(0);
      expect(state.patternsDiscovered).toBe(0);
      expect(state.currentWinRate).toBe(50);
    });
  });

  describe("getDiscoveredPatterns", () => {
    it("should return empty array initially", () => {
      const patterns = getDiscoveredPatterns();
      expect(patterns).toEqual([]);
    });
  });
});
