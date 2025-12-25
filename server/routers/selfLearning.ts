import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getLearningState,
  runLearningCycle,
  analyzeTrade,
  detectMarketCondition,
  getOptimizedParameters,
  getBestStrategy,
  rankStrategies,
  getDiscoveredPatterns,
  resetLearning,
} from "../selfLearning";

export const selfLearningRouter = router({
  // Get current learning state
  getState: publicProcedure.query(() => {
    return getLearningState();
  }),

  // Run a learning cycle
  runCycle: publicProcedure.mutation(() => {
    return runLearningCycle();
  }),

  // Analyze a completed trade
  analyzeTrade: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        strategy: z.string(),
        entryPrice: z.number(),
        exitPrice: z.number(),
        profit: z.number(),
        profitPercent: z.number(),
        duration: z.number(),
        indicators: z.record(z.string(), z.number()).optional(),
      })
    )
    .mutation(({ input }) => {
      return analyzeTrade(input);
    }),

  // Detect market conditions
  detectMarket: publicProcedure
    .input(
      z.array(
        z.object({
          symbol: z.string(),
          price: z.number(),
          change24h: z.number(),
        })
      )
    )
    .mutation(({ input }) => {
      return detectMarketCondition(input);
    }),

  // Get optimized parameters
  getOptimizedParams: publicProcedure.query(() => {
    return getOptimizedParameters();
  }),

  // Get best strategy for current conditions
  getBestStrategy: publicProcedure.query(() => {
    return {
      strategy: getBestStrategy(),
      rankings: rankStrategies(),
    };
  }),

  // Get discovered patterns
  getPatterns: publicProcedure.query(() => {
    return getDiscoveredPatterns();
  }),

  // Reset learning
  reset: publicProcedure.mutation(() => {
    resetLearning();
    return { success: true };
  }),
});
