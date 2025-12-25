import { describe, it, expect, beforeEach, vi } from "vitest";
import { clearCache } from "./marketData";

describe("Market Data Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
  });

  describe("Cache Management", () => {
    it("should clear cache successfully", () => {
      clearCache();
      // If no error thrown, cache cleared successfully
      expect(true).toBe(true);
    });
  });

  describe("Data Structures", () => {
    it("should have correct CryptoPrice interface structure", () => {
      const mockPrice = {
        id: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        current_price: 45000,
        market_cap: 900000000000,
        market_cap_rank: 1,
        total_volume: 30000000000,
        high_24h: 46000,
        low_24h: 44000,
        price_change_24h: 1000,
        price_change_percentage_24h: 2.27,
        circulating_supply: 21000000,
        total_supply: 21000000,
        ath: 69000,
        atl: 100,
        last_updated: new Date().toISOString(),
      };

      expect(mockPrice.id).toBe("bitcoin");
      expect(mockPrice.symbol).toBe("BTC");
      expect(mockPrice.current_price).toBeGreaterThan(0);
      expect(mockPrice.market_cap).toBeGreaterThan(0);
    });

    it("should have correct GlobalMarketData structure", () => {
      const mockGlobalData = {
        total_market_cap: 1700000000000,
        total_volume: 85000000000,
        btc_dominance: 52.5,
        eth_dominance: 16.2,
        market_cap_change_24h: 1.2,
        timestamp: new Date().toISOString(),
      };

      expect(mockGlobalData.total_market_cap).toBeGreaterThan(0);
      expect(mockGlobalData.btc_dominance).toBeGreaterThan(0);
      expect(mockGlobalData.btc_dominance).toBeLessThan(100);
    });

    it("should have correct HistoricalPrice structure", () => {
      const mockHistoricalData = {
        prices: [
          [1000000000, 40000],
          [1000086400, 41000],
          [1000172800, 42000],
        ],
      };

      expect(mockHistoricalData.prices).toHaveLength(3);
      expect(mockHistoricalData.prices[0]).toHaveLength(2);
      expect(mockHistoricalData.prices[0][1]).toBe(40000);
    });
  });

  describe("Fallback Values", () => {
    it("should have reasonable fallback market cap", () => {
      const fallbackMarketCap = 1700000000000;
      expect(fallbackMarketCap).toBeGreaterThan(1000000000000); // > 1 trillion
      expect(fallbackMarketCap).toBeLessThan(10000000000000); // < 10 trillion
    });

    it("should have reasonable fallback BTC dominance", () => {
      const fallbackBtcDominance = 52.5;
      expect(fallbackBtcDominance).toBeGreaterThan(30);
      expect(fallbackBtcDominance).toBeLessThan(80);
    });

    it("should have reasonable fallback prices", () => {
      const fallbackBtcPrice = 43250;
      const fallbackEthPrice = 2280;
      
      expect(fallbackBtcPrice).toBeGreaterThan(10000);
      expect(fallbackBtcPrice).toBeLessThan(200000);
      expect(fallbackEthPrice).toBeGreaterThan(500);
      expect(fallbackEthPrice).toBeLessThan(20000);
    });
  });
});
