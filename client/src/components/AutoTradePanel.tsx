import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAutoTrader } from "@/hooks/useAutoTrader";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AutoTradePanel() {
  const {
    strategies,
    signals,
    performance,
    selectedStrategy,
    setSelectedStrategy,
    isLoading,
    error,
    selectedSignals,
    refetch,
  } = useAutoTrader();

  const selectedSignalsList = selectedSignals || signals[selectedStrategy] || [];
  const strategyPerf = performance[selectedStrategy];

  const handleRefresh = () => {
    refetch();
    toast.success("Refreshing trading signals...");
  };

  if (error) {
    return (
      <Card className="p-6 bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-destructive" size={20} />
          <div>
            <h3 className="font-semibold text-destructive">Error</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategy Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Automated Trading Signals
          </h3>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select Strategy
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {strategies.map((strategy) => (
              <Button
                key={strategy}
                onClick={() => setSelectedStrategy(strategy)}
                variant={selectedStrategy === strategy ? "default" : "outline"}
                size="sm"
                className="capitalize"
              >
                {strategy.replace("-", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Strategy Performance */}
        {strategyPerf && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Signals</p>
              <p className="text-lg font-semibold text-foreground">
                {strategyPerf.signals}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="text-lg font-semibold text-accent">
                {strategyPerf.winRate}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Profit</p>
              <p className="text-lg font-semibold text-accent">
                ${strategyPerf.totalProfit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Per Trade</p>
              <p className="text-lg font-semibold text-accent">
                ${strategyPerf.profitPerTrade}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Trading Signals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Current Signals ({selectedSignalsList.length})
        </h3>

        {isLoading && selectedSignalsList.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin inline-block">
              <Zap className="text-accent" size={24} />
            </div>
            <p className="text-muted-foreground mt-2">Loading signals...</p>
          </div>
        ) : selectedSignalsList.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="text-muted-foreground mx-auto mb-2" size={24} />
            <p className="text-muted-foreground">No signals found for this strategy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedSignalsList.map((signal, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {signal.action === "buy" ? (
                      <TrendingUp className="text-accent" size={20} />
                    ) : (
                      <TrendingDown className="text-destructive" size={20} />
                    )}
                    <div>
                      <p className="font-semibold text-foreground capitalize">
                        {signal.action} {signal.symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {signal.reason}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      ${signal.entryPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-accent">
                      {(signal.confidence * 100).toFixed(0)}% confidence
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Entry</p>
                    <p className="font-mono font-semibold">
                      ${signal.entryPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded">
                    <p className="text-destructive text-xs">Stop Loss</p>
                    <p className="font-mono font-semibold text-destructive">
                      ${signal.stopLoss.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-accent/10 rounded">
                    <p className="text-accent text-xs">Take Profit</p>
                    <p className="font-mono font-semibold text-accent">
                      ${signal.takeProfit.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full mt-3 capitalize"
                  variant={signal.action === "buy" ? "default" : "destructive"}
                  size="sm"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Execute {signal.action} Trade
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Strategy Comparison */}
      {Object.keys(performance).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Strategy Comparison
          </h3>

          <div className="space-y-2">
            {Object.entries(performance).map(([strategy, perf]) => (
              <div
                key={strategy}
                className="p-3 border border-border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedStrategy(strategy)}
              >
                <div>
                  <p className="font-semibold text-foreground capitalize">
                    {strategy.replace("-", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {perf.winCount}W / {perf.lossCount}L
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent">{perf.winRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    ${perf.totalProfit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
