import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAutoTradingExecutor } from "@/hooks/useAutoTradingExecutor";
import { Play, Square, RefreshCw, TrendingUp, DollarSign, Zap } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function AutoTradingExecutorPanel() {
  const { session, state, isRunning, error, start, stop, refresh, isLoading } =
    useAutoTradingExecutor();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleStart = async () => {
    await start();
    toast.success("Auto-trading started! Bot is now trading the $100 account...");
  };

  const handleStop = async () => {
    await stop();
    toast.success("Auto-trading stopped");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Automated Bot Trading
            </h3>
            <p className="text-sm text-muted-foreground">
              Self-trading $100 virtual account with intelligent strategies
            </p>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                disabled={isLoading}
                className="bg-accent hover:bg-accent/90"
              >
                <Play size={16} className="mr-2" />
                Start Trading
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                disabled={isLoading}
                variant="destructive"
              >
                <Square size={16} className="mr-2" />
                Stop Trading
              </Button>
            )}
            <Button
              onClick={refresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${
              isRunning ? "bg-accent animate-pulse" : "bg-muted"
            }`}
          />
          <span className="text-sm font-medium text-foreground">
            {isRunning ? "Trading Active" : "Trading Inactive"}
          </span>
        </div>

        {/* Session Info */}
        {session && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Trades Executed</p>
              <p className="text-lg font-semibold text-foreground">
                {session.tradesExecuted}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Session Profit</p>
              <p
                className={`text-lg font-semibold ${
                  session.totalProfit >= 0 ? "text-accent" : "text-destructive"
                }`}
              >
                ${session.totalProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-semibold text-accent">
                {session.isActive ? "Running" : "Stopped"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Time</p>
              <p className="text-lg font-semibold text-foreground">
                {new Date(session.startTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Trading State Display */}
      {state && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Trading Account Status
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Current Equity</p>
              <p className="font-mono font-semibold text-foreground text-lg">
                ${state.current_equity.toFixed(2)}
              </p>
              <p className="text-xs text-accent mt-1">
                {state.initial_stake > 0
                  ? (
                      ((state.current_equity - state.initial_stake) /
                        state.initial_stake) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Total Profit</p>
              <p
                className={`font-mono font-semibold text-lg ${
                  state.total_profit >= 0 ? "text-accent" : "text-destructive"
                }`}
              >
                ${state.total_profit.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Open Trades</p>
              <p className="font-mono font-semibold text-accent text-lg">
                {state.open_trades.length}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="font-mono font-semibold text-foreground text-lg">
                {state.total_trades > 0
                  ? ((state.winning_trades / state.total_trades) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Trade Summary */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-card border border-border rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total Trades</p>
              <p className="font-mono font-semibold text-foreground">
                {state.total_trades}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Winning</p>
              <p className="font-mono font-semibold text-accent">
                {state.winning_trades}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Losing</p>
              <p className="font-mono font-semibold text-destructive">
                {state.losing_trades}
              </p>
            </div>
          </div>

          {/* Open Trades */}
          {state.open_trades.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Open Trades ({state.open_trades.length})
              </h4>
              <div className="space-y-2">
                {state.open_trades.map((trade: any) => (
                  <div
                    key={trade.trade_id}
                    className="p-3 border border-border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {trade.pair}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Entry: ${trade.open_rate.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          trade.profit_abs >= 0
                            ? "text-accent"
                            : "text-destructive"
                        }`}
                      >
                        ${trade.profit_abs.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(trade.profit_ratio * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <Zap size={16} className="inline mr-2 text-accent" />
              The bot is automatically executing trades based on market signals.
              Watch in real-time as it learns and adapts to market conditions.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
