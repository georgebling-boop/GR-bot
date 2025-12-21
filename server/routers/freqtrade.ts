import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getFreqtradeClient,
  type PerformanceMetrics,
  type Trade,
  type BotStatus,
  type DailyStats,
} from "../freqtrade";

/**
 * Freqtrade tRPC Router
 * Provides procedures for fetching trading bot data
 * Supports polling for periodic updates
 */

export const freqtradeRouter = router({
  /**
   * Get bot status (health check)
   * Can be polled every 5-10 seconds for real-time status
   */
  status: publicProcedure.query(async (): Promise<BotStatus> => {
    const client = getFreqtradeClient();
    try {
      return await client.getBotStatus();
    } catch (error) {
      console.error("[tRPC] Failed to get bot status:", error);
      return {
        state: "disconnected",
        version: "unknown",
      };
    }
  }),

  /**
   * Get all open trades
   * Can be polled every 5 seconds for real-time trade updates
   */
  openTrades: publicProcedure.query(async (): Promise<Trade[]> => {
    const client = getFreqtradeClient();
    try {
      return await client.getOpenTrades();
    } catch (error) {
      console.error("[tRPC] Failed to get open trades:", error);
      return [];
    }
  }),

  /**
   * Get a specific trade by ID
   */
  trade: publicProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ input }): Promise<Trade | null> => {
      const client = getFreqtradeClient();
      try {
        return await client.getTrade(input.tradeId);
      } catch (error) {
        console.error("[tRPC] Failed to get trade:", error);
        return null;
      }
    }),

  /**
   * Get trade history (closed trades)
   * Supports pagination with limit and offset
   */
  history: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(
      async ({
        input,
      }): Promise<{ trades: Trade[]; total: number }> => {
        const client = getFreqtradeClient();
        try {
          return await client.getTradeHistory(input.limit, input.offset);
        } catch (error) {
          console.error("[tRPC] Failed to get trade history:", error);
          return { trades: [], total: 0 };
        }
      }
    ),

  /**
   * Get performance metrics
   * Can be polled every 10-30 seconds for dashboard updates
   */
  performance: publicProcedure.query(
    async (): Promise<PerformanceMetrics> => {
      const client = getFreqtradeClient();
      try {
        return await client.getPerformance();
      } catch (error) {
        console.error("[tRPC] Failed to get performance:", error);
        return {
          total_profit: 0,
          total_profit_percent: 0,
          win_rate: 0,
          max_drawdown: 0,
          sharpe_ratio: 0,
          total_trades: 0,
          open_trades: 0,
          closed_trades: 0,
        };
      }
    }
  ),

  /**
   * Get daily statistics for charting
   */
  dailyStats: publicProcedure.query(async (): Promise<DailyStats[]> => {
    const client = getFreqtradeClient();
    try {
      return await client.getDailyStats();
    } catch (error) {
      console.error("[tRPC] Failed to get daily stats:", error);
      return [];
    }
  }),

  /**
   * Get strategy configuration
   */
  strategy: publicProcedure.query(
    async (): Promise<Record<string, unknown>> => {
      const client = getFreqtradeClient();
      try {
        return await client.getStrategy();
      } catch (error) {
        console.error("[tRPC] Failed to get strategy:", error);
        return {};
      }
    }
  ),

  /**
   * Get bot configuration
   */
  config: publicProcedure.query(
    async (): Promise<Record<string, unknown>> => {
      const client = getFreqtradeClient();
      try {
        return await client.getConfig();
      } catch (error) {
        console.error("[tRPC] Failed to get config:", error);
        return {};
      }
    }
  ),

  /**
   * Check if bot is healthy and reachable
   */
  isHealthy: publicProcedure.query(async (): Promise<boolean> => {
    const client = getFreqtradeClient();
    try {
      return await client.isHealthy();
    } catch (error) {
      console.error("[tRPC] Failed to check health:", error);
      return false;
    }
  }),

  /**
   * Get all dashboard data in a single request
   * Useful for initial page load to reduce number of requests
   */
  dashboard: publicProcedure.query(
    async (): Promise<{
      status: BotStatus;
      openTrades: Trade[];
      performance: PerformanceMetrics;
      dailyStats: DailyStats[];
      isHealthy: boolean;
    }> => {
      const client = getFreqtradeClient();
      try {
        const [status, openTrades, performance, dailyStats, isHealthy] =
          await Promise.all([
            client.getBotStatus(),
            client.getOpenTrades(),
            client.getPerformance(),
            client.getDailyStats(),
            client.isHealthy(),
          ]);

        return {
          status,
          openTrades,
          performance,
          dailyStats,
          isHealthy,
        };
      } catch (error) {
        console.error("[tRPC] Failed to get dashboard data:", error);
        return {
          status: { state: "disconnected", version: "unknown" },
          openTrades: [],
          performance: {
            total_profit: 0,
            total_profit_percent: 0,
            win_rate: 0,
            max_drawdown: 0,
            sharpe_ratio: 0,
            total_trades: 0,
            open_trades: 0,
            closed_trades: 0,
          },
          dailyStats: [],
          isHealthy: false,
        };
      }
    }
  ),
});
