import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getAllStrategies,
  getStrategyById,
  rankStrategiesByWinRate,
  rankStrategiesByProfit,
  rankStrategiesBySharpeRatio,
  getStrategiesByRiskLevel,
  type StrategyConfig,
  type BacktestResult,
} from "../strategies";

/**
 * Strategy Management Router
 * Provides procedures for accessing and managing trading strategies
 */

export const strategiesRouter = router({
  /**
   * Get all available strategies
   */
  getAll: publicProcedure.query(async (): Promise<StrategyConfig[]> => {
    try {
      return getAllStrategies();
    } catch (error) {
      console.error("[Strategies] Failed to get all strategies:", error);
      return [];
    }
  }),

  /**
   * Get a specific strategy by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }): Promise<StrategyConfig | null> => {
      try {
        const strategy = getStrategyById(input.id);
        return strategy || null;
      } catch (error) {
        console.error(
          `[Strategies] Failed to get strategy ${input.id}:`,
          error
        );
        return null;
      }
    }),

  /**
   * Get strategies ranked by win rate
   */
  rankedByWinRate: publicProcedure.query(
    async (): Promise<StrategyConfig[]> => {
      try {
        return rankStrategiesByWinRate();
      } catch (error) {
        console.error(
          "[Strategies] Failed to rank strategies by win rate:",
          error
        );
        return [];
      }
    }
  ),

  /**
   * Get strategies ranked by profit
   */
  rankedByProfit: publicProcedure.query(
    async (): Promise<StrategyConfig[]> => {
      try {
        return rankStrategiesByProfit();
      } catch (error) {
        console.error(
          "[Strategies] Failed to rank strategies by profit:",
          error
        );
        return [];
      }
    }
  ),

  /**
   * Get strategies ranked by Sharpe ratio (risk-adjusted returns)
   */
  rankedBySharpeRatio: publicProcedure.query(
    async (): Promise<StrategyConfig[]> => {
      try {
        return rankStrategiesBySharpeRatio();
      } catch (error) {
        console.error(
          "[Strategies] Failed to rank strategies by Sharpe ratio:",
          error
        );
        return [];
      }
    }
  ),

  /**
   * Get strategies by risk level
   */
  getByRiskLevel: publicProcedure
    .input(z.object({ riskLevel: z.enum(["low", "medium", "high"]) }))
    .query(
      async ({ input }): Promise<StrategyConfig[]> => {
        try {
          return getStrategiesByRiskLevel(input.riskLevel);
        } catch (error) {
          console.error(
            `[Strategies] Failed to get strategies by risk level ${input.riskLevel}:`,
            error
          );
          return [];
        }
      }
    ),

  /**
   * Get backtest results for a strategy
   */
  getBacktestResults: publicProcedure
    .input(z.object({ strategyId: z.string() }))
    .query(async ({ input }): Promise<BacktestResult | null> => {
      try {
        const strategy = getStrategyById(input.strategyId);
        return strategy?.backtestResults || null;
      } catch (error) {
        console.error(
          `[Strategies] Failed to get backtest results for ${input.strategyId}:`,
          error
        );
        return null;
      }
    }),

  /**
   * Compare multiple strategies
   */
  compare: publicProcedure
    .input(z.object({ strategyIds: z.array(z.string()) }))
    .query(
      async ({ input }): Promise<StrategyConfig[]> => {
        try {
          const strategies = input.strategyIds
            .map((id) => getStrategyById(id))
            .filter((s) => s !== undefined) as StrategyConfig[];
          return strategies;
        } catch (error) {
          console.error("[Strategies] Failed to compare strategies:", error);
          return [];
        }
      }
    ),

  /**
   * Get strategy recommendations based on market conditions
   */
  getRecommendations: publicProcedure
    .input(
      z.object({
        marketCondition: z.enum(["trending", "ranging", "volatile"]),
        riskTolerance: z.enum(["low", "medium", "high"]),
      })
    )
    .query(
      async ({ input }): Promise<StrategyConfig[]> => {
        try {
          let strategies = getAllStrategies();

          // Filter by risk tolerance
          strategies = strategies.filter(
            (s) => s.riskLevel === input.riskTolerance
          );

          // Recommend based on market condition
          if (input.marketCondition === "trending") {
            // Trending markets favor trend-following strategies
            strategies = strategies.sort(
              (a, b) =>
                (b.backtestResults?.sharpeRatio || 0) -
                (a.backtestResults?.sharpeRatio || 0)
            );
          } else if (input.marketCondition === "ranging") {
            // Ranging markets favor mean-reversion strategies
            strategies = strategies.sort(
              (a, b) =>
                (b.backtestResults?.winRate || 0) -
                (a.backtestResults?.winRate || 0)
            );
          } else if (input.marketCondition === "volatile") {
            // Volatile markets favor high-profit strategies
            strategies = strategies.sort(
              (a, b) =>
                (b.backtestResults?.totalProfitPercent || 0) -
                (a.backtestResults?.totalProfitPercent || 0)
            );
          }

          return strategies.slice(0, 3); // Return top 3 recommendations
        } catch (error) {
          console.error(
            "[Strategies] Failed to get recommendations:",
            error
          );
          return [];
        }
      }
    ),

  /**
   * Get strategy performance summary
   */
  getPerformanceSummary: publicProcedure.query(
    async (): Promise<{
      totalStrategies: number;
      avgWinRate: number;
      avgProfit: number;
      bestPerformer: StrategyConfig | null;
      worstPerformer: StrategyConfig | null;
    }> => {
      try {
        const strategies = getAllStrategies();
        const results = strategies.map((s) => s.backtestResults);

        const avgWinRate =
          results.reduce((sum, r) => sum + (r?.winRate || 0), 0) /
          results.length;
        const avgProfit =
          results.reduce((sum, r) => sum + (r?.totalProfitPercent || 0), 0) /
          results.length;

        const bestPerformer = rankStrategiesByProfit()[0] || null;
        const worstPerformer =
          rankStrategiesByProfit()[strategies.length - 1] || null;

        return {
          totalStrategies: strategies.length,
          avgWinRate: Math.round(avgWinRate * 100) / 100,
          avgProfit: Math.round(avgProfit * 100) / 100,
          bestPerformer,
          worstPerformer,
        };
      } catch (error) {
        console.error(
          "[Strategies] Failed to get performance summary:",
          error
        );
        return {
          totalStrategies: 0,
          avgWinRate: 0,
          avgProfit: 0,
          bestPerformer: null,
          worstPerformer: null,
        };
      }
    }
  ),
});
