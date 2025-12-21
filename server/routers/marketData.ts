import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  fetchCryptoPrices,
  fetchTrendingCryptos,
  fetchGlobalMarketData,
  fetchHistoricalPrices,
} from "../marketData";

/**
 * Market Data Router
 * Provides real-time cryptocurrency prices and market data from CoinGecko
 */

export const marketDataRouter = router({
  /**
   * Get current prices for multiple cryptocurrencies
   */
  getPrices: publicProcedure
    .input(
      z.object({
        ids: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const prices = await fetchCryptoPrices(input.ids);
      return {
        success: true,
        prices,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Get trending cryptocurrencies
   */
  getTrending: publicProcedure.query(async () => {
    const trending = await fetchTrendingCryptos();
    return {
      success: true,
      trending,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get global market data
   */
  getGlobalMarketData: publicProcedure.query(async () => {
    const globalData = await fetchGlobalMarketData();
    return {
      success: true,
      data: globalData,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get historical prices for a cryptocurrency
   */
  getHistoricalPrices: publicProcedure
    .input(
      z.object({
        cryptoId: z.string(),
        days: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const prices = await fetchHistoricalPrices(input.cryptoId, input.days);
      return {
        success: true,
        prices,
        cryptoId: input.cryptoId,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Get price for a specific cryptocurrency (for opening trades)
   */
  getCurrentPrice: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      })
    )
    .query(async ({ input }) => {
      const symbolMap: { [key: string]: string } = {
        BTC: "bitcoin",
        ETH: "ethereum",
        ADA: "cardano",
        SOL: "solana",
        XRP: "ripple",
        DOGE: "dogecoin",
        MATIC: "matic-network",
        LINK: "chainlink",
        DOT: "polkadot",
        UNI: "uniswap",
      };

      const cryptoId = symbolMap[input.symbol.toUpperCase()] || input.symbol.toLowerCase();
      const prices = await fetchCryptoPrices([cryptoId]);

      if (prices.length === 0) {
        return {
          success: false,
          error: `Could not find price for ${input.symbol}`,
        };
      }

      return {
        success: true,
        symbol: input.symbol.toUpperCase(),
        price: prices[0].current_price,
        change24h: prices[0].price_change_percentage_24h,
        high24h: prices[0].high_24h,
        low24h: prices[0].low_24h,
        timestamp: new Date().toISOString(),
      };
    }),
});
