import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchCryptoPrices,
  fetchTrendingCryptos,
  fetchGlobalMarketData,
  fetchHistoricalPrices,
} from "./marketData";

// Mock fetch
global.fetch = vi.fn();

describe("Market Data Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchCryptoPrices", () => {
    it("should fetch cryptocurrency prices successfully", async () => {
      const mockResponse = [
        {
          id: "bitcoin",
          symbol: "btc",
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
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const prices = await fetchCryptoPrices(["bitcoin"]);

      expect(prices).toHaveLength(1);
      expect(prices[0].id).toBe("bitcoin");
      expect(prices[0].current_price).toBe(45000);
      expect(prices[0].symbol).toBe("BTC");
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      const prices = await fetchCryptoPrices(["invalid"]);

      expect(prices).toEqual([]);
    });
  });

  describe("fetchTrendingCryptos", () => {
    it("should fetch trending cryptocurrencies", async () => {
      const mockResponse = {
        coins: [
          {
            item: {
              id: "bitcoin",
              symbol: "btc",
              name: "Bitcoin",
              market_cap_rank: 1,
              data: {
                price: 45000,
                market_cap: 900000000000,
                price_change_24h: { usd: 1000 },
              },
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const trending = await fetchTrendingCryptos();

      expect(trending).toHaveLength(1);
      expect(trending[0].id).toBe("bitcoin");
      expect(trending[0].current_price).toBe(45000);
    });
  });

  describe("fetchGlobalMarketData", () => {
    it("should fetch global market data", async () => {
      const mockResponse = {
        data: {
          total_market_cap: { usd: 2000000000000 },
          total_volume: { usd: 100000000000 },
          btc_dominance: 45.5,
          eth_dominance: 20.3,
          market_cap_change_percentage_24h_usd: 2.5,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const globalData = await fetchGlobalMarketData();

      expect(globalData).toBeDefined();
      expect(globalData.total_market_cap).toBe(2000000000000);
      expect(globalData.btc_dominance).toBe(45.5);
    });
  });

  describe("fetchHistoricalPrices", () => {
    it("should fetch historical price data", async () => {
      const mockResponse = {
        prices: [
          [1000000000, 40000],
          [1000086400, 41000],
          [1000172800, 42000],
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const prices = await fetchHistoricalPrices("bitcoin", 30);

      expect(prices).toHaveLength(3);
      expect(prices[0].price).toBe(40000);
      expect(prices[1].price).toBe(41000);
    });
  });
});
