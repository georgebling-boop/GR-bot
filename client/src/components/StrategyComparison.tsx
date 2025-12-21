import { Card } from "@/components/ui/card";
import { useStrategies } from "@/hooks/useStrategies";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Strategy Comparison Component
 * Displays top strategies ranked by different metrics
 */

export default function StrategyComparison() {
  const {
    rankedByWinRate,
    rankedByProfit,
    rankedBySharpeRatio,
    performanceSummary,
    performanceSummaryLoading,
  } = useStrategies();

  if (performanceSummaryLoading) {
    return (
      <Card className="metric-card text-center py-8">
        <p className="text-muted-foreground">Loading strategies...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      {performanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Total Strategies</p>
              <p className="metric-value">
                {performanceSummary.totalStrategies}
              </p>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Available strategies
              </p>
            </div>
          </Card>
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Avg Win Rate</p>
              <p className="metric-value text-accent">
                {performanceSummary.avgWinRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Across all strategies
              </p>
            </div>
          </Card>
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Avg Profit</p>
              <p className="metric-value text-accent">
                {performanceSummary.avgProfit.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Average return
              </p>
            </div>
          </Card>
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Best Performer</p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {performanceSummary.bestPerformer?.name || "N/A"}
              </p>
              <p className="text-xs text-accent pt-2 border-t border-border">
                {performanceSummary.bestPerformer?.backtestResults
                  ?.totalProfitPercent.toFixed(1)}
                % profit
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Strategy Rankings */}
      <Tabs defaultValue="profit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profit">By Profit</TabsTrigger>
          <TabsTrigger value="winrate">By Win Rate</TabsTrigger>
          <TabsTrigger value="sharpe">By Risk-Adj Return</TabsTrigger>
        </TabsList>

        {/* Ranked by Profit */}
        <TabsContent value="profit" className="space-y-3 mt-4">
          {rankedByProfit.length > 0 ? (
            rankedByProfit.map((strategy, index) => (
              <Card key={strategy.id} className="metric-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {strategy.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {strategy.description.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Profit
                        </p>
                        <p className="font-mono font-semibold text-accent">
                          {strategy.backtestResults?.totalProfitPercent.toFixed(
                            1
                          )}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Win Rate
                        </p>
                        <p className="font-mono font-semibold text-foreground">
                          {strategy.backtestResults?.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Profit Factor
                        </p>
                        <p className="font-mono font-semibold text-foreground">
                          {strategy.backtestResults?.profitFactor.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Sharpe Ratio
                        </p>
                        <p className="font-mono font-semibold text-foreground">
                          {strategy.backtestResults?.sharpeRatio.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Max Drawdown
                        </p>
                        <p className="font-mono font-semibold text-destructive">
                          {strategy.backtestResults?.maxDrawdown.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                        strategy.riskLevel === "low"
                          ? "bg-green-500/20 text-green-500"
                          : strategy.riskLevel === "medium"
                            ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                            : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      <Zap size={14} />
                      {strategy.riskLevel.charAt(0).toUpperCase() +
                        strategy.riskLevel.slice(1)}{" "}
                      Risk
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="metric-card text-center py-8">
              <p className="text-muted-foreground">No strategies available</p>
            </Card>
          )}
        </TabsContent>

        {/* Ranked by Win Rate */}
        <TabsContent value="winrate" className="space-y-3 mt-4">
          {rankedByWinRate.length > 0 ? (
            rankedByWinRate.map((strategy, index) => (
              <Card key={strategy.id} className="metric-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {strategy.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {strategy.description.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Win Rate
                        </p>
                        <p className="font-mono font-semibold text-accent">
                          {strategy.backtestResults?.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Trades
                        </p>
                        <p className="font-mono font-semibold text-foreground">
                          {strategy.backtestResults?.totalTrades}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Winning Trades
                        </p>
                        <p className="font-mono font-semibold text-accent">
                          {strategy.backtestResults?.winningTrades}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Avg Win
                        </p>
                        <p className="font-mono font-semibold text-accent">
                          {strategy.backtestResults?.avgWinPercent.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Avg Loss
                        </p>
                        <p className="font-mono font-semibold text-destructive">
                          {strategy.backtestResults?.avgLossPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="metric-card text-center py-8">
              <p className="text-muted-foreground">No strategies available</p>
            </Card>
          )}
        </TabsContent>

        {/* Ranked by Sharpe Ratio */}
        <TabsContent value="sharpe" className="space-y-3 mt-4">
          {rankedBySharpeRatio.length > 0 ? (
            rankedBySharpeRatio.map((strategy, index) => (
              <Card key={strategy.id} className="metric-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {strategy.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Best risk-adjusted returns
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Sharpe Ratio
                        </p>
                        <p className="font-mono font-semibold text-accent">
                          {strategy.backtestResults?.sharpeRatio.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Profit
                        </p>
                        <p className="font-mono font-semibold text-foreground">
                          {strategy.backtestResults?.totalProfitPercent.toFixed(
                            1
                          )}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Max Drawdown
                        </p>
                        <p className="font-mono font-semibold text-destructive">
                          {strategy.backtestResults?.maxDrawdown.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Win Rate
                        </p>
                        <p className="font-mono font-semibold text-foreground">
                          {strategy.backtestResults?.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Profit Factor
                        </p>
                        <p className="font-mono font-semibold text-foreground">
                          {strategy.backtestResults?.profitFactor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="metric-card text-center py-8">
              <p className="text-muted-foreground">No strategies available</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
