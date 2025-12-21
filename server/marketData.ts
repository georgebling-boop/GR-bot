/**
 * Market Data Service
 * Fetches real-time cryptocurrency prices and market data from CoinGecko (free API)
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

/**
 * Fetch cryptocurrency prices from CoinGecko free API
 * No authentication required
 */
export async function fetchCryptoPrices(
  ids: string[] = ["bitcoin", "ethereum", "cardano", "solana", "ripple"]
): Promise<CryptoPrice[]> {
  try {
    const idString = ids.join(",");
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idString}&order=market_cap_desc&per_page=250&sparkline=false&locale=en`;

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((coin: any) => ({
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
  } catch (error) {
    console.error("Failed to fetch crypto prices:", error);
    return [];
  }
}

/**
 * Get trending cryptocurrencies
 */
export async function fetchTrendingCryptos(): Promise<CryptoPrice[]> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/search/trending", {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.coins.slice(0, 10).map((item: any) => {
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
  } catch (error) {
    console.error("Failed to fetch trending cryptos:", error);
    return [];
  }
}

/**
 * Get global market data
 */
export async function fetchGlobalMarketData(): Promise<any> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/global", {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      total_market_cap: data.data.total_market_cap.usd || 0,
      total_volume: data.data.total_volume.usd || 0,
      btc_dominance: data.data.btc_dominance || 0,
      eth_dominance: data.data.eth_dominance || 0,
      market_cap_change_24h: data.data.market_cap_change_percentage_24h_usd || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch global market data:", error);
    return null;
  }
}

/**
 * Get historical price data for a cryptocurrency
 */
export async function fetchHistoricalPrices(
  cryptoId: string,
  days: number = 30
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          "Accept-Encoding": "gzip",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.prices.map((price: [number, number]) => ({
      timestamp: price[0],
      price: price[1],
      date: new Date(price[0]).toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch historical prices:", error);
    return [];
  }
}
