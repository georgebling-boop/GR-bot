import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  atl: number;
  last_updated: string;
}

export function useMarketData(cryptoIds?: string[]) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricesQuery = trpc.marketData.getPrices.useQuery(
    { ids: cryptoIds },
    { refetchInterval: 60000, staleTime: 55000 } // Refresh every 30 seconds
  );

  useEffect(() => {
    setIsLoading(pricesQuery.isLoading);
    setError(pricesQuery.error?.message || null);
  }, [pricesQuery.isLoading, pricesQuery.error]);

  return {
    prices: pricesQuery.data?.prices || [],
    isLoading,
    error,
    refetch: pricesQuery.refetch,
  };
}

export function useTrendingCryptos() {
  const trendingQuery = trpc.marketData.getTrending.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  return {
    trending: trendingQuery.data?.trending || [],
    isLoading: trendingQuery.isLoading,
    error: trendingQuery.error?.message || null,
    refetch: trendingQuery.refetch,
  };
}

export function useGlobalMarketData() {
  const globalQuery = trpc.marketData.getGlobalMarketData.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  return {
    globalData: globalQuery.data?.data,
    isLoading: globalQuery.isLoading,
    error: globalQuery.error?.message || null,
    refetch: globalQuery.refetch,
  };
}

export function useCurrentPrice(symbol: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const priceQuery = trpc.marketData.getCurrentPrice.useQuery(
    { symbol },
    { refetchInterval: 30000, staleTime: 25000, enabled: !!symbol } // Refresh every 10 seconds
  );

  useEffect(() => {
    setIsLoading(priceQuery.isLoading);
    if (priceQuery.data?.success && priceQuery.data.price) {
      setPrice(priceQuery.data.price);
      setError(null);
    } else if (priceQuery.data?.error) {
      setError(priceQuery.data.error);
      setPrice(null);
    }
  }, [priceQuery.data, priceQuery.isLoading]);

  return {
    price,
    isLoading,
    error,
    change24h: priceQuery.data?.change24h || 0,
    high24h: priceQuery.data?.high24h || 0,
    low24h: priceQuery.data?.low24h || 0,
    refetch: priceQuery.refetch,
  };
}

export function useHistoricalPrices(cryptoId: string, days: number = 30) {
  const historicalQuery = trpc.marketData.getHistoricalPrices.useQuery(
    { cryptoId, days },
    { enabled: !!cryptoId }
  );

  return {
    prices: historicalQuery.data?.prices || [],
    isLoading: historicalQuery.isLoading,
    error: historicalQuery.error?.message || null,
    refetch: historicalQuery.refetch,
  };
}
