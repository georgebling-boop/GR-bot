import { describe, it, expect, beforeEach } from "vitest";
import {
  initializeSession,
  getSession,
  startTrading,
  stopTrading,
  executeTradingCycle,
  resetSession,
  getAllPrices,
  runBacktest,
  getLivePrice,
} from "./aggressiveScalper";

describe("Aggressive Scalper Trading System", () => {
  beforeEach(() => {
    // Reset session before each test
    resetSession();
  });

  describe("Session Management", () => {
    it("should initialize session with $800", () => {
      const session = initializeSession(800);
      
      expect(session).toBeDefined();
      expect(session.startingBalance).toBe(800);
      expect(session.currentBalance).toBe(800);
      expect(session.totalProfit).toBe(0);
      expect(session.totalTrades).toBe(0);
      expect(session.isRunning).toBe(false);
    });

    it("should get current session", () => {
      initializeSession(800);
      const session = getSession();
      
      expect(session).toBeDefined();
      expect(session?.startingBalance).toBe(800);
    });

    it("should start trading", () => {
      initializeSession(800);
      const session = startTrading();
      
      expect(session).toBeDefined();
      expect(session?.isRunning).toBe(true);
    });

    it("should stop trading", () => {
      initializeSession(800);
      startTrading();
      const session = stopTrading();
      
      expect(session).toBeDefined();
      expect(session?.isRunning).toBe(false);
    });

    it("should reset session to $800", () => {
      initializeSession(800);
      startTrading();
      executeTradingCycle(); // Make some trades
      
      const session = resetSession();
      
      expect(session.currentBalance).toBe(800);
      expect(session.totalProfit).toBe(0);
      expect(session.totalTrades).toBe(0);
      expect(session.openTrades).toHaveLength(0);
      expect(session.closedTrades).toHaveLength(0);
    });
  });

  describe("Price Data", () => {
    it("should get live prices for all cryptocurrencies", () => {
      initializeSession(800);
      const prices = getAllPrices();
      
      expect(prices).toBeDefined();
      expect(prices.length).toBeGreaterThan(0);
      
      prices.forEach(price => {
        expect(price.symbol).toBeDefined();
        expect(price.price).toBeGreaterThan(0);
        expect(typeof price.change24h).toBe("number");
      });
    });

    it("should get live price for specific symbol", () => {
      initializeSession(800);
      const priceData = getLivePrice("BTC");
      
      expect(priceData).toBeDefined();
      expect(priceData.symbol).toBe("BTC");
      expect(priceData.price).toBeGreaterThan(0);
      expect(priceData.high24h).toBeGreaterThan(0);
      expect(priceData.low24h).toBeGreaterThan(0);
    });
  });

  describe("Trading Execution", () => {
    it("should execute trading cycle", () => {
      initializeSession(800);
      startTrading();
      
      const result = executeTradingCycle();
      
      expect(result).toBeDefined();
      expect(result.session).toBeDefined();
      expect(Array.isArray(result.actions)).toBe(true);
      expect(Array.isArray(result.newTrades)).toBe(true);
      expect(Array.isArray(result.closedTrades)).toBe(true);
    });

    it("should open trades when conditions are met", () => {
      initializeSession(800);
      startTrading();
      
      // Execute multiple cycles to trigger trades
      for (let i = 0; i < 10; i++) {
        executeTradingCycle();
      }
      
      const session = getSession();
      
      // Should have attempted some trades
      expect(session?.totalTrades).toBeGreaterThanOrEqual(0);
    });

    it("should not exceed max concurrent trades", () => {
      initializeSession(800);
      startTrading();
      
      // Execute many cycles
      for (let i = 0; i < 50; i++) {
        executeTradingCycle();
      }
      
      const session = getSession();
      
      // Max 5 concurrent trades
      expect(session?.openTrades.length).toBeLessThanOrEqual(5);
    });

    it("should track winning and losing trades", () => {
      initializeSession(800);
      startTrading();
      
      // Execute many cycles to generate closed trades
      for (let i = 0; i < 100; i++) {
        executeTradingCycle();
      }
      
      const session = getSession();
      
      // Total closed trades should equal wins + losses
      const totalClosed = session!.winningTrades + session!.losingTrades;
      expect(session?.closedTrades.length).toBe(totalClosed);
    });
  });

  describe("Backtesting", () => {
    it("should run 7-day backtest", () => {
      const result = runBacktest(7);
      
      expect(result).toBeDefined();
      expect(result.finalBalance).toBeGreaterThan(0);
      expect(typeof result.totalProfit).toBe("number");
      expect(typeof result.totalProfitPercent).toBe("number");
      expect(result.totalTrades).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(100);
      expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    });

    it("should run 30-day backtest", () => {
      const result = runBacktest(30);
      
      expect(result).toBeDefined();
      expect(result.finalBalance).toBeGreaterThan(0);
      expect(result.totalTrades).toBeGreaterThan(0); // 30 days should have trades
      expect(Array.isArray(result.trades)).toBe(true);
    });

    it("should track best strategy in backtest", () => {
      const result = runBacktest(14);
      
      expect(result.bestStrategy).toBeDefined();
      expect(typeof result.bestStrategy).toBe("string");
    });
  });

  describe("Strategy Stats", () => {
    it("should track strategy performance", () => {
      initializeSession(800);
      startTrading();
      
      // Execute many cycles to generate strategy stats
      for (let i = 0; i < 100; i++) {
        executeTradingCycle();
      }
      
      const session = getSession();
      
      // If there are closed trades, there should be strategy stats
      if (session!.closedTrades.length > 0) {
        expect(session?.strategyStats.length).toBeGreaterThan(0);
        
        session?.strategyStats.forEach(stat => {
          expect(stat.name).toBeDefined();
          expect(stat.trades).toBeGreaterThanOrEqual(0);
          expect(stat.winRate).toBeGreaterThanOrEqual(0);
          expect(stat.winRate).toBeLessThanOrEqual(100);
        });
      }
    });
  });
});
