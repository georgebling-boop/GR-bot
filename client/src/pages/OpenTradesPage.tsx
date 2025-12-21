import { useFreqtradeDashboard } from "@/hooks/useFreqtradeData";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Open Trades Page Content
 * Displays detailed information about all currently open trades
 */

export function OpenTradesPageContent() {
  const { openTrades, openTradesLoading, refresh } = useFreqtradeDashboard(5000);

  const handleRefresh = async () => {
    await refresh();
    toast.success("Trades refreshed");
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Open Trades
              </h1>
              <p className="text-muted-foreground mt-1">
                Currently active trading positions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-accent">
                  {openTrades?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Trades</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={openTradesLoading}
                className="gap-2"
              >
                <RefreshCw
                  size={16}
                  className={openTradesLoading ? "animate-spin" : ""}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {openTrades && openTrades.length > 0 ? (
          <div className="space-y-4">
            {openTrades.map((trade) => (
              <Card key={trade.trade_id} className="metric-card">
                <div className="space-y-4">
                  {/* Trade Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-lg text-foreground">
                        {trade.pair}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trade ID: {trade.trade_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-mono font-bold text-lg ${
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

                  {/* Trade Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Entry Price
                      </p>
                      <p className="font-mono font-semibold text-foreground">
                        ${trade.open_rate.toFixed(8)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Current Price
                      </p>
                      <p className="font-mono font-semibold text-foreground">
                        ${trade.current_rate.toFixed(8)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-mono font-semibold text-foreground">
                        {trade.amount.toFixed(8)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Stake Amount
                      </p>
                      <p className="font-mono font-semibold text-foreground">
                        ${trade.stake_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Open Date
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {new Date(trade.open_date).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Fee Open
                      </p>
                      <p className="font-mono font-semibold text-foreground">
                        {trade.fee_open.toFixed(4)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Fee Close
                      </p>
                      <p className="font-mono font-semibold text-foreground">
                        {trade.fee_close.toFixed(4)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Exchange</p>
                      <p className="font-mono font-semibold text-foreground">
                        {trade.exchange}
                      </p>
                    </div>
                  </div>

                  {/* Price Change Indicator */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    {trade.current_rate > trade.open_rate ? (
                      <TrendingUp className="text-accent" size={20} />
                    ) : (
                      <TrendingDown className="text-destructive" size={20} />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Price change:{" "}
                      <span
                        className={
                          trade.current_rate > trade.open_rate
                            ? "text-accent font-semibold"
                            : "text-destructive font-semibold"
                        }
                      >
                        {(
                          ((trade.current_rate - trade.open_rate) /
                            trade.open_rate) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="metric-card text-center py-12">
            <p className="text-muted-foreground text-lg">
              {openTradesLoading ? "Loading trades..." : "No open trades at the moment"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
