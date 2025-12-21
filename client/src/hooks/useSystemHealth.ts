import { trpc } from "@/lib/trpc";

/**
 * Custom hook for fetching system health and engine performance metrics
 * Supports automatic polling for real-time monitoring
 */

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds for live updates

export function useSystemHealth() {
  const utils = trpc.useUtils();

  // Fetch system health metrics (CPU, memory, disk)
  const healthQuery = trpc.health.health.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 1000,
  });

  // Fetch engine performance metrics (API response time, calculation time)
  const engineQuery = trpc.health.enginePerformance.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 1000,
  });

  // Fetch combined metrics
  const combinedQuery = trpc.health.combined.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 1000,
  });

  // Fetch performance history for charts
  const historyQuery = trpc.health.history.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  });

  // Manual refresh function
  const refresh = async () => {
    await Promise.all([
      utils.health.health.invalidate(),
      utils.health.enginePerformance.invalidate(),
      utils.health.combined.invalidate(),
      utils.health.history.invalidate(),
    ]);
  };

  return {
    // System health data
    health: healthQuery.data,
    healthLoading: healthQuery.isLoading,
    healthError: healthQuery.error,

    // Engine performance data
    enginePerformance: engineQuery.data,
    engineLoading: engineQuery.isLoading,
    engineError: engineQuery.error,

    // Combined data
    combined: combinedQuery.data,
    combinedLoading: combinedQuery.isLoading,

    // History for charts
    history: historyQuery.data || [],
    historyLoading: historyQuery.isLoading,

    // Control
    refresh,
    isLoading: healthQuery.isLoading || engineQuery.isLoading,
  };
}

/**
 * Helper function to get health status color
 */
export function getHealthColor(
  health: "excellent" | "good" | "fair" | "poor"
): string {
  switch (health) {
    case "excellent":
      return "text-accent";
    case "good":
      return "text-green-500";
    case "fair":
      return "text-yellow-500";
    case "poor":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Helper function to get health status background
 */
export function getHealthBgColor(
  health: "excellent" | "good" | "fair" | "poor"
): string {
  switch (health) {
    case "excellent":
      return "bg-accent/10";
    case "good":
      return "bg-green-500/10";
    case "fair":
      return "bg-yellow-500/10";
    case "poor":
      return "bg-destructive/10";
    default:
      return "bg-muted";
  }
}
