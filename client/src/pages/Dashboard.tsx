import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,

  RefreshCw,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { ContinuousLearningPanel } from "@/components/ContinuousLearningPanel";
import { TradeAlertsPanel } from "@/components/TradeAlertsPanel";
import { BrainPersistencePanel } from "@/components/BrainPersistencePanel";
import { HyperliquidPanel } from "@/components/HyperliquidPanel";

/**
 * George's Trade Bot Dashboard
 * Clean, simple layout inspired by EdPsychConnect
 */

export default function Dashboard() {
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scalper queries
  const sessionQuery = trpc.scalper.getSession.useQuery(undefined, {
    refetchInterval: isAutoTrading ? 2000 : 10000,
  });

  const pricesQuery = trpc.scalper.getPrices.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const initializeMutation = trpc.scalper.initialize.useMutation({
    onSuccess: () => {
      toast.success("Trading session initialized with $800!");
      sessionQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const startMutation = trpc.scalper.start.useMutation({
    onSuccess: () => {
      toast.success("Auto-trading started!");
      setIsAutoTrading(true);
      sessionQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const stopMutation = trpc.scalper.stop.useMutation({
    onSuccess: () => {
      toast.info("Auto-trading stopped");
      setIsAutoTrading(false);
      sessionQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const executeCycleMutation = trpc.scalper.executeCycle.useMutation({
    onSuccess: (data) => {
      if (data.actions.length > 0) {
        data.actions.forEach((action) => {
          if (action.includes("TAKE PROFIT")) {
            toast.success(action);
          } else if (action.includes("STOP LOSS")) {
            toast.error(action);
          } else if (action.includes("BUY")) {
            toast.info(action);
          }
        });
      }
      sessionQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetMutation = trpc.scalper.reset.useMutation({
    onSuccess: () => {
      toast.success("Session reset to $800!");
      setEquityHistory([]);
      setIsAutoTrading(false);
      sessionQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // Auto-execute trading cycles
  useEffect(() => {
    if (isAutoTrading) {
      intervalRef.current = setInterval(() => {
        executeCycleMutation.mutate();
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoTrading]);

  // Track equity history
  useEffect(() => {
    const session = sessionQuery.data?.session;
    if (session && session.currentBalance > 0) {
      setEquityHistory((prev) => {
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          equity: session.currentBalance,
        };
        const updated = [...prev, newEntry].slice(-100);
        return updated;
      });
    }
  }, [sessionQuery.data?.session?.currentBalance]);

  const session = sessionQuery.data?.session;
  const prices = pricesQuery.data?.prices || [];

  // Calculate metrics
  const equity = session?.currentBalance || 800;
  const startingBalance = session?.startingBalance || 800;
  const totalProfit = session?.totalProfit || 0;
  const profitPercent = session?.totalProfitPercent || 0;
  const winRate = session?.winRate || 0;
  const openPositions = session?.openTrades.length || 0;
  const totalTrades = session?.totalTrades || 0;

  // Calculate daily PnL (simplified - last 24h of trades)
  const dailyPnL = session?.closedTrades
    .filter((t) => {
      const closedAt = new Date(t.closedAt || "");
      const now = new Date();
      return now.getTime() - closedAt.getTime() < 24 * 60 * 60 * 1000;
    })
    .reduce((sum, t) => sum + t.profit, 0) || 0;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = startingBalance;
  equityHistory.forEach((point) => {
    if (point.equity > peak) peak = point.equity;
    const drawdown = ((peak - point.equity) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const isConnected = sessionQuery.isSuccess && !sessionQuery.isError;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Zap className="text-accent" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">George's Trade Bot</h1>
                <p className="text-sm text-muted-foreground">Aggressive Scalping Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-sm text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-red-500" size={16} />
                    <span className="text-sm text-red-500">Disconnected</span>
                  </>
                )}
              </div>
              {/* Trading Status */}
              {isAutoTrading && (
                <span className="px-3 py-1 text-xs bg-green-500/20 text-green-500 rounded-full animate-pulse font-medium">
                  LIVE TRADING
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
         {/* Loading State */}
        {!session && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-accent/20 rounded-full w-fit mx-auto">
                <Activity className="text-accent animate-pulse" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Initializing Trading Bot...</h2>
              <p className="text-muted-foreground">
                The AI trading bot is starting up automatically. It will begin trading and learning in a few seconds.
              </p>
              <div className="flex items-center justify-center gap-2 text-green-400">
                <Activity size={16} className="animate-spin" />
                <span>Auto-starting 24/7 trading...</span>
              </div>
            </div>
          </Card>
        )}

        {/* Main Dashboard */}
        {session && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Equity */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-accent" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Equity</span>
                </div>
                <p className={`text-2xl font-mono font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${equity.toFixed(2)}
                </p>
                <p className={`text-xs ${profitPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(2)}% all time
                </p>
              </Card>

              {/* Daily PnL */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {dailyPnL >= 0 ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Daily PnL</span>
                </div>
                <p className={`text-2xl font-mono font-bold ${dailyPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {dailyPnL >= 0 ? "+" : ""}${dailyPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </Card>

              {/* Drawdown */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-orange-500" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Drawdown</span>
                </div>
                <p className="text-2xl font-mono font-bold text-orange-500">
                  {maxDrawdown.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">Max drawdown</p>
              </Card>

              {/* Open Positions */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-accent" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Positions</span>
                </div>
                <p className="text-2xl font-mono font-bold text-foreground">{openPositions}</p>
                <p className="text-xs text-muted-foreground">{totalTrades} total trades</p>
              </Card>
            </div>

            {/* Controls */}
            <Card className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Win Rate</p>
                    <p className={`text-lg font-mono font-bold ${winRate >= 50 ? "text-green-500" : "text-red-500"}`}>
                      {winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-sm font-medium text-foreground">W/L</p>
                    <p className="text-lg font-mono">
                      <span className="text-green-500">{session.winningTrades}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-500">{session.losingTrades}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    <Activity size={14} className="animate-pulse" />
                    Auto-Trading 24/7
                  </div>
                  <Button
                    onClick={() => sessionQuery.refetch()}
                    variant="outline"
                    size="icon"
                    title="Refresh data"
                  >
                    <RefreshCw size={16} />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Equity Curve */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Equity Curve</h3>
                <div className="flex gap-1">
                  {(["24h", "7d", "30d", "all"] as const).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className="text-xs"
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                {equityHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityHistory}>
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="time" stroke="#666" fontSize={10} />
                      <YAxis stroke="#666" fontSize={10} domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#999" }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#equityGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Start trading to see equity curve</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Live Prices */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Live Market Prices</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {prices.map((price) => (
                  <div
                    key={price.symbol}
                    className="p-3 bg-muted/50 rounded-lg text-center border border-border"
                  >
                    <p className="font-mono font-bold text-sm">{price.symbol}</p>
                    <p className="text-sm text-foreground">
                      ${price.price.toLocaleString("en-US", {
                        maximumFractionDigits: price.price < 1 ? 4 : 2,
                      })}
                    </p>
                    <p
                      className={`text-xs ${
                        price.change24h >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {price.change24h >= 0 ? "+" : ""}
                      {price.change24h.toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Open Trades */}
            {session.openTrades.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-4">
                  Open Positions ({session.openTrades.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-medium">Symbol</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Entry</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Current</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Stake</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.openTrades.map((trade) => {
                        const currentPrice =
                          prices.find((p) => p.symbol === trade.symbol)?.price || trade.entryPrice;
                        const unrealizedPnL = (currentPrice - trade.entryPrice) * trade.quantity;
                        const unrealizedPercent =
                          ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

                        return (
                          <tr key={trade.id} className="border-b border-border/50">
                            <td className="py-3 font-mono font-medium">{trade.symbol}</td>
                            <td className="py-3 font-mono text-muted-foreground">
                              ${trade.entryPrice.toFixed(4)}
                            </td>
                            <td className="py-3 font-mono">${currentPrice.toFixed(4)}</td>
                            <td className="py-3 font-mono text-muted-foreground">
                              ${trade.stake.toFixed(2)}
                            </td>
                            <td
                              className={`py-3 text-right font-mono font-medium ${
                                unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toFixed(2)} (
                              {unrealizedPercent >= 0 ? "+" : ""}
                              {unrealizedPercent.toFixed(2)}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Hyperliquid Exchange Integration - Live Trading */}
            <HyperliquidPanel />

            {/* Continuous Learning AI - Learns from every trade */}
            <ContinuousLearningPanel />

            {/* Trade Alerts & Brain Persistence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TradeAlertsPanel />
              <BrainPersistencePanel />
            </div>

            {/* Recent Trades */}
            {session.closedTrades.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-4">
                  Recent Trades ({session.closedTrades.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-medium">Symbol</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Strategy</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Entry</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Exit</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.closedTrades.slice(-10).reverse().map((trade) => (
                        <tr key={trade.id} className="border-b border-border/50">
                          <td className="py-3 font-mono font-medium">{trade.symbol}</td>
                          <td className="py-3 text-muted-foreground text-xs">
                            {trade.strategy.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 font-mono text-muted-foreground">
                            ${trade.entryPrice.toFixed(4)}
                          </td>
                          <td className="py-3 font-mono">
                            ${trade.exitPrice?.toFixed(4) || "-"}
                          </td>
                          <td
                            className={`py-3 text-right font-mono font-medium ${
                              trade.profit >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)} (
                            {trade.profitPercent >= 0 ? "+" : ""}
                            {trade.profitPercent.toFixed(2)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Strategy Performance */}
            {session.strategyStats.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-4">Strategy Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {session.strategyStats.slice(0, 6).map((stat) => (
                    <div
                      key={stat.name}
                      className="p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <p className="font-medium text-sm text-foreground mb-1">
                        {stat.name.replace(/_/g, " ")}
                      </p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{stat.trades} trades</span>
                        <span
                          className={`font-mono ${
                            stat.winRate >= 50 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {stat.winRate.toFixed(0)}% win
                        </span>
                      </div>
                      <p
                        className={`text-sm font-mono mt-1 ${
                          stat.totalProfit >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {stat.totalProfit >= 0 ? "+" : ""}${stat.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-muted-foreground">
          <p>⚠️ Live Trading Active • High Risk • Not Financial Advice • Trade at Your Own Risk</p>
        </footer>
      </main>
    </div>
  );
}
