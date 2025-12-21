import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTradeExport } from "@/hooks/usePerformance";
import { Download, Filter, X } from "lucide-react";
import { toast } from "sonner";

interface Trade {
  trade_id: number;
  pair: string;
  stake_amount: number;
  amount: number;
  open_rate: number;
  current_rate: number;
  profit_abs: number;
  profit_ratio: number;
  open_date: string;
  close_date?: string;
  is_open: boolean;
  fee_open: number;
  fee_close: number;
  exchange: string;
}

interface TradeFilterPanelProps {
  trades: Trade[];
  onFilterChange?: (filtered: Trade[]) => void;
}

export default function TradeFilterPanel({
  trades,
  onFilterChange,
}: TradeFilterPanelProps) {
  const [symbolFilter, setSymbolFilter] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "buy" | "sell">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all"
  );
  const [minProfit, setMinProfit] = useState("");
  const [maxProfit, setMaxProfit] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { exportAsJson, exportAsCsv, isLoading } = useTradeExport();

  // Apply filters
  const filteredTrades = trades.filter((trade) => {
    if (
      symbolFilter &&
      !trade.pair.toLowerCase().includes(symbolFilter.toLowerCase())
    ) {
      return false;
    }

    if (sideFilter !== "all") {
      const isBuy = trade.profit_ratio > 0; // Simplified: positive profit = buy
      if (sideFilter === "buy" && !isBuy) return false;
      if (sideFilter === "sell" && isBuy) return false;
    }

    if (statusFilter !== "all") {
      if (statusFilter === "open" && !trade.is_open) return false;
      if (statusFilter === "closed" && trade.is_open) return false;
    }

    if (minProfit && trade.profit_ratio * 100 < parseFloat(minProfit)) {
      return false;
    }

    if (maxProfit && trade.profit_ratio * 100 > parseFloat(maxProfit)) {
      return false;
    }

    return true;
  });

  // Notify parent of filter changes
  if (onFilterChange) {
    onFilterChange(filteredTrades);
  }

  const handleExportJson = async () => {
    const result = await exportAsJson(filteredTrades);
    if (result.success) {
      toast.success(`Exported ${filteredTrades.length} trades as JSON`);
    } else {
      toast.error(`Failed to export: ${result.error}`);
    }
  };

  const handleExportCsv = async () => {
    const result = await exportAsCsv(filteredTrades);
    if (result.success) {
      toast.success(`Exported ${filteredTrades.length} trades as CSV`);
    } else {
      toast.error(`Failed to export: ${result.error}`);
    }
  };

  const resetFilters = () => {
    setSymbolFilter("");
    setSideFilter("all");
    setStatusFilter("all");
    setMinProfit("");
    setMaxProfit("");
  };

  const hasActiveFilters =
    symbolFilter || sideFilter !== "all" || statusFilter !== "all" || minProfit || maxProfit;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-foreground">
            Trade Filters & Export
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <X size={16} /> : <Filter size={16} />}
        </Button>
      </div>

      {/* Filter Results Summary */}
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredTrades.length}</span> of{" "}
          <span className="font-semibold text-foreground">{trades.length}</span> trades
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={resetFilters}
              className="ml-2 h-auto p-0 text-xs"
            >
              Clear filters
            </Button>
          )}
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Symbol Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Symbol
              </label>
              <Input
                placeholder="e.g., BTC-USD"
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Side Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Side
              </label>
              <select
                value={sideFilter}
                onChange={(e) =>
                  setSideFilter(e.target.value as "all" | "buy" | "sell")
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
              >
                <option value="all">All</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "open" | "closed"
                  )
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Profit Range */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Profit Range (%)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minProfit}
                  onChange={(e) => setMinProfit(e.target.value)}
                  className="font-mono text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxProfit}
                  onChange={(e) => setMaxProfit(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleExportJson}
          disabled={isLoading || filteredTrades.length === 0}
          variant="outline"
          className="flex-1"
        >
          <Download size={16} className="mr-2" />
          Export JSON
        </Button>
        <Button
          onClick={handleExportCsv}
          disabled={isLoading || filteredTrades.length === 0}
          variant="outline"
          className="flex-1"
        >
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
      </div>
    </Card>
  );
}
