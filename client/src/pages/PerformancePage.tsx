import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useFreqtradeDashboard } from "@/hooks/useFreqtradeData";
import { TrendingUp, TrendingDown, RefreshCw, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Performance Page
 * Displays detailed trading performance analytics and metrics
 */

export default function PerformancePage() {
  const [activeNav, setActiveNav] = useState("performance");
  const { performance, performanceLoading, refresh } = useFreqtradeDashboard(10000);

  const handleRefresh = async () => {
    await refresh();
    toast.success("Performance metrics refreshed");
  };

  return (
    <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
      <div className="h-full overflow-auto bg-gradient-to-b from-background to-background">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Performance Analytics
                </h1>
                <p className="text-muted-foreground mt-1">
                  Detailed trading performance metrics and statistics
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={performanceLoading}
                className="gap-2"
              >
                <RefreshCw
                  size={16}
                  className={performanceLoading ? "animate-spin" : ""}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8 space-y-8">
          {/* Primary Metrics */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Key Performance Indicators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Profit */}
              <Card className="metric-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="metric-label">Total Profit</p>
                    {(performance?.total_profit || 0) > 0 ? (
                      <TrendingUp className="text-accent" size={20} />
                    ) : (
                      <TrendingDown className="text-destructive" size={20} />
                    )}
                  </div>
                  <div>
                    <p
                      className={`metric-value ${
                        (performance?.total_profit || 0) > 0
                          ? "text-accent"
                          : "text-destructive"
                      }`}
                    >
                      ${(performance?.total_profit || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(performance?.total_profit_percent || 0).toFixed(2)}%
                      return
                    </p>
                  </div>
                </div>
              </Card>

              {/* Win Rate */}
              <Card className="metric-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="metric-label">Win Rate</p>
                    <Target className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="metric-value">
                      {(performance?.win_rate || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(performance?.win_rate || 0) > 50
                        ? "Above 50% target"
                        : "Below 50% target"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Max Drawdown */}
              <Card className="metric-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="metric-label">Max Drawdown</p>
                    <TrendingDown className="text-yellow-500" size={20} />
                  </div>
                  <div>
                    <p className="metric-value">
                      {(performance?.max_drawdown || 0).toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(performance?.max_drawdown || 0) < 10
                        ? "Within limits"
                        : "High risk"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Sharpe Ratio */}
              <Card className="metric-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="metric-label">Sharpe Ratio</p>
                    <Zap className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="metric-value">
                      {(performance?.sharpe_ratio || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Risk-adjusted return
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Trade Statistics */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Trade Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="metric-card">
                <div className="space-y-3">
                  <p className="metric-label">Total Trades</p>
                  <p className="metric-value">
                    {performance?.total_trades || 0}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Open</p>
                      <p className="font-semibold text-accent">
                        {performance?.open_trades || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Closed</p>
                      <p className="font-semibold text-foreground">
                        {performance?.closed_trades || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="space-y-3">
                  <p className="metric-label">Winning Trades</p>
                  <p className="metric-value text-accent">
                    {Math.round(
                      ((performance?.win_rate || 0) / 100) *
                        (performance?.closed_trades || 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground pt-3 border-t border-border">
                    {(performance?.win_rate || 0).toFixed(1)}% of closed trades
                  </p>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="space-y-3">
                  <p className="metric-label">Losing Trades</p>
                  <p className="metric-value text-destructive">
                    {Math.round(
                      (100 - (performance?.win_rate || 0)) / 100 *
                        (performance?.closed_trades || 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground pt-3 border-t border-border">
                    {(100 - (performance?.win_rate || 0)).toFixed(1)}% of closed
                    trades
                  </p>
                </div>
              </Card>
            </div>
          </section>

          {/* Performance Insights */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Performance Insights
            </h2>
            <div className="space-y-3">
              {(performance?.win_rate || 0) > 60 && (
                <Card className="metric-card border-accent/50 bg-accent/5">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="text-accent flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-semibold text-accent">
                        Excellent Win Rate
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your strategy is performing exceptionally well with a
                        win rate above 60%.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {(performance?.max_drawdown || 0) < 5 && (
                <Card className="metric-card border-accent/50 bg-accent/5">
                  <div className="flex items-start gap-3">
                    <Zap className="text-accent flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-semibold text-accent">
                        Low Drawdown Risk
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your maximum drawdown is below 5%, indicating good risk
                        management.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {(performance?.total_profit || 0) > 0 &&
                (performance?.total_profit_percent || 0) > 10 && (
                  <Card className="metric-card border-accent/50 bg-accent/5">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="text-accent flex-shrink-0 mt-1" size={20} />
                      <div>
                        <p className="font-semibold text-accent">
                          Strong Returns
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your strategy has generated returns above 10%,
                          demonstrating solid profitability.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

              {(performance?.total_trades || 0) < 10 && (
                <Card className="metric-card border-yellow-500/50 bg-yellow-500/5">
                  <div className="flex items-start gap-3">
                    <Target className="text-yellow-500 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                        Limited Sample Size
                      </p>
                      <p className="text-sm text-muted-foreground">
                        With fewer than 10 trades, consider running longer to
                        get more reliable statistics.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
