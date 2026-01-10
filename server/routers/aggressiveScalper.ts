import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  initializeSession,
  getSession,
  getDrawdownStatus,
  startTrading,
  stopTrading,
  executeTradingCycle,
  resetSession,
  getAllPrices,
  getAllPricesAsync,
  runBacktest,
} from "../aggressiveScalper";

export const aggressiveScalperRouter = router({
  // Initialize session with $800
  initialize: publicProcedure.mutation(async () => {
    const session = initializeSession(800);
    return { success: true, session };
  }),

  // Get current session
  getSession: publicProcedure.query(async () => {
    const session = getSession();
    return { session };
  }),

  // Start automated trading
  start: publicProcedure.mutation(async () => {
    const session = startTrading();
    return { success: true, session };
  }),

  // Stop automated trading
  stop: publicProcedure.mutation(async () => {
    const session = stopTrading();
    return { success: true, session };
  }),

  // Execute one trading cycle
  executeCycle: publicProcedure.mutation(async () => {
    const result = await executeTradingCycle();
    return {
      success: true,
      session: result.session,
      actions: result.actions,
      newTrades: result.newTrades,
      closedTrades: result.closedTrades,
      tradingPaused: result.tradingPaused,
      pauseReason: result.pauseReason,
    };
  }),

  // Get drawdown protection status
  getDrawdownStatus: publicProcedure.query(() => {
    return getDrawdownStatus();
  }),

  // Reset session to $800
  reset: publicProcedure.mutation(async () => {
    const session = resetSession();
    return { success: true, session };
  }),

  // Get all live prices
  getPrices: publicProcedure.query(async () => {
    const prices = await getAllPricesAsync();
    return { prices };
  }),

  // Run backtest
  backtest: publicProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .mutation(async ({ input }) => {
      const result = await runBacktest(input.days);
      return { success: true, result };
    }),
});
