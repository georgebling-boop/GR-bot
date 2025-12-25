import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Target,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  DollarSign,
  Clock,
  BarChart3,
  Heart,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";

export function AdvancedTradingPanel() {
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: session, refetch: refetchSession } = trpc.advanced.getSession.useQuery(undefined, {
    refetchInterval: 2000,
  });

  const { data: botHealth } = trpc.advanced.getBotHealth.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const { data: weeklyTarget } = trpc.advanced.getWeeklyTarget.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: riskManagement } = trpc.advanced.getRiskManagement.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: analytics } = trpc.advanced.getPerformanceAnalytics.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const initSession = trpc.advanced.initSession.useMutation({
    onSuccess: () => {
      setIsInitialized(true);
      refetchSession();
    },
  });

  const startTrading = trpc.advanced.startTrading.useMutation({
    onSuccess: () => refetchSession(),
  });

  const stopTrading = trpc.advanced.stopTrading.useMutation({
    onSuccess: () => refetchSession(),
  });

  const resetSession = trpc.advanced.resetSession.useMutation({
    onSuccess: () => refetchSession(),
  });

  useEffect(() => {
    if (session) {
      setIsInitialized(true);
    }
  }, [session]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Bot Health Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Bot Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Status
              </div>
              <div className={`font-mono text-lg font-bold ${
                botHealth?.status === "healthy" ? "text-emerald-500" :
                botHealth?.status === "warning" ? "text-yellow-500" : "text-red-500"
              }`}>
                {botHealth?.status?.toUpperCase() || "OFFLINE"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Uptime
              </div>
              <div className="font-mono text-lg">
                {botHealth ? formatUptime(botHealth.uptime) : "0h 0m"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="h-4 w-4" />
                CPU
              </div>
              <div className="space-y-1">
                <div className="font-mono text-sm">{botHealth?.cpuUsage.toFixed(1)}%</div>
                <Progress value={botHealth?.cpuUsage || 0} className="h-1" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                Memory
              </div>
              <div className="space-y-1">
                <div className="font-mono text-sm">{botHealth?.memoryUsage.toFixed(1)}%</div>
                <Progress value={botHealth?.memoryUsage || 0} className="h-1" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">API Latency</div>
              <div className={`font-mono font-bold ${
                (botHealth?.apiLatency || 0) < 100 ? "text-emerald-500" :
                (botHealth?.apiLatency || 0) < 300 ? "text-yellow-500" : "text-red-500"
              }`}>
                {botHealth?.apiLatency.toFixed(0)}ms
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Trades/Min</div>
              <div className="font-mono font-bold text-blue-500">
                {botHealth?.tradesPerMinute.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Error Rate</div>
              <div className={`font-mono font-bold ${
                (botHealth?.errorRate || 0) < 1 ? "text-emerald-500" :
                (botHealth?.errorRate || 0) < 3 ? "text-yellow-500" : "text-red-500"
              }`}>
                {botHealth?.errorRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Target Progress */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            Weekly Profit Target: $100+
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Progress</span>
              <span className={`font-mono font-bold ${
                weeklyTarget?.onTrack ? "text-emerald-500" : "text-yellow-500"
              }`}>
                ${weeklyTarget?.currentProfit.toFixed(2)} / ${weeklyTarget?.targetProfit}
              </span>
            </div>
            <Progress 
              value={weeklyTarget?.progressPercent || 0} 
              className="h-3"
            />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Days Left</div>
                <div className="font-mono font-bold">{weeklyTarget?.daysRemaining || 7}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Daily Target</div>
                <div className="font-mono font-bold text-yellow-500">
                  ${weeklyTarget?.dailyTargetRemaining.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Projected</div>
                <div className={`font-mono font-bold ${
                  (weeklyTarget?.projectedProfit || 0) >= 100 ? "text-emerald-500" : "text-red-500"
                }`}>
                  ${weeklyTarget?.projectedProfit.toFixed(2)}
                </div>
              </div>
            </div>
            {weeklyTarget?.onTrack ? (
              <div className="flex items-center gap-2 text-emerald-500 text-sm">
                <CheckCircle className="h-4 w-4" />
                On track to hit weekly target!
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-500 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Need to increase trading activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Win Rate Target */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            90% Win Rate Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Win Rate</span>
              <span className={`font-mono text-2xl font-bold ${
                (session?.winRate || 0) >= 90 ? "text-emerald-500" :
                (session?.winRate || 0) >= 70 ? "text-yellow-500" : "text-red-500"
              }`}>
                {session?.winRate.toFixed(1) || 0}%
              </span>
            </div>
            <Progress 
              value={(session?.winRate || 0) / 90 * 100} 
              className="h-3"
            />
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-mono font-bold">{session?.totalTrades || 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Wins</div>
                <div className="font-mono font-bold text-emerald-500">{session?.winningTrades || 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Losses</div>
                <div className="font-mono font-bold text-red-500">{session?.losingTrades || 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Target</div>
                <div className="font-mono font-bold text-purple-500">90%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Drawdown</div>
              <div className={`font-mono font-bold ${
                (riskManagement?.currentDrawdown || 0) < 5 ? "text-emerald-500" :
                (riskManagement?.currentDrawdown || 0) < 10 ? "text-yellow-500" : "text-red-500"
              }`}>
                {riskManagement?.currentDrawdown.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Max: {riskManagement?.maxDrawdownPercent}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Position Size</div>
              <div className="font-mono font-bold">${riskManagement?.maxPositionSize.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">5% of equity</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Daily Loss</div>
              <div className={`font-mono font-bold ${
                (riskManagement?.currentDailyLoss || 0) < (riskManagement?.dailyLossLimit || 24) * 0.5 
                  ? "text-emerald-500" : "text-yellow-500"
              }`}>
                ${riskManagement?.currentDailyLoss.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Limit: ${riskManagement?.dailyLossLimit.toFixed(0)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Risk Score</div>
              <div className={`font-mono font-bold ${
                (riskManagement?.riskScore || 0) <= 3 ? "text-emerald-500" :
                (riskManagement?.riskScore || 0) <= 6 ? "text-yellow-500" : "text-red-500"
              }`}>
                {riskManagement?.riskScore}/10
              </div>
              <div className="text-xs text-muted-foreground">
                {(riskManagement?.riskScore || 0) <= 3 ? "Low Risk" :
                 (riskManagement?.riskScore || 0) <= 6 ? "Medium" : "High Risk"}
              </div>
            </div>
          </div>
          
          <div className={`mt-4 p-3 rounded-lg ${
            riskManagement?.isWithinLimits 
              ? "bg-emerald-500/10 border border-emerald-500/30" 
              : "bg-red-500/10 border border-red-500/30"
          }`}>
            <div className="flex items-center gap-2">
              {riskManagement?.isWithinLimits ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500 text-sm">All risk parameters within limits</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 text-sm">Risk limits exceeded - trading paused</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-500" />
            Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Trade Profit</div>
              <div className={`font-mono font-bold ${
                (analytics?.averageTradeProfit || 0) > 0 ? "text-emerald-500" : "text-red-500"
              }`}>
                ${analytics?.averageTradeProfit.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Profit Factor</div>
              <div className={`font-mono font-bold ${
                (analytics?.profitFactor || 0) > 1.5 ? "text-emerald-500" : "text-yellow-500"
              }`}>
                {analytics?.profitFactor.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
              <div className={`font-mono font-bold ${
                (analytics?.sharpeRatio || 0) > 1 ? "text-emerald-500" : "text-yellow-500"
              }`}>
                {analytics?.sharpeRatio.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Duration</div>
              <div className="font-mono font-bold">
                {analytics?.averageTradeDuration.toFixed(0) || 0}m
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Best Hour</div>
              <div className="font-mono font-bold text-emerald-500">
                {analytics?.bestTradingHour || 0}:00
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Max Win Streak</div>
              <div className="font-mono font-bold text-emerald-500">
                {analytics?.maxConsecutiveWins || 0} trades
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        {!isInitialized ? (
          <Button
            onClick={() => initSession.mutate({ startingEquity: 800 })}
            disabled={initSession.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Initialize $800 Account
          </Button>
        ) : (
          <>
            {session?.isActive ? (
              <Button
                onClick={() => stopTrading.mutate()}
                disabled={stopTrading.isPending}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Stop Trading
              </Button>
            ) : (
              <Button
                onClick={() => startTrading.mutate()}
                disabled={startTrading.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Start Auto-Trading
              </Button>
            )}
            <Button
              onClick={() => resetSession.mutate()}
              disabled={resetSession.isPending}
              variant="outline"
            >
              Reset Session
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
