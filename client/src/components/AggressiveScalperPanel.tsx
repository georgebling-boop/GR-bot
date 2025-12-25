import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Play, 
  Square, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Zap,
  Target,
  BarChart3,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function AggressiveScalperPanel() {
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [actions, setActions] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sessionQuery = trpc.scalper.getSession.useQuery(undefined, {
    refetchInterval: isAutoTrading ? 2000 : 10000,
  });

  const pricesQuery = trpc.scalper.getPrices.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const initializeMutation = trpc.scalper.initialize.useMutation({
    onSuccess: () => {
      toast.success("Session initialized with $800!");
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
        setActions(prev => [...data.actions, ...prev].slice(0, 20));
        data.actions.forEach(action => {
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
      setActions([]);
      setIsAutoTrading(false);
      sessionQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const backtestMutation = trpc.scalper.backtest.useMutation({
    onSuccess: (data) => {
      toast.success(`Backtest complete! Final: $${data.result.finalBalance.toFixed(2)} (${data.result.totalProfitPercent.toFixed(2)}%)`);
    },
    onError: (error) => toast.error(error.message),
  });

  // Auto-execute trading cycles when auto-trading is enabled
  useEffect(() => {
    if (isAutoTrading) {
      intervalRef.current = setInterval(() => {
        executeCycleMutation.mutate();
      }, 3000); // Execute every 3 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoTrading]);

  const session = sessionQuery.data?.session;
  const prices = pricesQuery.data?.prices || [];

  // Not initialized state
  if (!session) {
    return (
      <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-card/80 border-2 border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="text-accent" size={24} />
              Aggressive Scalping Bot
            </h3>
            <p className="text-muted-foreground">$800 Paper Trading - Buy Low, Sell High</p>
          </div>
          <Button 
            onClick={() => initializeMutation.mutate()} 
            disabled={initializeMutation.isPending}
            size="lg"
            className="bg-accent hover:bg-accent/90"
          >
            <Play size={20} className="mr-2" />
            Start with $800
          </Button>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            This bot uses aggressive scalping strategies to make many small profitable trades.
            It buys when prices dip and sells when they rise, using RSI, Bollinger Bands, and momentum indicators.
          </p>
        </div>
      </Card>
    );
  }

  const profitColor = session.totalProfit >= 0 ? "text-green-500" : "text-red-500";
  const profitBg = session.totalProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10";

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-card to-card/80 border-2 border-accent/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="text-accent" size={24} />
            Aggressive Scalping Bot
            {isAutoTrading && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded-full animate-pulse">
                LIVE TRADING
              </span>
            )}
          </h3>
          <p className="text-muted-foreground text-sm">
            Started: {new Date(session.startedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {!isAutoTrading ? (
            <Button 
              onClick={() => startMutation.mutate()} 
              disabled={startMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play size={16} className="mr-2" />
              Start Trading
            </Button>
          ) : (
            <Button 
              onClick={() => stopMutation.mutate()} 
              disabled={stopMutation.isPending}
              variant="destructive"
            >
              <Square size={16} className="mr-2" />
              Stop Trading
            </Button>
          )}
          <Button 
            onClick={() => resetMutation.mutate()} 
            disabled={resetMutation.isPending}
            variant="outline"
          >
            <RotateCcw size={16} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${profitBg} border border-border`}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className={profitColor} />
            <p className="text-xs text-muted-foreground uppercase">Current Balance</p>
          </div>
          <p className={`text-2xl font-mono font-bold ${profitColor}`}>
            ${session.currentBalance.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Started: ${session.startingBalance.toFixed(2)}
          </p>
        </div>

        <div className={`p-4 rounded-lg ${profitBg} border border-border`}>
          <div className="flex items-center gap-2 mb-1">
            {session.totalProfit >= 0 ? (
              <TrendingUp size={16} className="text-green-500" />
            ) : (
              <TrendingDown size={16} className="text-red-500" />
            )}
            <p className="text-xs text-muted-foreground uppercase">Total Profit</p>
          </div>
          <p className={`text-2xl font-mono font-bold ${profitColor}`}>
            {session.totalProfit >= 0 ? "+" : ""}${session.totalProfit.toFixed(2)}
          </p>
          <p className={`text-xs ${profitColor}`}>
            {session.totalProfitPercent >= 0 ? "+" : ""}{session.totalProfitPercent.toFixed(2)}%
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-accent" />
            <p className="text-xs text-muted-foreground uppercase">Win Rate</p>
          </div>
          <p className="text-2xl font-mono font-bold text-foreground">
            {session.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {session.winningTrades}W / {session.losingTrades}L
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-accent" />
            <p className="text-xs text-muted-foreground uppercase">Total Trades</p>
          </div>
          <p className="text-2xl font-mono font-bold text-foreground">
            {session.totalTrades}
          </p>
          <p className="text-xs text-muted-foreground">
            {session.openTrades.length} open
          </p>
        </div>
      </div>

      {/* Live Prices */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 size={16} />
          Live Market Prices
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {prices.map((price) => (
            <div 
              key={price.symbol} 
              className="p-2 bg-background rounded-lg text-center border border-border"
            >
              <p className="font-mono font-bold text-sm">{price.symbol}</p>
              <p className="text-xs text-foreground">
                ${price.price.toLocaleString("en-US", { maximumFractionDigits: price.price < 1 ? 4 : 2 })}
              </p>
              <p className={`text-xs ${price.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                {price.change24h >= 0 ? "+" : ""}{price.change24h.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Open Trades */}
      {session.openTrades.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} />
            Open Trades ({session.openTrades.length})
          </h4>
          <div className="space-y-2">
            {session.openTrades.map((trade) => {
              const currentPrice = prices.find(p => p.symbol === trade.symbol)?.price || trade.entryPrice;
              const unrealizedPnL = (currentPrice - trade.entryPrice) * trade.quantity;
              const unrealizedPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
              
              return (
                <div 
                  key={trade.id} 
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div>
                    <p className="font-mono font-semibold">{trade.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      Entry: ${trade.entryPrice.toFixed(4)} | Stake: ${trade.stake.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Strategy: {trade.strategy}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-semibold ${unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toFixed(2)}
                    </p>
                    <p className={`text-xs ${unrealizedPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {unrealizedPercent >= 0 ? "+" : ""}{unrealizedPercent.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      TP: ${trade.takeProfit.toFixed(4)} | SL: ${trade.stopLoss.toFixed(4)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Actions */}
      {actions.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity size={16} />
            Recent Activity
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {actions.slice(0, 10).map((action, i) => (
              <p 
                key={i} 
                className={`text-xs font-mono p-2 rounded ${
                  action.includes("TAKE PROFIT") ? "bg-green-500/10 text-green-500" :
                  action.includes("STOP LOSS") ? "bg-red-500/10 text-red-500" :
                  action.includes("BUY") ? "bg-blue-500/10 text-blue-500" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {action}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Performance */}
      {session.strategyStats.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} />
            Strategy Performance
          </h4>
          <div className="space-y-2">
            {session.strategyStats.slice(0, 5).map((stat) => (
              <div 
                key={stat.name} 
                className="flex items-center justify-between p-2 bg-background rounded border border-border"
              >
                <div>
                  <p className="font-mono text-sm">{stat.name.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.trades} trades | {stat.wins}W / {stat.losses}L
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-semibold ${stat.winRate >= 50 ? "text-green-500" : "text-red-500"}`}>
                    {stat.winRate.toFixed(1)}% win
                  </p>
                  <p className={`text-xs ${stat.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    ${stat.totalProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backtest Button */}
      <div className="flex gap-2">
        <Button 
          onClick={() => backtestMutation.mutate({ days: 7 })} 
          disabled={backtestMutation.isPending || isAutoTrading}
          variant="outline"
          className="flex-1"
        >
          <BarChart3 size={16} className="mr-2" />
          {backtestMutation.isPending ? "Running 7-Day Backtest..." : "Run 7-Day Backtest"}
        </Button>
        <Button 
          onClick={() => backtestMutation.mutate({ days: 30 })} 
          disabled={backtestMutation.isPending || isAutoTrading}
          variant="outline"
          className="flex-1"
        >
          <BarChart3 size={16} className="mr-2" />
          {backtestMutation.isPending ? "Running 30-Day Backtest..." : "Run 30-Day Backtest"}
        </Button>
      </div>
    </Card>
  );
}
