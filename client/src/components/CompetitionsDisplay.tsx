import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Trophy, Clock, TrendingUp, TrendingDown, Bot, Medal } from "lucide-react";

export function CompetitionsDisplay() {
  const { data: status } = trpc.competition.getStatus.useQuery(undefined, {
    refetchInterval: 1000, // Update every second for live competition
  });
  const { data: leaderboard } = trpc.competition.getLeaderboard.useQuery(undefined, {
    refetchInterval: 2000,
  });
  const { data: history } = trpc.competition.getHistory.useQuery({ limit: 5 });
  const { data: analysis } = trpc.competition.getWinningAnalysis.useQuery();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs text-zinc-500">#{rank}</span>;
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          AI Trading Competitions
          {status && (
            <Badge 
              variant="outline" 
              className={`ml-auto text-xs ${
                status.status === "running" 
                  ? "text-green-400 border-green-400/30 animate-pulse" 
                  : status.status === "completed"
                  ? "text-blue-400 border-blue-400/30"
                  : "text-zinc-400 border-zinc-400/30"
              }`}
            >
              {status.status.toUpperCase()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Competition */}
        {status && status.status === "running" && (
          <div className="p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-400">{status.name}</span>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span className="font-mono text-emerald-400">{formatTime(status.remainingTime)}</span>
              </div>
            </div>
            <Progress 
              value={(status.elapsedTime / (status.duration * 60)) * 100} 
              className="h-2 [&>div]:bg-green-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Started: {status.startedAt ? new Date(status.startedAt).toLocaleTimeString() : "N/A"}</span>
              <span>{status.participants.length} AI Bots</span>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Live Leaderboard
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {leaderboard.map((participant, i) => (
                <div 
                  key={participant.id} 
                  className={`flex items-center gap-3 p-2 rounded transition-all ${
                    participant.rank === 1 
                      ? "bg-yellow-500/10 border border-yellow-500/20" 
                      : "bg-zinc-800/50"
                  }`}
                >
                  <div className="w-6 flex justify-center">
                    {getRankBadge(participant.rank)}
                  </div>
                  <Bot className="h-4 w-4 text-zinc-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{participant.name}</div>
                    <div className="text-xs text-zinc-500">{participant.strategy}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono flex items-center gap-1 ${
                      participant.totalProfit >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {participant.totalProfit >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatCurrency(participant.totalProfit)}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {participant.winRate.toFixed(0)}% WR • {participant.totalTrades} trades
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Winning Strategy Analysis */}
        {analysis && (
          <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <div className="text-sm font-medium text-blue-400 mb-2">🏆 Best Strategy Analysis</div>
            <div className="text-sm text-zinc-300">{analysis.recommendation}</div>
            <div className="flex gap-4 mt-2 text-xs text-zinc-500">
              <span>Avg Win Rate: {analysis.avgWinRate.toFixed(1)}%</span>
              <span>Avg Profit: {formatCurrency(analysis.avgProfit)}</span>
            </div>
          </div>
        )}

        {/* Competition History */}
        {history && history.competitions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-400">Recent Competitions</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {history.competitions.map((comp, i) => (
                <div key={comp.id} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        comp.status === "completed" ? "text-blue-400" : "text-zinc-400"
                      }`}
                    >
                      {comp.status}
                    </Badge>
                    <span className="text-zinc-300">{comp.name}</span>
                  </div>
                  {comp.winnerName && (
                    <div className="flex items-center gap-1 text-xs">
                      <Trophy className="h-3 w-3 text-yellow-400" />
                      <span className="text-zinc-400">{comp.winnerName}</span>
                      {comp.winnerProfit !== undefined && (
                        <span className={comp.winnerProfit >= 0 ? "text-green-400" : "text-red-400"}>
                          ({formatCurrency(comp.winnerProfit)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Competition Running */}
        {(!status || status.status === "pending") && (!leaderboard || leaderboard.length === 0) && (
          <div className="text-center py-6 text-zinc-500">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No competition running</p>
            <p className="text-xs mt-1">Competitions pit AI strategies against each other</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
