import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Custom hook for fetching Freqtrade dashboard data
 * Supports automatic polling for real-time updates
 */

export function useFreqtradeDashboard(pollIntervalMs: number = 5000) {
  const utils = trpc.useUtils();

  // Fetch all dashboard data in one request
  const dashboardQuery = trpc.freqtrade.dashboard.useQuery(undefined, {
    refetchInterval: pollIntervalMs, // Auto-poll every 5 seconds
    staleTime: 2000, // Data is fresh for 2 seconds
  });

  // Fetch open trades with polling
  const openTradesQuery = trpc.freqtrade.openTrades.useQuery(undefined, {
    refetchInterval: pollIntervalMs,
    staleTime: 2000,
  });

  // Fetch performance metrics
  const performanceQuery = trpc.freqtrade.performance.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  });

  // Fetch bot status
  const statusQuery = trpc.freqtrade.status.useQuery(undefined, {
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Fetch daily stats for charts
  const dailyStatsQuery = trpc.freqtrade.dailyStats.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 15000,
  });

  // Fetch trade history
  const historyQuery = trpc.freqtrade.history.useQuery(
    { limit: 50, offset: 0 },
    {
      refetchInterval: 30000,
      staleTime: 15000,
    }
  );

  // Check bot health
  const healthQuery = trpc.freqtrade.isHealthy.useQuery(undefined, {
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // Manual refresh function
  const refresh = async () => {
    await Promise.all([
      utils.freqtrade.dashboard.invalidate(),
      utils.freqtrade.openTrades.invalidate(),
      utils.freqtrade.performance.invalidate(),
      utils.freqtrade.status.invalidate(),
      utils.freqtrade.dailyStats.invalidate(),
      utils.freqtrade.history.invalidate(),
      utils.freqtrade.isHealthy.invalidate(),
    ]);
  };

  return {
    // Dashboard data
    dashboard: dashboardQuery.data,
    dashboardLoading: dashboardQuery.isLoading,
    dashboardError: dashboardQuery.error,

    // Individual queries
    openTrades: openTradesQuery.data || [],
    openTradesLoading: openTradesQuery.isLoading,

    performance: performanceQuery.data,
    performanceLoading: performanceQuery.isLoading,

    status: statusQuery.data,
    statusLoading: statusQuery.isLoading,

    dailyStats: dailyStatsQuery.data || [],
    dailyStatsLoading: dailyStatsQuery.isLoading,

    history: historyQuery.data,
    historyLoading: historyQuery.isLoading,

    isHealthy: healthQuery.data || false,
    healthLoading: healthQuery.isLoading,

    // Control
    refresh,
    isLoading:
      dashboardQuery.isLoading ||
      openTradesQuery.isLoading ||
      performanceQuery.isLoading,
  };
}

/**
 * Hook for fetching a single trade
 */
export function useTrade(tradeId: number) {
  return trpc.freqtrade.trade.useQuery(
    { tradeId },
    {
      refetchInterval: 3000, // Poll every 3 seconds for active trades
      staleTime: 1000,
    }
  );
}

/**
 * Hook for fetching trade history with pagination
 */
export function useTradeHistory(limit: number = 50, offset: number = 0) {
  return trpc.freqtrade.history.useQuery(
    { limit, offset },
    {
      refetchInterval: 30000,
      staleTime: 15000,
    }
  );
}
