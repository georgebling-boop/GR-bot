import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePerformance, type TimeRange } from "@/hooks/usePerformance";
import { TrendingUp, RefreshCw } from "lucide-react";

export default function EquityCurveChart() {
  const { selectedRange, setSelectedRange, isLoading, equityCurve, metrics, refetch } =
    usePerformance("30d");

  const timeRanges: TimeRange[] = ["24h", "7d", "30d", "90d"];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const chartData = equityCurve?.points.map((point) => ({
    timestamp: point.timestamp,
    date: formatDate(point.timestamp),
    equity: parseFloat(point.equity.toFixed(2)),
    profit: parseFloat(point.profit.toFixed(2)),
  })) || [];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Equity Curve</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {timeRanges.map((range) => (
          <Button
            key={range}
            size="sm"
            variant={selectedRange === range ? "default" : "outline"}
            onClick={() => setSelectedRange(range)}
            disabled={isLoading}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Return</p>
            <p className={`font-mono font-semibold ${metrics.totalProfitPercent >= 0 ? "text-accent" : "text-destructive"}`}>
              {metrics.totalProfitPercent.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max DD</p>
            <p className="font-mono font-semibold text-destructive">
              -{metrics.maxDrawdown.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start Equity</p>
            <p className="font-mono font-semibold text-foreground">
              ${metrics.startEquity.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">End Equity</p>
            <p className={`font-mono font-semibold ${metrics.endEquity >= metrics.startEquity ? "text-accent" : "text-destructive"}`}>
              ${metrics.endEquity.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="w-full h-80 mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value: number) => [
                  `$${value.toFixed(2)}`,
                  value === chartData[0]?.equity ? "Equity" : "Profit",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="var(--chart-1)"
                dot={false}
                strokeWidth={2}
                name="Equity"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="var(--chart-2)"
                dot={false}
                strokeWidth={2}
                name="Profit"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
