import { describe, it, expect } from "vitest";
import {
  getAllStrategies,
  getStrategyById,
  rankStrategiesByWinRate,
  rankStrategiesByProfit,
  rankStrategiesBySharpeRatio,
  getStrategiesByRiskLevel,
} from "../strategies";

describe("Strategies Module", () => {
  describe("getAllStrategies", () => {
    it("should return all available strategies", () => {
      const strategies = getAllStrategies();
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies.length).toBe(5); // We have 5 strategies
    });

    it("should return strategies with required properties", () => {
      const strategies = getAllStrategies();
      strategies.forEach((strategy) => {
        expect(strategy).toHaveProperty("id");
        expect(strategy).toHaveProperty("name");
        expect(strategy).toHaveProperty("description");
        expect(strategy).toHaveProperty("backtestResults");
        expect(strategy).toHaveProperty("riskLevel");
      });
    });
  });

  describe("getStrategyById", () => {
    it("should return a strategy by ID", () => {
      const strategy = getStrategyById("nfi");
      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe("NostalgiaForInfinity");
    });

    it("should return undefined for non-existent strategy", () => {
      const strategy = getStrategyById("non-existent");
      expect(strategy).toBeUndefined();
    });
  });

  describe("rankStrategiesByWinRate", () => {
    it("should rank strategies by win rate in descending order", () => {
      const ranked = rankStrategiesByWinRate();
      expect(ranked.length).toBeGreaterThan(0);

      for (let i = 0; i < ranked.length - 1; i++) {
        const current = ranked[i].backtestResults?.winRate || 0;
        const next = ranked[i + 1].backtestResults?.winRate || 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe("rankStrategiesByProfit", () => {
    it("should rank strategies by profit in descending order", () => {
      const ranked = rankStrategiesByProfit();
      expect(ranked.length).toBeGreaterThan(0);

      for (let i = 0; i < ranked.length - 1; i++) {
        const current = ranked[i].backtestResults?.totalProfitPercent || 0;
        const next = ranked[i + 1].backtestResults?.totalProfitPercent || 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it("should have RSI+MACD as top performer by profit", () => {
      const ranked = rankStrategiesByProfit();
      expect(ranked[0].id).toBe("rsi_macd_bb");
      expect(ranked[0].backtestResults?.totalProfitPercent).toBe(870);
    });
  });

  describe("rankStrategiesBySharpeRatio", () => {
    it("should rank strategies by Sharpe ratio in descending order", () => {
      const ranked = rankStrategiesBySharpeRatio();
      expect(ranked.length).toBeGreaterThan(0);

      for (let i = 0; i < ranked.length - 1; i++) {
        const current = ranked[i].backtestResults?.sharpeRatio || 0;
        const next = ranked[i + 1].backtestResults?.sharpeRatio || 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe("getStrategiesByRiskLevel", () => {
    it("should return only low-risk strategies", () => {
      const lowRisk = getStrategiesByRiskLevel("low");
      expect(lowRisk.length).toBeGreaterThan(0);
      lowRisk.forEach((strategy) => {
        expect(strategy.riskLevel).toBe("low");
      });
    });

    it("should return only medium-risk strategies", () => {
      const mediumRisk = getStrategiesByRiskLevel("medium");
      expect(mediumRisk.length).toBeGreaterThan(0);
      mediumRisk.forEach((strategy) => {
        expect(strategy.riskLevel).toBe("medium");
      });
    });

    it("should return only high-risk strategies", () => {
      const highRisk = getStrategiesByRiskLevel("high");
      expect(highRisk.length).toBeGreaterThan(0);
      highRisk.forEach((strategy) => {
        expect(strategy.riskLevel).toBe("high");
      });
    });
  });

  describe("Strategy Backtest Results", () => {
    it("should have valid backtest results for all strategies", () => {
      const strategies = getAllStrategies();
      strategies.forEach((strategy) => {
        const results = strategy.backtestResults;
        expect(results).toBeDefined();
        expect(results?.totalProfit).toBeGreaterThan(0);
        expect(results?.winRate).toBeGreaterThan(0);
        expect(results?.winRate).toBeLessThanOrEqual(100);
        expect(results?.maxDrawdown).toBeGreaterThan(0);
        expect(results?.totalTrades).toBeGreaterThan(0);
      });
    });

    it("should have consistent win/loss trade counts", () => {
      const strategies = getAllStrategies();
      strategies.forEach((strategy) => {
        const results = strategy.backtestResults;
        const totalTrades =
          (results?.winningTrades || 0) + (results?.losingTrades || 0);
        expect(totalTrades).toBe(results?.totalTrades);
      });
    });
  });

  describe("Strategy Indicators", () => {
    it("should have indicators defined for all strategies", () => {
      const strategies = getAllStrategies();
      strategies.forEach((strategy) => {
        expect(strategy.indicators.length).toBeGreaterThan(0);
        expect(Array.isArray(strategy.indicators)).toBe(true);
      });
    });
  });

  describe("Strategy Parameters", () => {
    it("should have parameters defined for all strategies", () => {
      const strategies = getAllStrategies();
      strategies.forEach((strategy) => {
        expect(Object.keys(strategy.parameters).length).toBeGreaterThan(0);
      });
    });

    it("NFI should have standard parameters", () => {
      const nfi = getStrategyById("nfi");
      expect(nfi?.parameters).toHaveProperty("rsi_period");
      expect(nfi?.parameters).toHaveProperty("macd_fast");
      expect(nfi?.parameters).toHaveProperty("max_open_trades");
    });
  });
});
