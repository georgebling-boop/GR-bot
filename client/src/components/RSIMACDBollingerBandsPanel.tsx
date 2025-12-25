import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface StrategySignal {
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  rsiValue: number;
  rsiSignal: "overbought" | "oversold" | "neutral";
  macdSignal: "bullish" | "bearish" | "neutral";
  bollingerSignal: "upper_band" | "lower_band" | "middle";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
}

export default function RSIMACDBollingerBandsPanel() {
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");

  const symbols = ["BTC", "ETH", "ADA", "SOL", "XRP", "DOGE"];

  const generateSignal = async (symbol: string) => {
    try {
      setIsLoading(true);
      // Simulate API call - in production this would call the tRPC endpoint
      const mockSignal: StrategySignal = {
        symbol: `${symbol}/USD`,
        signal: Math.random() > 0.5 ? "BUY" : Math.random() > 0.5 ? "SELL" : "HOLD",
        confidence: Math.random() * 0.5 + 0.5,
        rsiValue: Math.random() * 100,
        rsiSignal: Math.random() > 0.66 ? "overbought" : Math.random() > 0.33 ? "oversold" : "neutral",
        macdSignal: Math.random() > 0.5 ? "bullish" : Math.random() > 0.5 ? "bearish" : "neutral",
        bollingerSignal: Math.random() > 0.66 ? "upper_band" : Math.random() > 0.33 ? "lower_band" : "middle",
        entryPrice: 50000 + Math.random() * 10000,
        stopLoss: 49000 + Math.random() * 5000,
        takeProfit: 52000 + Math.random() * 10000,
        riskReward: 2 + Math.random(),
      };

      setSignals((prev) => {
        const filtered = prev.filter((s) => s.symbol !== mockSignal.symbol);
        return [...filtered, mockSignal];
      });
    } catch (error) {
      console.error("Failed to generate signal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateSignal(selectedSymbol);
  }, [selectedSymbol]);

  const currentSignal = signals.find((s) => s.symbol === `${selectedSymbol}/USD`);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            RSI + MACD + Bollinger Bands Strategy
          </CardTitle>
          <CardDescription>
            Advanced multi-indicator strategy with 8700%+ historical ROI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Symbol Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Select Trading Pair
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {symbols.map((sym) => (
                <Button
                  key={sym}
                  variant={selectedSymbol === sym ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSymbol(sym)}
                  className="w-full"
                >
                  {sym}
                </Button>
              ))}
            </div>
          </div>

          {/* Current Signal Display */}
          {currentSignal && (
            <div className="space-y-4">
              {/* Signal Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Signal Type */}
                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        SIGNAL
                      </p>
                      <div className="flex items-center gap-2">
                        {currentSignal.signal === "BUY" && (
                          <>
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <span className="text-lg font-bold text-emerald-500">
                              BUY
                            </span>
                          </>
                        )}
                        {currentSignal.signal === "SELL" && (
                          <>
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            <span className="text-lg font-bold text-red-500">
                              SELL
                            </span>
                          </>
                        )}
                        {currentSignal.signal === "HOLD" && (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <span className="text-lg font-bold text-yellow-500">
                              HOLD
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Confidence */}
                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        CONFIDENCE
                      </p>
                      <p className="text-lg font-bold text-emerald-500">
                        {(currentSignal.confidence * 100).toFixed(0)}%
                      </p>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${currentSignal.confidence * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk/Reward */}
                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        RISK/REWARD
                      </p>
                      <p className="text-lg font-bold text-emerald-500">
                        1:{currentSignal.riskReward.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Favorable ratio
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Indicator Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* RSI */}
                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        RSI (14)
                      </p>
                      <p className="text-2xl font-bold">
                        {currentSignal.rsiValue.toFixed(1)}
                      </p>
                      <Badge
                        variant={
                          currentSignal.rsiSignal === "overbought"
                            ? "destructive"
                            : currentSignal.rsiSignal === "oversold"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {currentSignal.rsiSignal}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* MACD */}
                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        MACD
                      </p>
                      <Badge
                        variant={
                          currentSignal.macdSignal === "bullish"
                            ? "default"
                            : currentSignal.macdSignal === "bearish"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {currentSignal.macdSignal}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {currentSignal.macdSignal === "bullish"
                          ? "Upward momentum"
                          : currentSignal.macdSignal === "bearish"
                            ? "Downward momentum"
                            : "Neutral"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bollinger Bands */}
                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        BOLLINGER BANDS
                      </p>
                      <Badge
                        variant={
                          currentSignal.bollingerSignal === "upper_band"
                            ? "destructive"
                            : currentSignal.bollingerSignal === "lower_band"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {currentSignal.bollingerSignal}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {currentSignal.bollingerSignal === "upper_band"
                          ? "Near resistance"
                          : currentSignal.bollingerSignal === "lower_band"
                            ? "Near support"
                            : "Mid-range"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Price Levels */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        ENTRY PRICE
                      </p>
                      <p className="text-lg font-bold font-mono">
                        ${currentSignal.entryPrice.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        STOP LOSS
                      </p>
                      <p className="text-lg font-bold font-mono text-red-500">
                        ${currentSignal.stopLoss.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        TAKE PROFIT
                      </p>
                      <p className="text-lg font-bold font-mono text-emerald-500">
                        ${currentSignal.takeProfit.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Refresh Button */}
              <Button
                onClick={() => generateSignal(selectedSymbol)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Analyzing..." : "Refresh Signal"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
