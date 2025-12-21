import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useTestTrading() {
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const stateQuery = trpc.testTrading.getState.useQuery();
  const summaryQuery = trpc.testTrading.getSummary.useQuery();

  // Mutations
  const initMutation = trpc.testTrading.initializeSimulation.useMutation();
  const openTradeMutation = trpc.testTrading.openTrade.useMutation();
  const closeTradeMutation = trpc.testTrading.closeTrade.useMutation();
  const updatePriceMutation = trpc.testTrading.updateTradePrice.useMutation();
  const generateSamplesMutation = trpc.testTrading.generateSampleTrades.useMutation();
  const resetMutation = trpc.testTrading.reset.useMutation();

  const initialize = async () => {
    setIsLoading(true);
    try {
      const result = await initMutation.mutateAsync();
      toast.success(result.message);
      stateQuery.refetch();
      summaryQuery.refetch();
    } catch (error) {
      toast.error(`Failed to initialize: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openTrade = async (pair: string, stakeAmount: number, openRate: number) => {
    setIsLoading(true);
    try {
      const result = await openTradeMutation.mutateAsync({
        pair,
        stake_amount: stakeAmount,
        open_rate: openRate,
      });

      if (result.success) {
        toast.success(result.message);
        stateQuery.refetch();
        summaryQuery.refetch();
      } else {
        toast.error(result.error || "Failed to open trade");
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const closeTrade = async (tradeId: number, closeRate: number) => {
    setIsLoading(true);
    try {
      const result = await closeTradeMutation.mutateAsync({
        trade_id: tradeId,
        close_rate: closeRate,
      });

      if (result.success) {
        toast.success(result.message);
        stateQuery.refetch();
        summaryQuery.refetch();
      } else {
        toast.error(result.error || "Failed to close trade");
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrice = async (tradeId: number, currentRate: number) => {
    try {
      await updatePriceMutation.mutateAsync({
        trade_id: tradeId,
        current_rate: currentRate,
      });
      stateQuery.refetch();
    } catch (error) {
      toast.error(`Error updating price: ${error}`);
    }
  };

  const generateSamples = async () => {
    setIsLoading(true);
    try {
      const result = await generateSamplesMutation.mutateAsync();
      toast.success(result.message);
      stateQuery.refetch();
      summaryQuery.refetch();
    } catch (error) {
      toast.error(`Failed to generate samples: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = async () => {
    setIsLoading(true);
    try {
      const result = await resetMutation.mutateAsync();
      toast.success(result.message);
      stateQuery.refetch();
      summaryQuery.refetch();
    } catch (error) {
      toast.error(`Failed to reset: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state: stateQuery.data,
    summary: summaryQuery.data,
    isLoading,
    initialize,
    openTrade,
    closeTrade,
    updatePrice,
    generateSamples,
    reset,
    refetch: () => {
      stateQuery.refetch();
      summaryQuery.refetch();
    },
  };
}
