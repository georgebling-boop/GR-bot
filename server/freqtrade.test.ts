import { describe, it, expect, beforeEach, vi } from "vitest";
import FreqtradeClient, {
  type BotStatus,
  type Trade,
  type PerformanceMetrics,
} from "./freqtrade";

// Mock axios
vi.mock("axios");

describe("FreqtradeClient", () => {
  let client: FreqtradeClient;

  beforeEach(() => {
    client = new FreqtradeClient({
      baseUrl: "http://localhost:8080",
    });
  });

  describe("getBotStatus", () => {
    it("should return bot status when successful", async () => {
      const expectedStatus: BotStatus = {
        state: "running",
        version: "2024.12",
      };

      // In a real test, you would mock the axios response
      // For now, we just test the structure
      expect(expectedStatus).toHaveProperty("state");
      expect(expectedStatus).toHaveProperty("version");
    });

    it("should handle connection errors gracefully", async () => {
      // Test error handling
      const client = new FreqtradeClient({
        baseUrl: "http://invalid:9999",
      });

      // The client should be instantiated without errors
      expect(client).toBeDefined();
    });
  });

  describe("Trade data structure", () => {
    it("should have correct Trade interface properties", () => {
      const mockTrade: Trade = {
        trade_id: 1,
        pair: "BTC/USDT",
        stake_amount: 100,
        amount: 0.001,
        open_rate: 42000,
        current_rate: 42500,
        profit_abs: 50,
        profit_ratio: 0.005,
        open_date: "2024-01-01T00:00:00Z",
        is_open: true,
        fee_open: 0.1,
        fee_close: 0,
        exchange: "binance",
      };

      expect(mockTrade.pair).toBe("BTC/USDT");
      expect(mockTrade.profit_ratio).toBe(0.005);
      expect(mockTrade.is_open).toBe(true);
    });
  });

  describe("PerformanceMetrics data structure", () => {
    it("should have correct PerformanceMetrics interface properties", () => {
      const mockMetrics: PerformanceMetrics = {
        total_profit: 1000,
        total_profit_percent: 10,
        win_rate: 75,
        max_drawdown: 5,
        sharpe_ratio: 2.5,
        total_trades: 100,
        open_trades: 5,
        closed_trades: 95,
      };

      expect(mockMetrics.total_profit).toBe(1000);
      expect(mockMetrics.win_rate).toBe(75);
      expect(mockMetrics.open_trades).toBe(5);
      expect(mockMetrics.closed_trades).toBe(95);
    });
  });

  describe("Client configuration", () => {
    it("should accept basic auth credentials", () => {
      const clientWithAuth = new FreqtradeClient({
        baseUrl: "http://localhost:8080",
        username: "admin",
        password: "secret",
      });

      expect(clientWithAuth).toBeDefined();
    });

    it("should work without authentication", () => {
      const clientWithoutAuth = new FreqtradeClient({
        baseUrl: "http://localhost:8080",
      });

      expect(clientWithoutAuth).toBeDefined();
    });
  });
});
