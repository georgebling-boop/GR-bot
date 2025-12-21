import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  initializeSimulation,
  openTrade,
  closeTrade,
  updateTradePrice,
  generateSampleTrades,
  getSimulationSummary,
  type SimulationState,
} from "../testTradingSimulator";

// Store simulation state in memory (in production, use database)
let simulationState: SimulationState | null = null;

/**
 * Test Trading Router
 * Provides procedures for simulating trades with $100 virtual account
 */

export const testTradingRouter = router({
  /**
   * Initialize a new simulation
   */
  initializeSimulation: publicProcedure.mutation(() => {
    simulationState = initializeSimulation();
    return {
      success: true,
      message: "Simulation initialized with $100 starting capital",
      state: simulationState,
    };
  }),

  /**
   * Get current simulation state
   */
  getState: publicProcedure.query(() => {
    if (!simulationState) {
      simulationState = initializeSimulation();
    }
    return simulationState;
  }),

  /**
   * Get simulation summary
   */
  getSummary: publicProcedure.query(() => {
    if (!simulationState) {
      simulationState = initializeSimulation();
    }
    return getSimulationSummary(simulationState);
  }),

  /**
   * Open a test trade
   */
  openTrade: publicProcedure
    .input(
      z.object({
        pair: z.string(),
        stake_amount: z.number(),
        open_rate: z.number(),
      })
    )
    .mutation(({ input }) => {
      if (!simulationState) {
        simulationState = initializeSimulation();
      }

      // Validate stake amount
      if (input.stake_amount > simulationState.current_equity) {
        return {
          success: false,
          error: `Insufficient funds. Available: $${simulationState.current_equity.toFixed(2)}, Required: $${input.stake_amount.toFixed(2)}`,
        };
      }

      simulationState = openTrade(
        simulationState,
        input.pair,
        input.stake_amount,
        input.open_rate
      );

      return {
        success: true,
        message: `Opened trade for ${input.pair}`,
        state: simulationState,
      };
    }),

  /**
   * Close a test trade
   */
  closeTrade: publicProcedure
    .input(
      z.object({
        trade_id: z.number(),
        close_rate: z.number(),
      })
    )
    .mutation(({ input }) => {
      if (!simulationState) {
        return {
          success: false,
          error: "No simulation active",
        };
      }

      const trade = simulationState.trades.find(
        (t) => t.trade_id === input.trade_id
      );

      if (!trade) {
        return {
          success: false,
          error: `Trade ${input.trade_id} not found`,
        };
      }

      if (!trade.is_open) {
        return {
          success: false,
          error: `Trade ${input.trade_id} is already closed`,
        };
      }

      simulationState = closeTrade(
        simulationState,
        input.trade_id,
        input.close_rate
      );

      return {
        success: true,
        message: `Closed trade ${input.trade_id}`,
        state: simulationState,
      };
    }),

  /**
   * Update price of an open trade
   */
  updateTradePrice: publicProcedure
    .input(
      z.object({
        trade_id: z.number(),
        current_rate: z.number(),
      })
    )
    .mutation(({ input }) => {
      if (!simulationState) {
        return {
          success: false,
          error: "No simulation active",
        };
      }

      simulationState = updateTradePrice(
        simulationState,
        input.trade_id,
        input.current_rate
      );

      return {
        success: true,
        state: simulationState,
      };
    }),

  /**
   * Generate sample trades for testing
   */
  generateSampleTrades: publicProcedure.mutation(() => {
    if (!simulationState) {
      simulationState = initializeSimulation();
    }

    simulationState = generateSampleTrades(simulationState);

    return {
      success: true,
      message: "Generated 5 sample trades",
      state: simulationState,
    };
  }),

  /**
   * Reset simulation
   */
  reset: publicProcedure.mutation(() => {
    simulationState = initializeSimulation();
    return {
      success: true,
      message: "Simulation reset",
      state: simulationState,
    };
  }),
});
