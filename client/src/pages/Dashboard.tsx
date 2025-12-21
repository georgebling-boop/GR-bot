import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SystemHealthMonitor from "@/components/SystemHealthMonitor";
import { OpenTradesPageContent } from "./OpenTradesPage";
import { TradeHistoryPageContent } from "./TradeHistoryPage";
import { PerformancePageContent } from "./PerformancePage";
import { SettingsPageContent } from "./SettingsPage";
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

  // Route to Open Trades page
  if (activeNav === "trades") {
    return (
      <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
        <OpenTradesPageContent />
      </DashboardLayout>
    );
  }

  // Route to Trade History page
  if (activeNav === "history") {
    return (
      <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
        <TradeHistoryPageContent />
      </DashboardLayout>
    );
  }

  // Route to Performance page
  if (activeNav === "performance") {
    return (
      <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
        <PerformancePageContent />
      </DashboardLayout>
    );
  }

  // Route to System Health page
  if (activeNav === "health") {
    return (
      <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="h-full overflow-auto bg-gradient-to-b from-background to-background">
          {/* Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
            <div className="container py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    System Health
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Real-time monitoring of bot performance and system resources
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container py-8">
            <SystemHealthMonitor />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Route to Settings page
  if (activeNav === "settings") {
    return (
      <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
        <SettingsPageContent />
      </DashboardLayout>
    );
  }

  // Default: Overview page
  const {
    dashboard,
    dashboardLoading,
    dashboardError,
    openTrades,
    performance,
    refresh,
  } = useFreqtradeDashboard(5000);

  const handleRefresh = async () => {
    await refresh();
    toast.success("Dashboard refreshed");
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
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent">
                  <div className="w-2 h-2 rounded-full bg-accent" />
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
          {/* Key Metrics */}
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
            <h2 className="text-xl font-bold text-foreground mb-4">
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

          {/* Recent Trades */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Recent Open Trades
            </h2>
            {openTrades && openTrades.length > 0 ? (
              <div className="space-y-3">
                {openTrades.slice(0, 5).map((trade) => (
                  <Card key={trade.trade_id} className="metric-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold text-foreground">
                          {trade.pair}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entry: ${trade.open_rate.toFixed(8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-mono font-bold ${
                            trade.profit_ratio > 0
                              ? "text-accent"
                              : "text-destructive"
                          }`}
                        >
                          {trade.profit_ratio > 0 ? "+" : ""}
                          {(trade.profit_ratio * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${trade.profit_abs.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="metric-card text-center py-8">
                <p className="text-muted-foreground">
                  {dashboardLoading
                    ? "Loading trades..."
                    : "No open trades at the moment"}
                </p>
              </Card>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
