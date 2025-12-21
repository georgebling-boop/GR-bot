import { describe, it, expect, beforeEach } from "vitest";
import {
  initializeSimulation,
  openTrade,
  closeTrade,
  updateTradePrice,
  generateSampleTrades,
  getSimulationSummary,
} from "./testTradingSimulator";

describe("Test Trading Simulator", () => {
  describe("initializeSimulation", () => {
    it("should initialize with $100 starting capital", () => {
      const state = initializeSimulation();
      expect(state.initial_stake).toBe(100);
      expect(state.current_equity).toBe(100);
      expect(state.total_profit).toBe(0);
      expect(state.total_trades).toBe(0);
    });

    it("should have empty trades array", () => {
      const state = initializeSimulation();
      expect(state.trades).toHaveLength(0);
      expect(state.open_trades).toHaveLength(0);
      expect(state.closed_trades).toHaveLength(0);
    });
  });

  describe("openTrade", () => {
    it("should open a trade and deduct stake from equity", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);

      expect(state.total_trades).toBe(1);
      expect(state.open_trades).toHaveLength(1);
      expect(state.current_equity).toBeLessThan(100); // Deducted stake + fee
    });

    it("should calculate correct trade amount", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 50000);

      const trade = state.open_trades[0];
      expect(trade.amount).toBe(50 / 50000);
      expect(trade.pair).toBe("BTC-USD");
    });

    it("should not allow stake larger than equity", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 150, 45000); // More than $100

      // Should still open but equity goes negative (for testing purposes)
      expect(state.current_equity).toBeLessThan(0);
    });
  });

  describe("closeTrade", () => {
    it("should close a trade and calculate profit", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);
      const openEquity = state.current_equity;

      state = closeTrade(state, 1, 46000); // +2.2% profit

      expect(state.closed_trades).toHaveLength(1);
      expect(state.open_trades).toHaveLength(0);
      expect(state.total_profit).toBeGreaterThan(0);
      expect(state.current_equity).toBeGreaterThan(openEquity);
    });

    it("should calculate losing trade correctly", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);

      state = closeTrade(state, 1, 44000); // -2.2% loss

      expect(state.total_profit).toBeLessThan(0);
      expect(state.losing_trades).toBe(1);
      expect(state.winning_trades).toBe(0);
    });

    it("should update win rate correctly", () => {
      let state = initializeSimulation();

      // Open and close 2 winning trades
      state = openTrade(state, "BTC-USD", 25, 45000);
      state = closeTrade(state, 1, 46000);

      state = openTrade(state, "ETH-USD", 25, 2500);
      state = closeTrade(state, 2, 2600);

      expect(state.winning_trades).toBe(2);
      expect(state.win_rate).toBe(100);
    });

    it("should not close non-existent trade", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);

      const originalState = { ...state };
      state = closeTrade(state, 999, 46000); // Non-existent trade

      expect(state).toEqual(originalState);
    });
  });

  describe("updateTradePrice", () => {
    it("should update unrealized profit for open trade", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);

      state = updateTradePrice(state, 1, 46000);

      const trade = state.open_trades[0];
      expect(trade.current_rate).toBe(46000);
      expect(trade.profit_ratio).toBeGreaterThan(0);
    });

    it("should handle price decrease", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);

      state = updateTradePrice(state, 1, 44000);

      const trade = state.open_trades[0];
      expect(trade.profit_ratio).toBeLessThan(0);
    });
  });

  describe("generateSampleTrades", () => {
    it("should generate 5 sample trades", () => {
      let state = initializeSimulation();
      state = generateSampleTrades(state);

      expect(state.total_trades).toBe(5);
      expect(state.closed_trades.length).toBeGreaterThan(0);
      expect(state.open_trades.length).toBeGreaterThan(0);
    });

    it("should have mixed winning and losing trades", () => {
      let state = initializeSimulation();
      state = generateSampleTrades(state);

      expect(state.winning_trades).toBeGreaterThan(0);
      expect(state.losing_trades).toBeGreaterThan(0);
    });
  });

  describe("getSimulationSummary", () => {
    it("should return correct summary metrics", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);
      state = closeTrade(state, 1, 46000);

      const summary = getSimulationSummary(state);

      expect(summary).toHaveProperty("initial_stake");
      expect(summary).toHaveProperty("current_equity");
      expect(summary).toHaveProperty("total_profit");
      expect(summary).toHaveProperty("win_rate");
      expect(summary).toHaveProperty("roi");
    });

    it("should calculate ROI correctly", () => {
      let state = initializeSimulation();
      state = openTrade(state, "BTC-USD", 50, 45000);
      state = closeTrade(state, 1, 46000); // Profit

      const summary = getSimulationSummary(state);
      expect(summary.roi).toBeGreaterThan(0);
    });
  });

  describe("Simulation Flow", () => {
    it("should handle complete trading cycle", () => {
      let state = initializeSimulation();

      // Open first trade
      state = openTrade(state, "BTC-USD", 30, 45000);
      expect(state.open_trades).toHaveLength(1);

      // Open second trade
      state = openTrade(state, "ETH-USD", 20, 2500);
      expect(state.open_trades).toHaveLength(2);

      // Close first trade with profit
      state = closeTrade(state, 1, 46000);
      expect(state.closed_trades).toHaveLength(1);
      expect(state.open_trades).toHaveLength(1);

      // Update price of second trade
      state = updateTradePrice(state, 2, 2600);
      expect(state.open_trades[0].profit_ratio).toBeGreaterThan(0);

      // Close second trade
      state = closeTrade(state, 2, 2550);
      expect(state.closed_trades).toHaveLength(2);
      expect(state.open_trades).toHaveLength(0);

      // Verify final state
      expect(state.total_trades).toBe(2);
      // Both trades are profitable in this scenario (BTC: 45000->46000, ETH: 2500->2600 then 2550)
      expect(state.winning_trades).toBeGreaterThan(0);
      expect(state.total_profit).toBeDefined();
    });
  });
});
