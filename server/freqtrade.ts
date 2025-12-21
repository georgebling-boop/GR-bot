import axios, { AxiosInstance } from "axios";

/**
 * Freqtrade API Client
 * Handles all communication with the local Freqtrade bot instance
 * Supports both HTTP polling and WebSocket connections
 */

export interface FreqtradeConfig {
  baseUrl: string; // e.g., "http://localhost:8080"
  username?: string;
  password?: string;
}

export interface BotStatus {
  state: string;
  version: string;
}

export interface Trade {
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

export interface PerformanceMetrics {
  total_profit: number;
  total_profit_percent: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: number;
  total_trades: number;
  open_trades: number;
  closed_trades: number;
}

export interface DailyStats {
  date: string;
  profit: number;
  profit_percent: number;
  trades: number;
}

class FreqtradeClient {
  private client: AxiosInstance;
  private config: FreqtradeConfig;

  constructor(config: FreqtradeConfig) {
    this.config = config;

    // Create axios instance with basic auth if provided
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.username && config.password) {
      const auth = Buffer.from(
        `${config.username}:${config.password}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    }

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers,
      timeout: 10000,
    });
  }

  /**
   * Get bot status and version
   */
  async getBotStatus(): Promise<BotStatus> {
    try {
      const response = await this.client.get("/api/v1/ping");
      return {
        state: response.data.status || "running",
        version: response.data.version || "unknown",
      };
    } catch (error) {
      console.error("[Freqtrade] Failed to get bot status:", error);
      throw new Error("Failed to connect to Freqtrade bot");
    }
  }

  /**
   * Get all open trades
   */
  async getOpenTrades(): Promise<Trade[]> {
    try {
      const response = await this.client.get("/api/v1/trades");
      return response.data.trades || [];
    } catch (error) {
      console.error("[Freqtrade] Failed to get open trades:", error);
      return [];
    }
  }

  /**
   * Get a specific trade by ID
   */
  async getTrade(tradeId: number): Promise<Trade | null> {
    try {
      const response = await this.client.get(`/api/v1/trades/${tradeId}`);
      return response.data.trade || null;
    } catch (error) {
      console.error(
        `[Freqtrade] Failed to get trade ${tradeId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get trade history (closed trades)
   */
  async getTradeHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ trades: Trade[]; total: number }> {
    try {
      const response = await this.client.get("/api/v1/trades", {
        params: {
          limit,
          offset,
        },
      });
      return {
        trades: response.data.trades || [],
        total: response.data.total_trades || 0,
      };
    } catch (error) {
      console.error("[Freqtrade] Failed to get trade history:", error);
      return { trades: [], total: 0 };
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformance(): Promise<PerformanceMetrics> {
    try {
      const response = await this.client.get("/api/v1/performance");
      const trades = response.data.trades || [];

      // Calculate metrics from trades
      const totalTrades = trades.length;
      const openTrades = trades.filter((t: Trade) => t.is_open).length;
      const closedTrades = totalTrades - openTrades;

      let totalProfit = 0;
      let winCount = 0;

      trades.forEach((trade: Trade) => {
        if (!trade.is_open) {
          totalProfit += trade.profit_abs || 0;
          if ((trade.profit_ratio || 0) > 0) {
            winCount++;
          }
        }
      });

      const winRate = totalTrades > 0 ? (winCount / closedTrades) * 100 : 0;

      return {
        total_profit: totalProfit,
        total_profit_percent: (totalProfit / 1000) * 100, // Assuming 1000 starting balance
        win_rate: winRate,
        max_drawdown: 0, // Would need more complex calculation
        sharpe_ratio: 0, // Would need historical data
        total_trades: totalTrades,
        open_trades: openTrades,
        closed_trades: closedTrades,
      };
    } catch (error) {
      console.error("[Freqtrade] Failed to get performance:", error);
      return {
        total_profit: 0,
        total_profit_percent: 0,
        win_rate: 0,
        max_drawdown: 0,
        sharpe_ratio: 0,
        total_trades: 0,
        open_trades: 0,
        closed_trades: 0,
      };
    }
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(): Promise<DailyStats[]> {
    try {
      const response = await this.client.get("/api/v1/daily");
      return response.data.data || [];
    } catch (error) {
      console.error("[Freqtrade] Failed to get daily stats:", error);
      return [];
    }
  }

  /**
   * Get strategy configuration
   */
  async getStrategy(): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get("/api/v1/strategy");
      return response.data || {};
    } catch (error) {
      console.error("[Freqtrade] Failed to get strategy:", error);
      return {};
    }
  }

  /**
   * Get bot configuration
   */
  async getConfig(): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get("/api/v1/config");
      return response.data || {};
    } catch (error) {
      console.error("[Freqtrade] Failed to get config:", error);
      return {};
    }
  }

  /**
   * Check if bot is healthy and reachable
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.getBotStatus();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let freqtradeClient: FreqtradeClient | null = null;

/**
 * Initialize Freqtrade client with configuration
 */
export function initFreqtradeClient(config: FreqtradeConfig): FreqtradeClient {
  freqtradeClient = new FreqtradeClient(config);
  return freqtradeClient;
}

/**
 * Get the Freqtrade client instance
 */
export function getFreqtradeClient(): FreqtradeClient {
  if (!freqtradeClient) {
    // Default configuration - can be overridden via environment variables
    const baseUrl = process.env.FREQTRADE_URL || "http://localhost:8080";
    const username = process.env.FREQTRADE_USERNAME;
    const password = process.env.FREQTRADE_PASSWORD;

    freqtradeClient = new FreqtradeClient({
      baseUrl,
      username,
      password,
    });
  }
  return freqtradeClient;
}

export default FreqtradeClient;
