import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useTradeHistory } from "@/hooks/useFreqtradeData";
import { TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Trade History Page Content
 * Displays closed trades and historical trading performance
 */

export function TradeHistoryPageContent() {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: historyData, isLoading, refetch } = useTradeHistory(limit, offset);

  const handleRefresh = async () => {
    await refetch();
    toast.success("History refreshed");
  };

  const handleNextPage = () => {
    setOffset(offset + limit);
  };

  const handlePreviousPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const trades = historyData?.trades || [];
  const total = historyData?.total || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  // Calculate statistics
  const winningTrades = trades.filter((t) => t.profit_ratio > 0).length;
  const losingTrades = trades.filter((t) => t.profit_ratio < 0).length;
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit_abs || 0), 0);
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Trade History
              </h1>
              <p className="text-muted-foreground mt-1">
                Closed trades and historical performance
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Total Trades</p>
              <p className="metric-value">{total}</p>
            </div>
          </Card>
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Win Rate</p>
              <p className="metric-value text-accent">
                {winRate.toFixed(1)}%
              </p>
            </div>
          </Card>
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Winning Trades</p>
              <p className="metric-value text-accent">{winningTrades}</p>
            </div>
          </Card>
          <Card className="metric-card">
            <div className="space-y-2">
              <p className="metric-label">Total Profit</p>
              <p
                className={`metric-value ${
                  totalProfit > 0 ? "text-accent" : "text-destructive"
                }`}
              >
                ${totalProfit.toFixed(2)}
              </p>
            </div>
          </Card>
        </div>

        {/* Trades List */}
        {trades.length > 0 ? (
          <div className="space-y-4">
            {trades.map((trade) => (
              <Card key={trade.trade_id} className="metric-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-mono font-bold text-foreground">
                        {trade.pair}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {trade.trade_id}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Entry
                        </p>
                        <p className="font-mono text-foreground">
                          ${trade.open_rate.toFixed(8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Exit</p>
                        <p className="font-mono text-foreground">
                          ${trade.current_rate.toFixed(8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Duration
                        </p>
                        <p className="font-mono text-foreground">
                          {trade.close_date
                            ? new Date(
                                new Date(trade.close_date).getTime() -
                                  new Date(trade.open_date).getTime()
                              ).toISOString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Stake
                        </p>
                        <p className="font-mono text-foreground">
                          ${trade.stake_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2">
                      {trade.profit_ratio > 0 ? (
                        <TrendingUp className="text-accent" size={20} />
                      ) : (
                        <TrendingDown className="text-destructive" size={20} />
                      )}
                      <div>
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="metric-card text-center py-12">
            <p className="text-muted-foreground text-lg">
              {isLoading ? "Loading history..." : "No closed trades yet"}
            </p>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={offset === 0}
            >
              <ChevronLeft size={16} className="mr-2" />
              Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={offset + limit >= total}
            >
              Next
              <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
