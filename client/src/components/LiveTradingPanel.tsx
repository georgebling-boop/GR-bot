import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTestTrading } from "@/hooks/useTestTrading";
import { useCurrentPrice, useMarketData } from "@/hooks/useMarketData";
import { Play, RotateCcw, Zap, TrendingUp, DollarSign, Target, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const POPULAR_CRYPTOS = ["BTC", "ETH", "ADA", "SOL", "XRP", "DOGE"];

export default function LiveTradingPanel() {
  const {
    state,
    summary,
    isLoading: tradingLoading,
    initialize,
    openTrade,
    closeTrade,
    generateSamples,
    reset,
  } = useTestTrading();

  const { prices: marketPrices, isLoading: pricesLoading } = useMarketData([
    "bitcoin",
    "ethereum",
    "cardano",
    "solana",
    "ripple",
    "dogecoin",
  ]);

  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const { price: livePrice, isLoading: priceLoading, change24h } = useCurrentPrice(selectedSymbol);
  const [stakeAmount, setStakeAmount] = useState("25");
  const [closeTradeId, setCloseTradeId] = useState("");
  const [closeRate, setCloseRate] = useState("");

  const handleOpenTrade = async () => {
    if (!selectedSymbol || !stakeAmount || !livePrice) {
      toast.error("Please fill in all fields and wait for price data");
      return;
    }
    await openTrade(`${selectedSymbol}-USD`, parseFloat(stakeAmount), livePrice);
    setStakeAmount("25");
  };

  const handleCloseTrade = async () => {
    if (!closeTradeId || !closeRate) {
      toast.error("Please enter trade ID and close rate");
      return;
    }
    await closeTrade(parseInt(closeTradeId), parseFloat(closeRate));
    setCloseTradeId("");
    setCloseRate("");
  };

  const handleGenerateSamples = async () => {
    await generateSamples();
  };

  const handleReset = async () => {
    if (window.confirm("Reset simulation? This will clear all trades.")) {
      await reset();
    }
  };

  if (!state || !summary) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Live Trading Simulator</h3>
          <Button onClick={initialize} disabled={tradingLoading}>
            <Play size={16} className="mr-2" />
            Initialize
          </Button>
        </div>
        <p className="text-muted-foreground">Click Initialize to start the $100 test account with live prices</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Live Trading Simulator</h3>
          <p className="text-sm text-muted-foreground">Paper trading with $100 virtual account + real-time prices</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateSamples}
            disabled={tradingLoading}
          >
            <Zap size={16} className="mr-2" />
            Generate Samples
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={tradingLoading}
          >
            <RotateCcw size={16} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Current Equity</p>
          <p className="font-mono font-semibold text-foreground">
            ${summary.current_equity.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Total Profit</p>
          <p className={`font-mono font-semibold ${summary.total_profit >= 0 ? "text-accent" : "text-destructive"}`}>
            ${summary.total_profit.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="font-mono font-semibold text-foreground">
            {summary.win_rate.toFixed(1)}%
          </p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">ROI</p>
          <p className={`font-mono font-semibold ${summary.roi >= 0 ? "text-accent" : "text-destructive"}`}>
            {summary.roi.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Trade Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-card border border-border rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Total Trades</p>
          <p className="font-mono font-semibold text-foreground">{summary.total_trades}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Open Trades</p>
          <p className="font-mono font-semibold text-accent">{summary.open_trades_count}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Winning</p>
          <p className="font-mono font-semibold text-accent">{summary.winning_trades}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Losing</p>
          <p className="font-mono font-semibold text-destructive">{summary.losing_trades}</p>
        </div>
      </div>

      {/* Live Market Data */}
      <div className="space-y-3 p-4 bg-card border border-border rounded-lg">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <DollarSign size={16} />
          Live Market Prices
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {marketPrices.slice(0, 6).map((crypto) => (
            <button
              key={crypto.symbol}
              onClick={() => setSelectedSymbol(crypto.symbol)}
              className={`p-2 rounded-lg border transition-colors ${
                selectedSymbol === crypto.symbol
                  ? "bg-accent border-accent text-accent-foreground"
                  : "bg-background border-border hover:border-accent"
              }`}
            >
              <p className="font-mono font-semibold text-sm">{crypto.symbol}</p>
              <p className="text-xs">
                ${crypto.current_price.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className={`text-xs ${crypto.price_change_percentage_24h >= 0 ? "text-accent" : "text-destructive"}`}>
                {crypto.price_change_percentage_24h >= 0 ? "+" : ""}
                {crypto.price_change_percentage_24h.toFixed(2)}%
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Open Trade Section with Live Price */}
      <div className="space-y-3 p-4 bg-card border border-border rounded-lg">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp size={16} />
          Open New Trade
        </h4>

        {/* Live Price Display */}
        {livePrice && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedSymbol}-USD</p>
                <p className="text-xs text-muted-foreground">Current Live Price</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-foreground">
                  ${livePrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs ${change24h >= 0 ? "text-accent" : "text-destructive"}`}>
                  {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% (24h)
                </p>
              </div>
            </div>
          </div>
        )}

        {priceLoading && (
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Loading live price...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Crypto</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              disabled={tradingLoading || pricesLoading}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
            >
              {POPULAR_CRYPTOS.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Stake ($)</label>
            <Input
              type="number"
              placeholder="25"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              disabled={tradingLoading}
            />
          </div>
        </div>
        <Button
          onClick={handleOpenTrade}
          disabled={tradingLoading || priceLoading || !livePrice}
          className="w-full"
        >
          <TrendingUp size={16} className="mr-2" />
          Open Trade with Live Price
        </Button>
      </div>

      {/* Close Trade Section */}
      {state.open_trades.length > 0 && (
        <div className="space-y-3 p-4 bg-card border border-border rounded-lg">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Target size={16} />
            Close Trade
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Trade ID</label>
                <select
                  value={closeTradeId}
                  onChange={(e) => setCloseTradeId(e.target.value)}
                  disabled={tradingLoading}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
                >
                  <option value="">Select trade to close</option>
                  {state.open_trades.map((trade) => (
                    <option key={trade.trade_id} value={trade.trade_id}>
                      #{trade.trade_id} - {trade.pair} @ ${trade.open_rate.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Close Price</label>
                <Input
                  type="number"
                  placeholder="Exit price"
                  value={closeRate}
                  onChange={(e) => setCloseRate(e.target.value)}
                  disabled={tradingLoading}
                />
              </div>
            </div>
            <Button
              onClick={handleCloseTrade}
              disabled={tradingLoading}
              className="w-full"
            >
              <Target size={16} className="mr-2" />
              Close Trade
            </Button>
          </div>
        </div>
      )}

      {/* Open Trades List */}
      {state.open_trades.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Open Trades ({state.open_trades.length})</h4>
          <div className="space-y-2">
            {state.open_trades.map((trade) => (
              <div
                key={trade.trade_id}
                className="p-3 bg-card border border-border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-mono font-semibold text-foreground">
                    #{trade.trade_id} {trade.pair}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entry: ${trade.open_rate.toFixed(2)} | Current: ${trade.current_rate.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-semibold ${trade.profit_ratio >= 0 ? "text-accent" : "text-destructive"}`}>
                    {trade.profit_ratio >= 0 ? "+" : ""}{(trade.profit_ratio * 100).toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${trade.profit_abs.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closed Trades List */}
      {state.closed_trades.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Closed Trades ({state.closed_trades.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.closed_trades.map((trade) => (
              <div
                key={trade.trade_id}
                className="p-3 bg-card border border-border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-mono font-semibold text-foreground">
                    #{trade.trade_id} {trade.pair}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entry: ${trade.open_rate.toFixed(2)} | Exit: ${trade.current_rate.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-semibold ${trade.profit_ratio >= 0 ? "text-accent" : "text-destructive"}`}>
                    {trade.profit_ratio >= 0 ? "+" : ""}{(trade.profit_ratio * 100).toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${trade.profit_abs.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
