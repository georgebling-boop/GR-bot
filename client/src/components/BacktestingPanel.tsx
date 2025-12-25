import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  FlaskConical,
  Play,
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BacktestSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalProfitPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  finalBalance: number;
}

export function BacktestingPanel() {
  const [symbol, setSymbol] = useState("BTC");
  const [strategy, setStrategy] = useState("momentum");
  const [days, setDays] = useState(30);
  const [initialBalance, setInitialBalance] = useState(800);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [positionSize, setPositionSize] = useState(5);
  const [takeProfit, setTakeProfit] = useState(2);
  const [stopLoss, setStopLoss] = useState(1.5);
  
  const [lastResult, setLastResult] = useState<BacktestSummary | null>(null);
  const [comparisonResults, setComparisonResults] = useState<Array<{
    strategy: string;
    winRate: number;
    totalProfit: number;
    totalProfitPercent: number;
    totalTrades: number;
    maxDrawdown: number;
    sharpeRatio: number;
    finalBalance: number;
  }> | null>(null);
  
  const { data: statsData } = trpc.backtest.getStats.useQuery();
  const { data: historyData, refetch: refetchHistory } = trpc.backtest.getHistory.useQuery({ limit: 5 });
  
  const runBacktestMutation = trpc.backtest.run.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setLastResult(data.result.summary);
        refetchHistory();
      }
    },
  });
  
  const compareStrategiesMutation = trpc.backtest.compareStrategies.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setComparisonResults(data.comparison);
        refetchHistory();
      }
    },
  });
  
  const handleRunBacktest = () => {
    runBacktestMutation.mutate({
      strategy,
      symbol,
      days,
      initialBalance,
      positionSizePercent: positionSize,
      takeProfitPercent: takeProfit,
      stopLossPercent: stopLoss,
    });
  };
  
  const handleCompareAll = () => {
    compareStrategiesMutation.mutate({
      symbol,
      days,
      initialBalance,
    });
  };
  
  const isLoading = runBacktestMutation.isPending || compareStrategiesMutation.isPending;
  
  const strategies = [
    { value: "momentum", label: "Momentum" },
    { value: "rsi_scalp", label: "RSI Scalp" },
    { value: "bollinger_bounce", label: "Bollinger Bounce" },
    { value: "mean_reversion", label: "Mean Reversion" },
    { value: "rsi_macd_bb", label: "RSI+MACD+BB Combined" },
  ];
  
  const symbols = ["BTC", "ETH", "SOL", "ADA", "XRP", "DOGE"];
  
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-lg">Strategy Backtesting</CardTitle>
          </div>
          {statsData && statsData.totalBacktests > 0 && (
            <Badge variant="outline" className="text-purple-400 border-purple-400/50">
              {statsData.totalBacktests} tests run
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Configuration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Strategy</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {strategies.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Days to Test</Label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={1}
              max={365}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Initial Balance</Label>
            <Input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(Number(e.target.value))}
              min={100}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
        
        {/* Advanced settings toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-zinc-400 hover:text-white"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          Advanced Settings
        </Button>
        
        {showAdvanced && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Position Size %</Label>
              <Input
                type="number"
                value={positionSize}
                onChange={(e) => setPositionSize(Number(e.target.value))}
                min={1}
                max={100}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Take Profit %</Label>
              <Input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Stop Loss %</Label>
              <Input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleRunBacktest}
            disabled={isLoading}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {runBacktestMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run Backtest
          </Button>
          <Button
            onClick={handleCompareAll}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
          >
            {compareStrategiesMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            Compare All
          </Button>
        </div>
        
        {/* Single backtest result */}
        {lastResult && !comparisonResults && (
          <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Backtest Results</span>
              <Badge className={lastResult.totalProfit >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {lastResult.totalProfit >= 0 ? "+" : ""}{lastResult.totalProfitPercent.toFixed(2)}%
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Win Rate</span>
                <span className={lastResult.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                  {lastResult.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Trades</span>
                <span>{lastResult.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Profit</span>
                <span className={lastResult.totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
                  ${lastResult.totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Max Drawdown</span>
                <span className="text-orange-400">{lastResult.maxDrawdown.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Sharpe Ratio</span>
                <span>{lastResult.sharpeRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Final Balance</span>
                <span className="text-white font-medium">${lastResult.finalBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Strategy comparison results */}
        {comparisonResults && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Strategy Comparison</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setComparisonResults(null)}
                className="text-xs text-zinc-400"
              >
                Clear
              </Button>
            </div>
            
            {comparisonResults.map((result, index) => (
              <div
                key={result.strategy}
                className={`p-3 rounded-lg border ${
                  index === 0 
                    ? "bg-yellow-500/10 border-yellow-500/30" 
                    : "bg-zinc-800/50 border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
                    <span className="font-medium capitalize">
                      {result.strategy.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Badge className={result.totalProfit >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {result.totalProfit >= 0 ? "+" : ""}${result.totalProfit.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500">Win Rate</span>
                    <p className={result.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                      {result.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Trades</span>
                    <p>{result.totalTrades}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Drawdown</span>
                    <p className="text-orange-400">{result.maxDrawdown.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Sharpe</span>
                    <p>{result.sharpeRatio.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Recent backtests */}
        {historyData && historyData.results.length > 0 && !comparisonResults && (
          <div className="space-y-2">
            <span className="text-xs text-zinc-400">Recent Backtests</span>
            {historyData.results.slice(0, 3).map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-zinc-800/30 rounded text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-zinc-400 border-zinc-600">
                    {result.symbol}
                  </Badge>
                  <span className="capitalize">{result.strategy.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={result.summary.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                    {result.summary.winRate.toFixed(0)}% WR
                  </span>
                  <span className={result.summary.totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
                    {result.summary.totalProfit >= 0 ? "+" : ""}${result.summary.totalProfit.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Stats footer */}
        {statsData && (
          <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between">
            <span>Best: {statsData.bestStrategy} ({(statsData.bestWinRate * 100).toFixed(0)}% WR)</span>
            <span>Avg WR: {(statsData.averageWinRate * 100).toFixed(0)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
