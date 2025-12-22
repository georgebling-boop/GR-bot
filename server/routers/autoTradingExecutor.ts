import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  startAutoTrading,
  stopAutoTrading,
  executeAutoTrade,
  getAutoTradeSession,
  updateAutoTradeConfig,
  type AutoTradeConfig,
} from "../autoTradingExecutor";
import { initializeSimulation } from "../testTradingSimulator";

// Store simulation state for auto-trading
let simulationState = initializeSimulation();
let autoTradeInterval: NodeJS.Timeout | null = null;

export const autoTradingExecutorRouter = router({
  /**
   * Start auto-trading session
   */
  startAutoTrading: publicProcedure
    .input(
      z.object({
        strategy: z.string().optional(),
        riskPerTrade: z.number().optional(),
        maxOpenTrades: z.number().optional(),
        autoCloseProfitPercent: z.number().optional(),
        autoCloseLossPercent: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      // Reset simulation state
      simulationState = initializeSimulation();

      // Start auto-trading session
      const config: Partial<AutoTradeConfig> = {
        strategy: input.strategy || "momentum",
        riskPerTrade: input.riskPerTrade || 5,
        maxOpenTrades: input.maxOpenTrades || 3,
        autoCloseProfitPercent: input.autoCloseProfitPercent || 2,
        autoCloseLossPercent: input.autoCloseLossPercent || -1,
      };

      const session = startAutoTrading(simulationState, config);

      // Start auto-trading loop (every 10 seconds)
      if (autoTradeInterval) {
        clearInterval(autoTradeInterval);
      }

      autoTradeInterval = setInterval(() => {
        simulationState = executeAutoTrade(simulationState);
      }, 10000);

      return {
        success: true,
        message: "Auto-trading started with $100 virtual account",
        session,
        state: simulationState,
      };
    }),

  /**
   * Stop auto-trading session
   */
  stopAutoTrading: publicProcedure.mutation(() => {
    const session = stopAutoTrading();

    if (autoTradeInterval) {
      clearInterval(autoTradeInterval);
      autoTradeInterval = null;
    }

    return {
      success: true,
      message: "Auto-trading stopped",
      session,
      state: simulationState,
    };
  }),

  /**
   * Get current auto-trading session
   */
  getSession: publicProcedure.query(() => {
    const session = getAutoTradeSession();
    return {
      success: true,
      session,
      state: simulationState,
    };
  }),

  /**
   * Get auto-trading state
   */
  getState: publicProcedure.query(() => {
    return {
      success: true,
      state: simulationState,
    };
  }),

  /**
   * Update auto-trading configuration
   */
  updateConfig: publicProcedure
    .input(
      z.object({
        strategy: z.string().optional(),
        riskPerTrade: z.number().optional(),
        maxOpenTrades: z.number().optional(),
        autoCloseProfitPercent: z.number().optional(),
        autoCloseLossPercent: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const config = updateAutoTradeConfig(input);

      return {
        success: true,
        message: "Auto-trading configuration updated",
        config,
      };
    }),

  /**
   * Execute one iteration of auto-trading
   */
  executeIteration: publicProcedure.mutation(() => {
    simulationState = executeAutoTrade(simulationState);

    return {
      success: true,
      state: simulationState,
    };
  }),
});
