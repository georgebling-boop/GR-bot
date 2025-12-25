import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { PieChart, TrendingUp, TrendingDown, Shield, Target } from "lucide-react";

export function PortfolioDisplay() {
  const { data: summary } = trpc.portfolio.getSummary.useQuery();
  const { data: chartData } = trpc.portfolio.getAllocationChartData.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChart className="h-5 w-5 text-purple-500" />
          Portfolio Diversification
          {summary && (
            <Badge 
              variant="outline" 
              className={`ml-auto text-xs ${summary.totalProfitLoss >= 0 ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}
            >
              {formatPercent(summary.totalProfitLossPercent)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Value */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="text-xs text-zinc-500 mb-1">Total Value</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(summary.totalValue)}</div>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="text-xs text-zinc-500 mb-1">P&L</div>
              <div className={`text-2xl font-bold flex items-center gap-1 ${summary.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.totalProfitLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {formatCurrency(Math.abs(summary.totalProfitLoss))}
              </div>
            </div>
          </div>
        )}

        {/* Scores */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-zinc-400">Diversification</span>
              </div>
              <Progress value={summary.diversificationScore} className="h-2" />
              <div className="text-right text-xs text-zinc-500 mt-1">{summary.diversificationScore}/100</div>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-zinc-400">Risk Level</span>
              </div>
              <Progress value={summary.riskScore} className="h-2 [&>div]:bg-orange-500" />
              <div className="text-right text-xs text-zinc-500 mt-1">{summary.riskScore}/100</div>
            </div>
          </div>
        )}

        {/* Holdings */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-zinc-400">Holdings</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {chartData && chartData.length > 0 ? (
              chartData.map((holding, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: holding.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{holding.symbol}</span>
                      <span className="text-sm text-zinc-400">{formatCurrency(holding.value)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{holding.name}</span>
                      <span>{holding.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-500 py-4">
                No holdings yet. Start trading to build your portfolio.
              </div>
            )}
          </div>
        </div>

        {/* Allocation Bar */}
        {chartData && chartData.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-400">Allocation</div>
            <div className="h-4 rounded-full overflow-hidden flex">
              {chartData.map((holding, i) => (
                <div
                  key={i}
                  className="h-full transition-all"
                  style={{ 
                    width: `${holding.percentage}%`, 
                    backgroundColor: holding.color,
                  }}
                  title={`${holding.symbol}: ${holding.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {chartData.map((holding, i) => (
                <div key={i} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: holding.color }}
                  />
                  <span className="text-zinc-400">{holding.symbol}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
