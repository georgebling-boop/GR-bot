import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Zap, Target, RefreshCw, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFreqtradeDashboard } from "@/hooks/useFreqtradeData";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import SystemHealthMonitor from "@/components/SystemHealthMonitor";
import { toast } from "sonner";

/**
 * Unified Dashboard - Single page with all trading bot information
 * Enhanced with performance insights, statistics, and quick actions
 */

interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  subtext?: string;
  loading?: boolean;
}

function MetricCard({
  label,
  value,
  unit,
  trend,
  subtext,
  loading,
}: MetricProps) {
  return (
    <Card className="metric-card">
      <div className="space-y-2">
        <p className="metric-label">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className={`metric-value ${loading ? "animate-pulse" : ""}`}>
            {loading ? "..." : value}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend === "up" ? (
              <TrendingUp size={16} className="text-accent" />
            ) : trend === "down" ? (
              <TrendingDown size={16} className="text-destructive" />
            ) : null}
            {subtext && (
              <span
                className={
                  trend === "up"
                    ? "text-accent"
                    : trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
              >
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const {
    openTrades,
    performance,
    refresh: refreshFreqtrade,
    dashboardLoading,
  } = useFreqtradeDashboard(5000);

  const { refresh: refreshHealth } = useSystemHealth();

  const handleRefresh = async () => {
    await Promise.all([refreshFreqtrade(), refreshHealth()]);
    toast.success("Dashboard refreshed");
  };

  // Calculate additional statistics
  const winningTrades = openTrades?.filter((t) => t.profit_ratio > 0).length || 0;
  const losingTrades = openTrades?.filter((t) => t.profit_ratio < 0).length || 0;
  const totalOpenProfit = openTrades?.reduce((sum, t) => sum + (t.profit_abs || 0), 0) || 0;
  const avgTradeProfit = openTrades && openTrades.length > 0 
    ? totalOpenProfit / openTrades.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                George's Trade Bot
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time trading dashboard powered by Freqtrade
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Connected
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={dashboardLoading}
                className="gap-2"
              >
                <RefreshCw
                  size={16}
                  className={dashboardLoading ? "animate-spin" : ""}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 space-y-8">
        {/* Key Metrics Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Key Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Profit"
              value={`$${(performance?.total_profit || 0).toFixed(2)}`}
              trend={
                (performance?.total_profit || 0) > 0 ? "up" : "down"
              }
              subtext={`${(performance?.total_profit_percent || 0).toFixed(2)}%`}
              loading={dashboardLoading}
            />
            <MetricCard
              label="Win Rate"
              value={`${(performance?.win_rate || 0).toFixed(1)}%`}
              trend={
                (performance?.win_rate || 0) > 50 ? "up" : "down"
              }
              subtext={
                (performance?.win_rate || 0) > 50
                  ? "Above target"
                  : "Below target"
              }
              loading={dashboardLoading}
            />
            <MetricCard
              label="Open Trades"
              value={performance?.open_trades || 0}
              unit="active"
              loading={dashboardLoading}
            />
            <MetricCard
              label="Max Drawdown"
              value={`${(performance?.max_drawdown || 0).toFixed(2)}%`}
              trend={
                (performance?.max_drawdown || 0) < 10 ? "up" : "down"
              }
              subtext={
                (performance?.max_drawdown || 0) < 10
                  ? "Within limits"
                  : "High risk"
              }
              loading={dashboardLoading}
            />
          </div>
        </section>

        {/* Strategy Performance */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Strategy Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Total Trades"
              value={performance?.total_trades || 0}
              subtext="All time"
              loading={dashboardLoading}
            />
            <MetricCard
              label="Closed Trades"
              value={performance?.closed_trades || 0}
              subtext={`${(
                ((performance?.closed_trades || 0) /
                  (performance?.total_trades || 1)) *
                100
              ).toFixed(1)}% closed`}
              loading={dashboardLoading}
            />
            <Card className="metric-card">
              <div className="space-y-2">
                <p className="metric-label">Strategy</p>
                <p className="font-mono text-sm font-semibold text-foreground">
                  NostalgiaForInfinity
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Zap size={16} className="text-accent" />
                  <span className="text-xs text-muted-foreground">
                    Active & Running
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Open Trades Summary */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Open Trades Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <div className="space-y-2">
                <p className="metric-label">Total Open</p>
                <p className="metric-value">{openTrades?.length || 0}</p>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Active positions
                </p>
              </div>
            </Card>
            <Card className="metric-card">
              <div className="space-y-2">
                <p className="metric-label">Winning</p>
                <p className="metric-value text-accent">{winningTrades}</p>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  {openTrades && openTrades.length > 0
                    ? ((winningTrades / openTrades.length) * 100).toFixed(1)
                    : 0}
                  % of open
                </p>
              </div>
            </Card>
            <Card className="metric-card">
              <div className="space-y-2">
                <p className="metric-label">Losing</p>
                <p className="metric-value text-destructive">{losingTrades}</p>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  {openTrades && openTrades.length > 0
                    ? ((losingTrades / openTrades.length) * 100).toFixed(1)
                    : 0}
                  % of open
                </p>
              </div>
            </Card>
            <Card className="metric-card">
              <div className="space-y-2">
                <p className="metric-label">Total P&L</p>
                <p
                  className={`metric-value ${
                    totalOpenProfit > 0 ? "text-accent" : "text-destructive"
                  }`}
                >
                  ${totalOpenProfit.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Avg: ${avgTradeProfit.toFixed(2)}
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Recent Open Trades */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Open Trades ({openTrades?.length || 0})
          </h2>
          {openTrades && openTrades.length > 0 ? (
            <div className="space-y-3">
              {openTrades.map((trade) => (
                <Card key={trade.trade_id} className="metric-card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="font-mono font-bold text-lg text-foreground">
                          {trade.pair}
                        </p>
                        <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          ID: {trade.trade_id}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Entry Price
                          </p>
                          <p className="font-mono text-foreground">
                            ${trade.open_rate.toFixed(8)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Current Price
                          </p>
                          <p className="font-mono text-foreground">
                            ${trade.current_rate.toFixed(8)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Amount
                          </p>
                          <p className="font-mono text-foreground">
                            {trade.amount.toFixed(8)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Stake
                          </p>
                          <p className="font-mono text-foreground">
                            ${trade.stake_amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Price Change
                          </p>
                          <p
                            className={`font-mono font-semibold ${
                              trade.current_rate > trade.open_rate
                                ? "text-accent"
                                : "text-destructive"
                            }`}
                          >
                            {(
                              ((trade.current_rate - trade.open_rate) /
                                trade.open_rate) *
                              100
                            ).toFixed(2)}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p
                        className={`font-mono font-bold text-xl ${
                          trade.profit_ratio > 0
                            ? "text-accent"
                            : "text-destructive"
                        }`}
                      >
                        {trade.profit_ratio > 0 ? "+" : ""}
                        {(trade.profit_ratio * 100).toFixed(2)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${trade.profit_abs.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="metric-card text-center py-12">
              <Clock size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-lg">
                {dashboardLoading
                  ? "Loading trades..."
                  : "No open trades at the moment"}
              </p>
            </Card>
          )}
        </section>

        {/* Performance Insights */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Performance Insights
          </h2>
          <div className="space-y-3">
            {(performance?.win_rate || 0) > 60 && (
              <Card className="metric-card border-accent/50 bg-accent/5">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-accent flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-accent">
                      Excellent Win Rate
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your strategy is performing exceptionally well with a win rate above 60%.
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
                      Your maximum drawdown is below 5%, indicating excellent risk management.
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
                        Your strategy has generated returns above 10%, demonstrating solid profitability.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

            {(performance?.total_trades || 0) < 10 && (
              <Card className="metric-card border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                      Limited Sample Size
                    </p>
                    <p className="text-sm text-muted-foreground">
                      With fewer than 10 trades, consider running longer to get more reliable statistics.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {(performance?.win_rate || 0) <= 50 && (
              <Card className="metric-card border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                      Below Target Win Rate
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your win rate is at or below 50%. Monitor performance closely and consider strategy adjustments.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* System Health Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            System Health & Performance
          </h2>
          <SystemHealthMonitor />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-12 text-base" variant="outline">
              <DollarSign size={20} className="mr-2" />
              View Trade History
            </Button>
            <Button className="h-12 text-base" variant="outline">
              <Target size={20} className="mr-2" />
              Adjust Strategy
            </Button>
            <Button className="h-12 text-base" variant="outline">
              <Zap size={20} className="mr-2" />
              Bot Settings
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
