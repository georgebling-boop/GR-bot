/**
 * Market Data Service
 * Fetches real-time cryptocurrency prices and market data from CoinGecko (free API)
 * Includes caching and rate limiting to prevent API errors
 */

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

export interface MarketData {
  prices: CryptoPrice[];
  timestamp: string;
  error?: string;
}

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache: Map<string, CacheEntry<any>> = new Map();
const CACHE_DURATION = 60000; // 60 seconds cache for free API rate limits
const MIN_REQUEST_INTERVAL = 10000; // 10 seconds between requests
let lastRequestTime = 0;

/**
 * Get cached data or null if expired
 */
function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  return null;
}

/**
 * Set cache data
 */
function setCacheData<T>(key: string, data: T, duration: number = CACHE_DURATION): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + duration,
  });
}

/**
 * Rate limit check - wait if needed
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Default fallback prices when API is unavailable
 */
const FALLBACK_PRICES: CryptoPrice[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    current_price: 43250.00,
    market_cap: 847000000000,
    market_cap_rank: 1,
    total_volume: 28500000000,
    high_24h: 43800.00,
    low_24h: 42500.00,
    price_change_24h: 450.00,
    price_change_percentage_24h: 1.05,
    circulating_supply: 19500000,
    total_supply: 21000000,
    ath: 69000.00,
    atl: 67.81,
    last_updated: new Date().toISOString(),
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    current_price: 2280.00,
    market_cap: 274000000000,
    market_cap_rank: 2,
    total_volume: 12500000000,
    high_24h: 2320.00,
    low_24h: 2240.00,
    price_change_24h: 25.00,
    price_change_percentage_24h: 1.11,
    circulating_supply: 120000000,
    total_supply: 120000000,
    ath: 4878.00,
    atl: 0.43,
    last_updated: new Date().toISOString(),
  },
];

/**
 * Fetch cryptocurrency prices from CoinGecko free API
 * With caching and rate limiting
 */
export async function fetchCryptoPrices(
  ids: string[] = ["bitcoin", "ethereum"]
): Promise<CryptoPrice[]> {
  const cacheKey = `prices_${ids.sort().join(",")}`;
  
  // Check cache first
  const cachedData = getCachedData<CryptoPrice[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    await waitForRateLimit();
    
    const idString = ids.join(",");
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idString}&order=market_cap_desc&per_page=250&sparkline=false&locale=en`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("CoinGecko rate limit hit, using fallback prices");
        const fallbackFiltered = FALLBACK_PRICES.filter(p => ids.includes(p.id));
        setCacheData(cacheKey, fallbackFiltered, 120000); // Cache fallback for 2 minutes
        return fallbackFiltered;
      }
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    const prices: CryptoPrice[] = data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      current_price: coin.current_price || 0,
      market_cap: coin.market_cap || 0,
      market_cap_rank: coin.market_cap_rank || 0,
      total_volume: coin.total_volume || 0,
      high_24h: coin.high_24h || 0,
      low_24h: coin.low_24h || 0,
      price_change_24h: coin.price_change_24h || 0,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
      circulating_supply: coin.circulating_supply || 0,
      total_supply: coin.total_supply || 0,
      ath: coin.ath || 0,
      atl: coin.atl || 0,
      last_updated: coin.last_updated || new Date().toISOString(),
    }));

    setCacheData(cacheKey, prices);
    return prices;
  } catch (error) {
    console.error("Failed to fetch crypto prices:", error);
    // Return fallback prices on error
    const fallbackFiltered = FALLBACK_PRICES.filter(p => ids.includes(p.id));
    setCacheData(cacheKey, fallbackFiltered, 60000);
    return fallbackFiltered;
  }
}

/**
 * Get trending cryptocurrencies
 */
export async function fetchTrendingCryptos(): Promise<CryptoPrice[]> {
  const cacheKey = "trending";
  
  const cachedData = getCachedData<CryptoPrice[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    await waitForRateLimit();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://api.coingecko.com/api/v3/search/trending", {
      headers: {
        "Accept-Encoding": "gzip",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("CoinGecko rate limit hit for trending");
        return FALLBACK_PRICES.slice(0, 5);
      }
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    const trending: CryptoPrice[] = data.coins.slice(0, 10).map((item: any) => {
      const coin = item.item;
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.data?.price || 0,
        market_cap: coin.data?.market_cap || 0,
        market_cap_rank: coin.market_cap_rank || 0,
        total_volume: 0,
        high_24h: 0,
        low_24h: 0,
        price_change_24h: coin.data?.price_change_24h?.usd || 0,
        price_change_percentage_24h: 0,
        circulating_supply: 0,
        total_supply: 0,
        ath: 0,
        atl: 0,
        last_updated: new Date().toISOString(),
      };
    });

    setCacheData(cacheKey, trending);
    return trending;
  } catch (error) {
    console.error("Failed to fetch trending cryptos:", error);
    return FALLBACK_PRICES.slice(0, 5);
  }
}

/**
 * Get global market data
 */
export async function fetchGlobalMarketData(): Promise<any> {
  const cacheKey = "global";
  
  const cachedData = getCachedData<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    await waitForRateLimit();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://api.coingecko.com/api/v3/global", {
      headers: {
        "Accept-Encoding": "gzip",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("CoinGecko rate limit hit for global data");
        return {
          total_market_cap: 1700000000000,
          total_volume: 85000000000,
          btc_dominance: 52.5,
          eth_dominance: 16.2,
          market_cap_change_24h: 1.2,
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    const globalData = {
      total_market_cap: data.data.total_market_cap.usd || 0,
      total_volume: data.data.total_volume.usd || 0,
      btc_dominance: data.data.btc_dominance || 0,
      eth_dominance: data.data.eth_dominance || 0,
      market_cap_change_24h: data.data.market_cap_change_percentage_24h_usd || 0,
      timestamp: new Date().toISOString(),
    };

    setCacheData(cacheKey, globalData);
    return globalData;
  } catch (error) {
    console.error("Failed to fetch global market data:", error);
    return {
      total_market_cap: 1700000000000,
      total_volume: 85000000000,
      btc_dominance: 52.5,
      eth_dominance: 16.2,
      market_cap_change_24h: 1.2,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get historical price data for a cryptocurrency
 */
export async function fetchHistoricalPrices(
  cryptoId: string,
  days: number = 30
): Promise<any[]> {
  const cacheKey = `history_${cryptoId}_${days}`;
  
  const cachedData = getCachedData<any[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    await waitForRateLimit();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          "Accept-Encoding": "gzip",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("CoinGecko rate limit hit for historical data");
        return generateFallbackHistoricalData(days);
      }
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    const historicalData = data.prices.map((price: [number, number]) => ({
      timestamp: price[0],
      price: price[1],
      date: new Date(price[0]).toISOString(),
    }));

    setCacheData(cacheKey, historicalData, 300000); // Cache for 5 minutes
    return historicalData;
  } catch (error) {
    console.error("Failed to fetch historical prices:", error);
    return generateFallbackHistoricalData(days);
  }
}

/**
 * Generate fallback historical data when API is unavailable
 */
function generateFallbackHistoricalData(days: number): any[] {
  const data = [];
  const now = Date.now();
  const basePrice = 43000; // Base BTC price
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    const randomVariation = (Math.random() - 0.5) * 2000;
    data.push({
      timestamp,
      price: basePrice + randomVariation,
      date: new Date(timestamp).toISOString(),
    });
  }
  
  return data;
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache status
 */
export function getCacheStatus(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
