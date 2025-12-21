import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface TradeSignal {
  symbol: string;
  action: "buy" | "sell";
  strategy: string;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
}

export interface StrategyPerformance {
  signals: number;
  totalProfit: string;
  winRate: string;
  winCount: number;
  lossCount: number;
  profitPerTrade: string;
}

export function useAutoTrader() {
  const [strategies, setStrategies] = useState<string[]>([]);
  const [signals, setSignals] = useState<Record<string, TradeSignal[]>>({});
  const [performance, setPerformance] = useState<Record<string, StrategyPerformance>>({});
  const [selectedStrategy, setSelectedStrategy] = useState<string>("momentum");
  const [error, setError] = useState<string | null>(null);

  // Fetch strategies
  const strategiesQuery = trpc.autoTrader.getStrategies.useQuery();

  // Fetch signals
  const signalsQuery = trpc.autoTrader.generateSignals.useQuery({
    cryptoIds: ["bitcoin", "ethereum", "cardano", "solana", "ripple", "dogecoin"],
  });

  // Fetch performance
  const performanceQuery = trpc.autoTrader.getStrategyPerformance.useQuery();

  // Fetch selected strategy signals
  const selectedSignalsQuery = trpc.autoTrader.getStrategySignals.useQuery({
    strategy: selectedStrategy,
    cryptoIds: ["bitcoin", "ethereum", "cardano", "solana", "ripple", "dogecoin"],
  });

  // Update state when data is fetched
  useEffect(() => {
    if (strategiesQuery.data?.success && strategiesQuery.data.strategies) {
      setStrategies(strategiesQuery.data.strategies);
      if (!selectedStrategy && strategiesQuery.data.strategies.length > 0) {
        setSelectedStrategy(strategiesQuery.data.strategies[0]);
      }
    }
  }, [strategiesQuery.data]);

  useEffect(() => {
    if (signalsQuery.data?.success && signalsQuery.data.signals) {
      setSignals(signalsQuery.data.signals);
      setError(null);
    }
  }, [signalsQuery.data]);

  useEffect(() => {
    if (performanceQuery.data?.success && performanceQuery.data.performance) {
      setPerformance(performanceQuery.data.performance);
    }
  }, [performanceQuery.data]);

  // Handle errors
  useEffect(() => {
    if (strategiesQuery.error) {
      setError(`Failed to fetch strategies: ${strategiesQuery.error.message}`);
    }
    if (signalsQuery.error) {
      setError(`Failed to fetch signals: ${signalsQuery.error.message}`);
    }
    if (performanceQuery.error) {
      setError(`Failed to fetch performance: ${performanceQuery.error.message}`);
    }
  }, [strategiesQuery.error, signalsQuery.error, performanceQuery.error]);

  const isLoading =
    strategiesQuery.isLoading ||
    signalsQuery.isLoading ||
    performanceQuery.isLoading ||
    selectedSignalsQuery.isLoading;

  return {
    strategies,
    signals,
    performance,
    selectedStrategy,
    setSelectedStrategy,
    isLoading,
    error,
    selectedSignals: selectedSignalsQuery.data?.signals || [],
    refetch: () => {
      strategiesQuery.refetch();
      signalsQuery.refetch();
      performanceQuery.refetch();
      selectedSignalsQuery.refetch();
    },
  };
}
