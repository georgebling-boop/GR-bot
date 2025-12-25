import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Zap, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Shield,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface ConnectionStatus {
  connected: boolean;
  network: string;
  wallet: string | null;
}

interface Position {
  coin: string;
  size: number;
  leverage: number;
  unrealizedPnl: number;
  entryPrice: number;
}

interface AccountState {
  marginSummary: {
    accountValue: number;
    totalMarginUsed: number;
  };
  withdrawable: number;
  assetPositions: Position[];
}

export function HyperliquidPanel() {
  const [privateKey, setPrivateKey] = useState("");
  const [useMainnet, setUseMainnet] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [accountState, setAccountState] = useState<AccountState | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [openOrders, setOpenOrders] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/trpc/hyperliquid.getStatus");
        const data = await res.json();
        // Handle superjson response structure: data.result.data.json
        const statusData = data.result?.data?.json || data.result?.data;
        if (statusData) {
          setStatus(statusData);
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch account data when connected
  useEffect(() => {
    if (!status?.connected) return;

    const fetchAccountData = async () => {
      try {
        const [accountRes, pricesRes, ordersRes] = await Promise.all([
          fetch("/api/trpc/hyperliquid.getAccountState"),
          fetch("/api/trpc/hyperliquid.getPrices"),
          fetch("/api/trpc/hyperliquid.getOpenOrders"),
        ]);

        const accountData = await accountRes.json();
        const pricesData = await pricesRes.json();
        const ordersData = await ordersRes.json();

        // Handle superjson response structure: data.result.data.json
        const account = accountData.result?.data?.json || accountData.result?.data;
        const prices = pricesData.result?.data?.json || pricesData.result?.data;
        const orders = ordersData.result?.data?.json || ordersData.result?.data;

        if (account) setAccountState(account);
        if (prices) setPrices(prices);
        if (orders) setOpenOrders(orders);
      } catch (err) {
        console.error("Failed to fetch account data:", err);
      }
    };

    fetchAccountData();
    const interval = setInterval(fetchAccountData, 10000);
    return () => clearInterval(interval);
  }, [status?.connected]);

  const handleConnect = async () => {
    if (!privateKey) {
      setError("Please enter your private key");
      return;
    }
    
    // Basic validation
    const cleanKey = privateKey.trim().replace(/\s/g, "");
    if (cleanKey.length < 64) {
      setError(`Private key too short (${cleanKey.length} chars). Expected 64 or 66 characters.`);
      return;
    }
    
    setIsConnecting(true);
    setError(null);

    try {
      console.log("Connecting to Hyperliquid...", { useMainnet, keyLength: cleanKey.length });
      
      const res = await fetch("/api/trpc/hyperliquid.connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { privateKey: cleanKey, useMainnet } }),
      });
      
      if (!res.ok) {
        setError(`Server error: ${res.status} ${res.statusText}`);
        return;
      }
      
      const data = await res.json();
      console.log("Connection response:", data);
      
      // Handle superjson response structure: data.result.data.json
      const result = data.result?.data?.json || data.result?.data;
      
      if (result?.success) {
        setPrivateKey("");
        setError(null);
        // Refresh status
        const statusRes = await fetch("/api/trpc/hyperliquid.getStatus");
        const statusData = await statusRes.json();
        const newStatus = statusData.result?.data?.json || statusData.result?.data;
        if (newStatus) setStatus(newStatus);
      } else {
        const errorMsg = result?.error || 
                         result?.status?.error || 
                         data.error?.message ||
                         "Failed to connect - check your private key";
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError(`Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/trpc/hyperliquid.disconnect", { method: "POST" });
      setStatus({ connected: false, network: "", wallet: null });
      setAccountState(null);
      setPrices({});
      setOpenOrders([]);
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000) return formatUSD(value);
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(6)}`;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-500" />
            <span>Hyperliquid Exchange</span>
          </div>
          <div className="flex items-center gap-2">
            {status?.connected ? (
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Activity className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-zinc-500/20 text-zinc-400">
                Disconnected
              </Badge>
            )}
            <Badge variant="outline" className={useMainnet ? "border-red-500/50 text-red-400" : "border-blue-500/50 text-blue-400"}>
              {status?.network || (useMainnet ? "Mainnet" : "Testnet")}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.connected ? (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                <strong>⚠️ Important:</strong> Connect your Hyperliquid wallet to enable real perpetual futures trading.
                Start with testnet to practice before using real funds.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="privateKey" className="text-sm text-muted-foreground">
                  Wallet Private Key
                </Label>
                <Input
                  id="privateKey"
                  type="password"
                  placeholder="Enter your wallet private key (0x...)"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="mt-1 bg-background/50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="mainnet"
                    checked={useMainnet}
                    onCheckedChange={setUseMainnet}
                  />
                  <Label htmlFor="mainnet" className="text-sm">
                    Use Mainnet (Real Money)
                  </Label>
                </div>
                {useMainnet && (
                  <Badge variant="destructive" className="animate-pulse">
                    REAL FUNDS
                  </Badge>
                )}
              </div>

              <Button
                onClick={handleConnect}
                disabled={!privateKey || isConnecting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <a
                href="https://app.hyperliquid.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
              >
                Open Hyperliquid <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-background/30 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3 w-3" />
                  Account Value
                </div>
                <div className="text-lg font-bold text-green-400">
                  {formatUSD(accountState?.marginSummary?.accountValue || 0)}
                </div>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Target className="h-3 w-3" />
                  Margin Used
                </div>
                <div className="text-lg font-bold text-yellow-400">
                  {formatUSD(accountState?.marginSummary?.totalMarginUsed || 0)}
                </div>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Shield className="h-3 w-3" />
                  Withdrawable
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {formatUSD(accountState?.withdrawable || 0)}
                </div>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Activity className="h-3 w-3" />
                  Open Orders
                </div>
                <div className="text-lg font-bold">
                  {openOrders?.length || 0}
                </div>
              </div>
            </div>

            {/* Positions */}
            {accountState?.assetPositions && accountState.assetPositions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Open Positions</h4>
                <div className="space-y-2">
                  {accountState.assetPositions.map((pos) => (
                    <div
                      key={pos.coin}
                      className="p-3 bg-background/30 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${pos.size > 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                          {pos.size > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{pos.coin}</div>
                          <div className="text-xs text-muted-foreground">
                            {pos.size > 0 ? "Long" : "Short"} • {pos.leverage}x
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={pos.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}>
                          {pos.unrealizedPnl >= 0 ? "+" : ""}{formatUSD(pos.unrealizedPnl)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Entry: {formatPrice(pos.entryPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Prices */}
            {prices && Object.keys(prices).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Live Prices</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["BTC", "ETH", "SOL", "ARB", "AVAX", "DOGE", "LINK", "OP"].map((coin) => {
                    const price = prices[coin];
                    if (!price) return null;
                    return (
                      <div key={coin} className="p-2 bg-background/30 rounded text-center">
                        <div className="text-xs text-muted-foreground">{coin}</div>
                        <div className="font-mono text-sm">{formatPrice(price)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wallet Info & Disconnect */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                Wallet: {status.wallet?.slice(0, 6)}...{status.wallet?.slice(-4)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
