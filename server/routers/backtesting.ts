import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  runBacktest,
  getBacktestHistory,
  compareStrategies,
  getBacktestStats,
} from "../backtesting";

export const backtestingRouter = router({
  /**
   * Run a backtest
   */
  run: publicProcedure
    .input(z.object({
      strategy: z.string(),
      symbol: z.string(),
      days: z.number().min(1).max(365).default(30),
      initialBalance: z.number().min(100).max(1000000).default(800),
      positionSizePercent: z.number().min(1).max(100).default(5),
      takeProfitPercent: z.number().min(0.1).max(50).default(2),
      stopLossPercent: z.number().min(0.1).max(50).default(1.5),
    }))
    .mutation(async ({ input }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
      
      const result = await runBacktest({
        strategy: input.strategy,
        symbol: input.symbol,
        startDate,
        endDate,
        initialBalance: input.initialBalance,
        positionSizePercent: input.positionSizePercent,
        takeProfitPercent: input.takeProfitPercent,
        stopLossPercent: input.stopLossPercent,
      });
      
      return {
        success: true,
        result: {
          summary: result.summary,
          tradesCount: result.trades.length,
          equityCurvePoints: result.equityCurve.length,
          createdAt: result.createdAt,
        },
      };
    }),

  /**
   * Get backtest history
   */
  getHistory: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ input }) => {
      const results = await getBacktestHistory(input?.limit || 10);
      return {
        results: results.map(r => ({
          id: r.id,
          strategy: r.config.strategy,
          symbol: r.config.symbol,
          summary: r.summary,
          createdAt: r.createdAt,
        })),
      };
    }),

  /**
   * Compare all strategies
   */
  compareStrategies: publicProcedure
    .input(z.object({
      symbol: z.string().default("BTC"),
      days: z.number().min(1).max(365).default(30),
      initialBalance: z.number().min(100).max(1000000).default(800),
    }))
    .mutation(async ({ input }) => {
      const results = await compareStrategies(input.symbol, input.days, input.initialBalance);
      
      return {
        success: true,
        comparison: results.map(r => ({
          strategy: r.strategy,
          winRate: r.result.summary.winRate,
          totalProfit: r.result.summary.totalProfit,
          totalProfitPercent: r.result.summary.totalProfitPercent,
          totalTrades: r.result.summary.totalTrades,
          maxDrawdown: r.result.summary.maxDrawdown,
          sharpeRatio: r.result.summary.sharpeRatio,
          finalBalance: r.result.summary.finalBalance,
        })),
      };
    }),

  /**
   * Get backtest statistics
   */
  getStats: publicProcedure.query(async () => {
    return getBacktestStats();
  }),
});
