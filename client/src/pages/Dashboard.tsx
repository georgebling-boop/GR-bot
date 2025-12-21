import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Zap, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFreqtradeDashboard } from "@/hooks/useFreqtradeData";
import { toast } from "sonner";

/**
 * Dashboard - Main trading bot monitoring interface
 * Integrated with Freqtrade API via tRPC
 * Real-time polling: 5s for trades, 10s for metrics, 30s for history
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
  const [activeNav, setActiveNav] = useState("overview");
  const {
    dashboard,
    dashboardLoading,
    dashboardError,
    openTrades,
    performance,
    status,
    isHealthy,
    refresh,
  } = useFreqtradeDashboard(5000); // Poll every 5 seconds

  const handleRefresh = async () => {
    await refresh();
    toast.success("Dashboard refreshed");
  };

  const botStatus = status?.state || "disconnected";
  const isConnected = isHealthy && botStatus === "running";

  // Use dashboard data if available, otherwise use individual queries
  const displayData = dashboard || {
    status: status,
    openTrades: openTrades,
    performance: performance,
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
                  Trading Overview
                </h1>
                <p className="text-muted-foreground mt-1">
                  Real-time bot performance and metrics
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`status-indicator ${
                      isConnected ? "status-active" : "status-inactive"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {isConnected ? (
                      <span className="text-accent">Connected</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Disconnected
                      </span>
                    )}
                  </span>
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

        {/* Error State */}
        {dashboardError && (
          <div className="container py-4">
            <Card className="metric-card border-destructive/50 bg-destructive/5">
              <p className="text-destructive text-sm">
                <strong>Connection Error:</strong> Unable to connect to Freqtrade
                bot. Make sure the bot is running on{" "}
                {process.env.VITE_FREQTRADE_URL || "http://localhost:8080"}
              </p>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="container py-8 space-y-8">
          {/* Key Performance Indicators */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
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
                trend="neutral"
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

          {/* Secondary Metrics */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Strategy Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Total Trades"
                value={performance?.total_trades || 0}
                trend="up"
                subtext="All time"
                loading={dashboardLoading}
              />
              <MetricCard
                label="Closed Trades"
                value={performance?.closed_trades || 0}
                trend="neutral"
                subtext={`${((performance?.closed_trades || 0) / (performance?.total_trades || 1) * 100).toFixed(1)}% closed`}
                loading={dashboardLoading}
              />
              <Card className="metric-card flex items-center justify-center min-h-32">
                <div className="text-center space-y-2">
                  <Zap className="mx-auto text-accent" size={32} />
                  <p className="text-sm text-muted-foreground">
                    Strategy: NostalgiaForInfinity
                  </p>
                </div>
              </Card>
            </div>
          </section>

          {/* Recent Trades */}
          {openTrades && openTrades.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Open Trades ({openTrades.length})
              </h2>
              <Card className="metric-card">
                <div className="space-y-4">
                  {openTrades.slice(0, 5).map((trade) => (
                    <div
                      key={trade.trade_id}
                      className="flex items-center justify-between pb-4 border-b border-border last:border-b-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="font-mono font-semibold text-foreground">
                          {trade.pair}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entry: ${trade.open_rate.toFixed(8)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p
                          className={`font-mono font-semibold ${
                            trade.profit_ratio > 0
                              ? "text-accent"
                              : "text-destructive"
                          }`}
                        >
                          {trade.profit_ratio > 0 ? "+" : ""}
                          {(trade.profit_ratio * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Current: ${trade.current_rate.toFixed(8)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* No Trades State */}
          {!dashboardLoading && (!openTrades || openTrades.length === 0) && (
            <section>
              <Card className="metric-card text-center py-8">
                <p className="text-muted-foreground">
                  No open trades at the moment
                </p>
              </Card>
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
