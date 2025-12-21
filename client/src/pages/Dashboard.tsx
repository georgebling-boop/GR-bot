import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Zap, Target } from "lucide-react";

/**
 * Dashboard - Main trading bot monitoring interface
 * Design: Modern Minimalist with Data Emphasis
 * - Dark background with emerald accents
 * - Data-first layout with clear hierarchy
 * - Real-time metrics and status indicators
 */

interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  subtext?: string;
}

function MetricCard({ label, value, unit, trend, subtext }: MetricProps) {
  return (
    <Card className="metric-card">
      <div className="space-y-2">
        <p className="metric-label">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="metric-value">{value}</span>
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

  // Mock data - in production, this would come from Freqtrade REST API
  const mockData = {
    botStatus: "Running",
    totalProfit: 1247.53,
    profitPercent: 12.47,
    winRate: 74.5,
    totalTrades: 143,
    openTrades: 5,
    maxDrawdown: 8.2,
    sharpeRatio: 2.34,
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
              <div className="flex items-center gap-3">
                <div className="status-indicator status-active" />
                <span className="text-sm font-medium text-accent">
                  {mockData.botStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                value={`$${mockData.totalProfit.toFixed(2)}`}
                trend="up"
                subtext={`+${mockData.profitPercent}%`}
              />
              <MetricCard
                label="Win Rate"
                value={`${mockData.winRate}%`}
                trend="up"
                subtext="Above target"
              />
              <MetricCard
                label="Open Trades"
                value={mockData.openTrades}
                unit="active"
                trend="neutral"
              />
              <MetricCard
                label="Max Drawdown"
                value={`${mockData.maxDrawdown}%`}
                trend="down"
                subtext="Within limits"
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
                value={mockData.totalTrades}
                trend="up"
                subtext="This month"
              />
              <MetricCard
                label="Sharpe Ratio"
                value={mockData.sharpeRatio}
                trend="up"
                subtext="Risk-adjusted return"
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

          {/* Recent Activity */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Recent Trades
            </h2>
            <Card className="metric-card">
              <div className="space-y-4">
                {[
                  {
                    pair: "BTC/USDT",
                    entry: 42150.25,
                    current: 42380.5,
                    profit: "+0.54%",
                    time: "2 hours ago",
                  },
                  {
                    pair: "ETH/USDT",
                    entry: 2280.75,
                    current: 2295.2,
                    profit: "+0.63%",
                    time: "1 hour ago",
                  },
                  {
                    pair: "SOL/USDT",
                    entry: 198.5,
                    current: 201.25,
                    profit: "+1.39%",
                    time: "45 min ago",
                  },
                ].map((trade, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between pb-4 border-b border-border last:border-b-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-mono font-semibold text-foreground">
                        {trade.pair}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Entry: ${trade.entry}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-accent font-mono font-semibold">
                        {trade.profit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trade.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
