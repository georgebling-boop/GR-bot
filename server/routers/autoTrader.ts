import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  generateTradeSignals,
  getAvailableStrategies,
  calculatePositionSize,
  simulateTradeOutcome,
} from "../autoTrader";
import { fetchCryptoPrices } from "../marketData";

/**
 * Auto Trading Router
 * Provides automated trading signals and strategy learning
 */

export const autoTraderRouter = router({
  /**
   * Get available trading strategies
   */
  getStrategies: publicProcedure.query(async () => {
    const strategies = getAvailableStrategies();
    return {
      success: true,
      strategies,
      descriptions: {
        momentum: "Buy on positive momentum, sell on negative",
        "mean-reversion": "Buy when price is near 24h low, sell near high",
        volatility: "Trade when volatility is high",
        rsi: "Buy oversold, sell overbought conditions",
        "trend-following": "Follow strong trends in either direction",
      },
    };
  }),

  /**
   * Generate trading signals for all strategies
   */
  generateSignals: publicProcedure
    .input(
      z.object({
        cryptoIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const prices = await fetchCryptoPrices(input.cryptoIds);
        const strategies = getAvailableStrategies();

        const allSignals: Record<string, any[]> = {};

        for (const strategy of strategies) {
          const signals = generateTradeSignals(prices, strategy);
          allSignals[strategy] = signals;
        }

        return {
          success: true,
          signals: allSignals,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to generate signals: ${error}`,
        };
      }
    }),

  /**
   * Get signals for a specific strategy
   */
  getStrategySignals: publicProcedure
    .input(
      z.object({
        strategy: z.string(),
        cryptoIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const prices = await fetchCryptoPrices(input.cryptoIds);
        const signals = generateTradeSignals(prices, input.strategy);

        return {
          success: true,
          strategy: input.strategy,
          signals,
          count: signals.length,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get signals: ${error}`,
        };
      }
    }),

  /**
   * Calculate position size for risk management
   */
  calculatePositionSize: publicProcedure
    .input(
      z.object({
        accountEquity: z.number(),
        riskPercentage: z.number().optional(),
      })
    )
    .query(({ input }) => {
      const positionSize = calculatePositionSize(
        input.accountEquity,
        input.riskPercentage
      );

      return {
        success: true,
        accountEquity: input.accountEquity,
        riskPercentage: input.riskPercentage || 1,
        positionSize,
      };
    }),

  /**
   * Simulate trade outcome
   */
  simulateTrade: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        action: z.enum(["buy", "sell"]),
        entryPrice: z.number(),
        stopLoss: z.number(),
        takeProfit: z.number(),
        currentPrice: z.number(),
      })
    )
    .query(({ input }) => {
      const signal = {
        symbol: input.symbol,
        action: input.action as "buy" | "sell",
        strategy: "manual",
        confidence: 0.5,
        entryPrice: input.entryPrice,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
        reason: "Manual simulation",
      };

      const outcome = simulateTradeOutcome(signal, input.currentPrice);

      return {
        success: true,
        outcome,
        signal,
      };
    }),

  /**
   * Get strategy performance comparison
   */
  getStrategyPerformance: publicProcedure.query(async () => {
    try {
      const prices = await fetchCryptoPrices();
      const strategies = getAvailableStrategies();

      const performance: Record<string, any> = {};

      for (const strategy of strategies) {
        const signals = generateTradeSignals(prices, strategy);

        let totalProfit = 0;
        let winCount = 0;
        let lossCount = 0;

        for (const signal of signals) {
          const outcome = simulateTradeOutcome(signal, signal.entryPrice);
          totalProfit += outcome.profit;
          if (outcome.success) {
            winCount++;
          } else {
            lossCount++;
          }
        }

        const totalTrades = signals.length;
        const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

        performance[strategy] = {
          signals: totalTrades,
          totalProfit: totalProfit.toFixed(2),
          winRate: winRate.toFixed(2),
          winCount,
          lossCount,
          profitPerTrade: totalTrades > 0 ? (totalProfit / totalTrades).toFixed(2) : 0,
        };
      }

      return {
        success: true,
        performance,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get performance: ${error}`,
      };
    }
  }),
});
