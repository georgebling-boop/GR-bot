import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export function SelfLearningPanel() {
  const [isLearning, setIsLearning] = useState(false);

  const stateQuery = trpc.learning.getState.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const runCycleMutation = trpc.learning.runCycle.useMutation({
    onSuccess: (data) => {
      toast.success("Learning cycle completed!");
      stateQuery.refetch();
      setIsLearning(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLearning(false);
    },
  });

  const resetMutation = trpc.learning.reset.useMutation({
    onSuccess: () => {
      toast.info("Learning reset");
      stateQuery.refetch();
    },
  });

  const state = stateQuery.data;

  const handleRunCycle = () => {
    setIsLearning(true);
    runCycleMutation.mutate();
  };

  if (!state) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Brain className="text-purple-500 animate-pulse" size={20} />
          <span className="text-muted-foreground">Loading learning system...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="text-purple-500" size={20} />
          <h3 className="font-semibold text-foreground">Self-Learning AI</h3>
          {state.isLearning && (
            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full animate-pulse">
              Learning...
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRunCycle}
            disabled={isLearning || runCycleMutation.isPending}
            size="sm"
            variant="outline"
            className="text-purple-500 border-purple-500/30 hover:bg-purple-500/10"
          >
            <RefreshCw size={14} className={`mr-1 ${isLearning ? "animate-spin" : ""}`} />
            Learn
          </Button>
          <Button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Win Rate */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Target size={12} className="text-purple-500" />
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
          <p className={`text-lg font-mono font-bold ${state.currentWinRate >= 50 ? "text-green-500" : "text-red-500"}`}>
            {state.currentWinRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Target: {state.targetWinRate}%
          </p>
        </div>

        {/* Trades Analyzed */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 size={12} className="text-blue-500" />
            <span className="text-xs text-muted-foreground">Analyzed</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">
            {state.totalAnalyzedTrades}
          </p>
          <p className="text-xs text-muted-foreground">trades</p>
        </div>

        {/* Patterns Discovered */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Zap size={12} className="text-yellow-500" />
            <span className="text-xs text-muted-foreground">Patterns</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">
            {state.patternsDiscovered}
          </p>
          <p className="text-xs text-muted-foreground">discovered</p>
        </div>

        {/* Improvement */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            {state.improvementRate >= 0 ? (
              <TrendingUp size={12} className="text-green-500" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">Improvement</span>
          </div>
          <p className={`text-lg font-mono font-bold ${state.improvementRate >= 0 ? "text-green-500" : "text-red-500"}`}>
            {state.improvementRate >= 0 ? "+" : ""}{state.improvementRate.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground">since last cycle</p>
        </div>
      </div>

      {/* Market Condition */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Market Condition</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2 py-1 text-xs rounded-full ${
            state.marketCondition.trend === "bullish" 
              ? "bg-green-500/20 text-green-500" 
              : state.marketCondition.trend === "bearish"
              ? "bg-red-500/20 text-red-500"
              : "bg-yellow-500/20 text-yellow-500"
          }`}>
            {state.marketCondition.trend.toUpperCase()}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            state.marketCondition.volatility === "high" 
              ? "bg-orange-500/20 text-orange-500" 
              : state.marketCondition.volatility === "low"
              ? "bg-blue-500/20 text-blue-500"
              : "bg-gray-500/20 text-gray-400"
          }`}>
            {state.marketCondition.volatility} volatility
          </span>
          <span className="text-xs text-muted-foreground">
            Confidence: {state.marketCondition.confidence.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Insights */}
      {state.insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Latest Insights</p>
          {state.insights.slice(0, 3).map((insight, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                insight.type === "success"
                  ? "bg-green-500/10 text-green-400"
                  : insight.type === "warning"
                  ? "bg-orange-500/10 text-orange-400"
                  : "bg-blue-500/10 text-blue-400"
              }`}
            >
              {insight.type === "success" ? (
                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
              ) : insight.type === "warning" ? (
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              ) : (
                <Info size={14} className="mt-0.5 flex-shrink-0" />
              )}
              <span>{insight.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Strategy Rankings */}
      {state.strategyRankings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Strategy Rankings</p>
          <div className="space-y-1">
            {state.strategyRankings.slice(0, 3).map((strategy, index) => (
              <div
                key={strategy.name}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-black" :
                    index === 1 ? "bg-gray-400 text-black" :
                    "bg-orange-700 text-white"
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {strategy.name.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={strategy.winRate >= 50 ? "text-green-500" : "text-red-500"}>
                    {strategy.winRate.toFixed(0)}% win
                  </span>
                  <span className="text-muted-foreground">
                    {strategy.totalTrades} trades
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimized Parameters Preview */}
      <div className="p-3 bg-purple-500/10 rounded-lg">
        <p className="text-xs text-purple-400 mb-2">Optimized Parameters</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Take Profit:</span>
            <span className="ml-1 text-foreground font-mono">
              {state.optimizedParameters.takeProfitPercent?.toFixed(2) || "1.50"}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Stop Loss:</span>
            <span className="ml-1 text-foreground font-mono">
              {state.optimizedParameters.stopLossPercent?.toFixed(2) || "1.00"}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Position Size:</span>
            <span className="ml-1 text-foreground font-mono">
              {state.optimizedParameters.positionSizePercent?.toFixed(0) || "5"}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Max Trades:</span>
            <span className="ml-1 text-foreground font-mono">
              {state.optimizedParameters.maxOpenTrades || "5"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
