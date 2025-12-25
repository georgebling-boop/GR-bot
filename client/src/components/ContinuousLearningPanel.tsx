import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
  Clock,
  Cpu,
  Activity,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ContinuousLearningPanel() {
  const [showEvolution, setShowEvolution] = useState(false);

  // Query the continuous learning AI
  const statsQuery = trpc.ai.getStats.useQuery(undefined, {
    refetchInterval: 3000, // Refresh every 3 seconds to show real-time learning
  });

  const brainQuery = trpc.ai.getBrainState.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const evolutionQuery = trpc.ai.getEvolution.useQuery(undefined, {
    refetchInterval: 10000,
    enabled: showEvolution,
  });

  const weightsQuery = trpc.ai.getStrategyWeights.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const timingQuery = trpc.ai.checkTradingTime.useQuery(undefined, {
    refetchInterval: 60000, // Check every minute
  });

  const resetMutation = trpc.ai.reset.useMutation({
    onSuccess: () => {
      toast.info("AI brain reset to initial state");
      statsQuery.refetch();
      brainQuery.refetch();
    },
  });

  const stats = statsQuery.data;
  const brain = brainQuery.data;
  const evolution = evolutionQuery.data || [];
  const weights = weightsQuery.data || {};
  const timing = timingQuery.data;

  if (!stats || !brain) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Brain className="text-purple-500 animate-pulse" size={20} />
          <span className="text-muted-foreground">Initializing AI brain...</span>
        </div>
      </Card>
    );
  }

  // Sort strategies by weight
  const sortedStrategies = Object.entries(weights)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Evolution chart data
  const evolutionData = evolution.map((e, i) => ({
    index: i,
    winRate: e.winRate,
    avgProfit: e.avgProfit,
    trades: e.totalTrades,
  }));

  return (
    <Card className="p-4 space-y-4 border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="text-purple-500" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Continuous Learning AI
              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                v{stats.version}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Learning from every trade • No limits
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowEvolution(!showEvolution)}
            size="sm"
            variant="outline"
            className="text-purple-500 border-purple-500/30 hover:bg-purple-500/10"
          >
            <Activity size={14} className="mr-1" />
            {showEvolution ? "Hide" : "Show"} Evolution
          </Button>
          <Button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Real-time Learning Status */}
      <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-400 animate-pulse" size={16} />
          <span className="text-sm text-purple-300">
            {stats.totalCycles > 0 ? "Actively Learning" : "Ready to Learn"}
          </span>
        </div>
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(stats.confidence, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {stats.confidence.toFixed(0)}% confident
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Learning Cycles */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Cpu size={12} className="text-purple-500" />
            <span className="text-xs text-muted-foreground">Cycles</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">
            {stats.totalCycles.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">learning iterations</p>
        </div>

        {/* Trades Analyzed */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 size={12} className="text-blue-500" />
            <span className="text-xs text-muted-foreground">Analyzed</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">
            {stats.totalTrades.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">trades learned</p>
        </div>

        {/* Win Rate */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Target size={12} className="text-green-500" />
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
          <p className={`text-lg font-mono font-bold ${stats.winRate >= 60 ? "text-green-500" : stats.winRate >= 50 ? "text-yellow-500" : "text-red-500"}`}>
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">predicted accuracy</p>
        </div>

        {/* Patterns Learned */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Zap size={12} className="text-yellow-500" />
            <span className="text-xs text-muted-foreground">Patterns</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">
            {stats.patternsLearned.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">neural memories</p>
        </div>
      </div>

      {/* Trading Time Recommendation */}
      {timing && (
        <div className={`p-3 rounded-lg flex items-center gap-3 ${
          timing.isGood 
            ? "bg-green-500/10 border border-green-500/30" 
            : "bg-orange-500/10 border border-orange-500/30"
        }`}>
          <Clock size={16} className={timing.isGood ? "text-green-500" : "text-orange-500"} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${timing.isGood ? "text-green-400" : "text-orange-400"}`}>
              {timing.isGood ? "Good Time to Trade" : "Suboptimal Trading Time"}
            </p>
            <p className="text-xs text-muted-foreground">{timing.reason}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {timing.confidence}% confidence
          </span>
        </div>
      )}

      {/* Strategy Weights */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Strategy Performance (Learned Weights)</p>
          <span className="text-xs text-purple-400">
            Learning rate: {(brain.learningRate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="space-y-2">
          {sortedStrategies.map(([strategy, weight], index) => {
            const weightNum = weight as number;
            const isTop = index === 0;
            const isBottom = index === sortedStrategies.length - 1;
            
            return (
              <div key={strategy} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground truncate">
                  {strategy.replace(/_/g, " ")}
                </div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isTop ? "bg-green-500" : isBottom ? "bg-red-500" : "bg-purple-500"
                    }`}
                    style={{ width: `${Math.min((weightNum / 2) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 w-16 justify-end">
                  {weightNum > 1.1 ? (
                    <ArrowUpRight size={12} className="text-green-500" />
                  ) : weightNum < 0.9 ? (
                    <ArrowDownRight size={12} className="text-red-500" />
                  ) : null}
                  <span className={`text-xs font-mono ${
                    weightNum > 1.1 ? "text-green-500" : weightNum < 0.9 ? "text-red-500" : "text-muted-foreground"
                  }`}>
                    {weightNum.toFixed(2)}x
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adaptive Parameters */}
      <div className="p-3 bg-purple-500/10 rounded-lg">
        <p className="text-xs text-purple-400 mb-2 flex items-center gap-1">
          <Sparkles size={12} />
          AI-Optimized Parameters (Auto-adjusted)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Take Profit:</span>
            <span className="ml-1 text-foreground font-mono">
              {brain.adaptiveParameters.takeProfitPercent.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Stop Loss:</span>
            <span className="ml-1 text-foreground font-mono">
              {brain.adaptiveParameters.stopLossPercent.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Position Size:</span>
            <span className="ml-1 text-foreground font-mono">
              {brain.adaptiveParameters.positionSizePercent.toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Entry Threshold:</span>
            <span className="ml-1 text-foreground font-mono">
              {brain.adaptiveParameters.entryConfidenceThreshold.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Timing Optimization */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Learned Trading Hours</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Best hours:</span>
          {brain.timingOptimization.bestHours.map((hour) => (
            <span key={hour} className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
              {hour}:00
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-2">Avoid:</span>
          {brain.timingOptimization.worstHours.map((hour) => (
            <span key={hour} className="px-2 py-0.5 text-xs bg-red-500/20 text-red-500 rounded-full">
              {hour}:00
            </span>
          ))}
        </div>
      </div>

      {/* Evolution Chart */}
      {showEvolution && evolutionData.length > 0 && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">AI Evolution Over Time</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <XAxis 
                  dataKey="index" 
                  stroke="#666" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1a1a1a", 
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  dot={false}
                  name="Win Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Risk Learning */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Risk Management (Learned)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Optimal Position:</span>
            <span className="ml-1 text-foreground font-mono">
              {brain.riskLearning.optimalPositionSize.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Risk/Reward:</span>
            <span className="ml-1 text-foreground font-mono">
              1:{brain.riskLearning.riskRewardRatio.toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Max Drawdown:</span>
            <span className="ml-1 text-foreground font-mono">
              {brain.riskLearning.maxDrawdownTolerance}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
        <span>
          Last updated: {new Date(brain.lastUpdate).toLocaleTimeString()}
        </span>
        <span className="flex items-center gap-1">
          <Sparkles size={12} className="text-purple-500" />
          Unlimited learning potential
        </span>
      </div>
    </Card>
  );
}
