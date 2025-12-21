import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export type TimeRange = "24h" | "7d" | "30d" | "90d";

export interface PerformanceMetrics {
  startEquity: number;
  endEquity: number;
  totalProfit: number;
  totalProfitPercent: number;
  maxDrawdown: number;
  maxEquity: number;
  minEquity: number;
  roi: number;
}

export function usePerformance(timeRange: TimeRange = "30d") {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(timeRange);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch equity curve data
  const equityCurveQuery = trpc.performance.getEquityCurve.useQuery(
    { timeRange: selectedRange },
    { enabled: true }
  );

  // Fetch metrics
  const metricsQuery = trpc.performance.getMetrics.useQuery(
    { timeRange: selectedRange },
    { enabled: true }
  );

  useEffect(() => {
    setIsLoading(equityCurveQuery.isLoading || metricsQuery.isLoading);
    setError(equityCurveQuery.error?.message || metricsQuery.error?.message || null);
  }, [equityCurveQuery.isLoading, metricsQuery.isLoading, equityCurveQuery.error, metricsQuery.error]);

  return {
    selectedRange,
    setSelectedRange,
    isLoading,
    error,
    equityCurve: equityCurveQuery.data,
    metrics: metricsQuery.data,
    refetch: () => {
      equityCurveQuery.refetch();
      metricsQuery.refetch();
    },
  };
}

/**
 * Hook for exporting trades
 */
export function useTradeExport() {
  const exportJsonMutation = trpc.performance.exportTradesAsJson.useMutation();
  const exportCsvMutation = trpc.performance.exportTradesAsCsv.useMutation();

  const exportAsJson = async (trades: any[]) => {
    try {
      const result = await exportJsonMutation.mutateAsync({ trades });
      if (result.success && result.data && result.filename) {
        // Create blob and download
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      }
      return { success: false, error: "error" in result ? result.error : "Unknown error" };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  };

  const exportAsCsv = async (trades: any[]) => {
    try {
      const result = await exportCsvMutation.mutateAsync({ trades });
      if (result.success && result.data && result.filename) {
        // Create blob and download
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      }
      return { success: false, error: "error" in result ? result.error : "Unknown error" };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  };

  return {
    exportAsJson,
    exportAsCsv,
    isLoading: exportJsonMutation.isPending || exportCsvMutation.isPending,
    error: exportJsonMutation.error || exportCsvMutation.error,
  };
}
