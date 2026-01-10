import { type SimulationState } from "./testTradingSimulator";
import { openTrade, closeTrade, updateTradePrice } from "./testTradingSimulator";

export interface AutoTradeConfig {
  enabled: boolean;
  strategy: string;
  riskPerTrade: number; // percentage of equity
  maxOpenTrades: number;
  autoCloseProfitPercent: number;
  autoCloseLossPercent: number;
  updateInterval: number; // milliseconds
}

export interface AutoTradeSession {
  id: string;
  startTime: string;
  config: AutoTradeConfig;
  tradesExecuted: number;
  totalProfit: number;
  isActive: boolean;
}

const defaultConfig: AutoTradeConfig = {
  enabled: true,
  strategy: "momentum",
  riskPerTrade: 5, // 5% of equity per trade
  maxOpenTrades: 3,
  autoCloseProfitPercent: 2, // close when +2% profit
  autoCloseLossPercent: -1, // close when -1% loss
  updateInterval: 10000, // 10 seconds
};

let autoTradeSession: AutoTradeSession | null = null;
let autoTradeInterval: NodeJS.Timeout | null = null;

/**
 * Start auto-trading session
 */
export function startAutoTrading(
  state: SimulationState,
  config: Partial<AutoTradeConfig> = {}
): AutoTradeSession {
  const finalConfig = { ...defaultConfig, ...config };

  autoTradeSession = {
    id: `session-${Date.now()}`,
    startTime: new Date().toISOString(),
    config: finalConfig,
    tradesExecuted: 0,
    totalProfit: 0,
    isActive: true,
  };

  return autoTradeSession;
}

/**
 * Stop auto-trading session
 */
export function stopAutoTrading(): AutoTradeSession | null {
  if (autoTradeSession) {
    autoTradeSession.isActive = false;
  }
  if (autoTradeInterval) {
    clearInterval(autoTradeInterval);
    autoTradeInterval = null;
  }
  return autoTradeSession;
}

/**
 * Execute auto-trading logic
 */
export function executeAutoTrade(state: SimulationState): SimulationState {
  if (!autoTradeSession || !autoTradeSession.isActive) {
    return state;
  }

  const config = autoTradeSession.config;
  let newState = { ...state };

  // Check if we can open new trades
  const openTradesCount = newState.open_trades.length;
  if (openTradesCount < config.maxOpenTrades) {
    // Generate random trade signal (in production, use actual strategy signals)
    const shouldOpenTrade = Math.random() > 0.6; // 40% chance to open trade

    if (shouldOpenTrade) {
      const cryptos = ["BTC", "ETH"];
      const randomCrypto = cryptos[Math.floor(Math.random() * cryptos.length)];

      // Calculate position size based on risk
      const riskAmount = (newState.current_equity * config.riskPerTrade) / 100;
      const entryPrice = 45000 + Math.random() * 5000; // Simulated price

      // Open trade
      newState = openTrade(newState, `${randomCrypto}-USD`, riskAmount, entryPrice);

      if (autoTradeSession) {
        autoTradeSession.tradesExecuted++;
      }
    }
  }

  // Update prices and check for auto-close conditions
  for (const trade of newState.open_trades) {
    // Simulate price movement
    const priceChange = (Math.random() - 0.5) * 0.02; // -1% to +1%
    const newPrice = trade.current_rate * (1 + priceChange);

    newState = updateTradePrice(newState, trade.trade_id, newPrice);

    // Check auto-close conditions
    const updatedTrade = newState.trades.find((t) => t.trade_id === trade.trade_id);
    if (updatedTrade && updatedTrade.is_open) {
      if (
        updatedTrade.profit_ratio >= config.autoCloseProfitPercent / 100 ||
        updatedTrade.profit_ratio <= config.autoCloseLossPercent / 100
      ) {
        newState = closeTrade(newState, trade.trade_id, newPrice);

        if (autoTradeSession) {
          autoTradeSession.totalProfit += updatedTrade.profit_abs;
        }
      }
    }
  }

  return newState;
}

/**
 * Get current auto-trading session
 */
export function getAutoTradeSession(): AutoTradeSession | null {
  return autoTradeSession;
}

/**
 * Update auto-trading configuration
 */
export function updateAutoTradeConfig(
  config: Partial<AutoTradeConfig>
): AutoTradeConfig {
  if (autoTradeSession) {
    autoTradeSession.config = {
      ...autoTradeSession.config,
      ...config,
    };
    return autoTradeSession.config;
  }
  return defaultConfig;
}
