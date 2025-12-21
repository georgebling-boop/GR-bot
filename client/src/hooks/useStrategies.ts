import { trpc } from "@/lib/trpc";

/**
 * Custom hook for fetching and managing trading strategies
 */

export function useStrategies() {
  const utils = trpc.useUtils();

  // Fetch all strategies
  const allStrategiesQuery = trpc.strategies.getAll.useQuery();

  // Fetch strategies ranked by win rate
  const rankedByWinRateQuery = trpc.strategies.rankedByWinRate.useQuery();

  // Fetch strategies ranked by profit
  const rankedByProfitQuery = trpc.strategies.rankedByProfit.useQuery();

  // Fetch strategies ranked by Sharpe ratio
  const rankedBySharpeRatioQuery =
    trpc.strategies.rankedBySharpeRatio.useQuery();

  // Fetch performance summary
  const performanceSummaryQuery =
    trpc.strategies.getPerformanceSummary.useQuery();

  // Refresh all strategy data
  const refresh = async () => {
    await Promise.all([
      utils.strategies.getAll.invalidate(),
      utils.strategies.rankedByWinRate.invalidate(),
      utils.strategies.rankedByProfit.invalidate(),
      utils.strategies.rankedBySharpeRatio.invalidate(),
      utils.strategies.getPerformanceSummary.invalidate(),
    ]);
  };

  return {
    // All strategies
    allStrategies: allStrategiesQuery.data || [],
    allStrategiesLoading: allStrategiesQuery.isLoading,
    allStrategiesError: allStrategiesQuery.error,

    // Ranked strategies
    rankedByWinRate: rankedByWinRateQuery.data || [],
    rankedByProfit: rankedByProfitQuery.data || [],
    rankedBySharpeRatio: rankedBySharpeRatioQuery.data || [],

    // Performance summary
    performanceSummary: performanceSummaryQuery.data,
    performanceSummaryLoading: performanceSummaryQuery.isLoading,

    // Control
    refresh,
    isLoading:
      allStrategiesQuery.isLoading ||
      performanceSummaryQuery.isLoading,
  };
}

/**
 * Hook for fetching a single strategy by ID
 */
export function useStrategy(strategyId: string) {
  return trpc.strategies.getById.useQuery({ id: strategyId });
}

/**
 * Hook for getting strategy recommendations
 */
export function useStrategyRecommendations(
  marketCondition: "trending" | "ranging" | "volatile",
  riskTolerance: "low" | "medium" | "high"
) {
  return trpc.strategies.getRecommendations.useQuery({
    marketCondition,
    riskTolerance,
  });
}

/**
 * Hook for comparing multiple strategies
 */
export function useCompareStrategies(strategyIds: string[]) {
  return trpc.strategies.compare.useQuery({ strategyIds });
}

/**
 * Hook for getting strategies by risk level
 */
export function useStrategiesByRiskLevel(
  riskLevel: "low" | "medium" | "high"
) {
  return trpc.strategies.getByRiskLevel.useQuery({ riskLevel });
}

/**
 * Hook for getting backtest results
 */
export function useBacktestResults(strategyId: string) {
  return trpc.strategies.getBacktestResults.useQuery({ strategyId });
}
