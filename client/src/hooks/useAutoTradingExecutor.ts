import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface AutoTradeSession {
  id: string;
  startTime: string;
  tradesExecuted: number;
  totalProfit: number;
  isActive: boolean;
}

export interface SimulationState {
  initial_stake: number;
  current_equity: number;
  total_profit: number;
  total_profit_percent: number;
  trades: any[];
  open_trades: any[];
  closed_trades: any[];
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  max_drawdown: number;
  max_equity: number;
  min_equity: number;
  start_date: string;
  current_date: string;
}

export function useAutoTradingExecutor() {
  const [session, setSession] = useState<AutoTradeSession | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start auto-trading
  const startMutation = trpc.autoTradingExecutor.startAutoTrading.useMutation();
  const stopMutation = trpc.autoTradingExecutor.stopAutoTrading.useMutation();
  const getSessionQuery = trpc.autoTradingExecutor.getSession.useQuery();
  const getStateQuery = trpc.autoTradingExecutor.getState.useQuery();

  // Update state when data is fetched
  useEffect(() => {
    if (getSessionQuery.data?.session) {
      setSession(getSessionQuery.data.session);
      setIsRunning(getSessionQuery.data.session.isActive);
    }
  }, [getSessionQuery.data]);

  useEffect(() => {
    if (getStateQuery.data?.state) {
      setState(getStateQuery.data.state);
    }
  }, [getStateQuery.data]);

  // Start auto-trading
  const start = useCallback(async () => {
    try {
      setError(null);
      const result = await startMutation.mutateAsync({
        strategy: "momentum",
        riskPerTrade: 5,
        maxOpenTrades: 3,
        autoCloseProfitPercent: 2,
        autoCloseLossPercent: -1,
      });

      if (result.success) {
        setSession(result.session);
        setState(result.state);
        setIsRunning(true);

        // Refresh state every 10 seconds
        const interval = setInterval(() => {
          getStateQuery.refetch();
          getSessionQuery.refetch();
        }, 10000);

        return () => clearInterval(interval);
      }
    } catch (err) {
      setError(`Failed to start auto-trading: ${err}`);
    }
  }, [startMutation, getStateQuery, getSessionQuery]);

  // Stop auto-trading
  const stop = useCallback(async () => {
    try {
      setError(null);
      const result = await stopMutation.mutateAsync();

      if (result.success) {
        setSession(result.session);
        setState(result.state);
        setIsRunning(false);
      }
    } catch (err) {
      setError(`Failed to stop auto-trading: ${err}`);
    }
  }, [stopMutation]);

  // Refresh data
  const refresh = useCallback(() => {
    getSessionQuery.refetch();
    getStateQuery.refetch();
  }, [getSessionQuery, getStateQuery]);

  return {
    session,
    state,
    isRunning,
    error,
    start,
    stop,
    refresh,
    isLoading: startMutation.isPending || stopMutation.isPending,
  };
}
