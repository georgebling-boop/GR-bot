import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  initializeSession,
  getSession,
  startTrading,
  stopTrading,
  recordTrade,
  resetSession,
  getBotHealth,
  getWeeklyTarget,
  getRiskManagement,
  analyzeSmartEntry,
  getHealthAlerts,
  resolveAlert,
  getPerformanceAnalytics,
} from "../advancedTradingEngine";

export const advancedTradingRouter = router({
  // Session management
  initSession: publicProcedure
    .input(z.object({ startingEquity: z.number().default(800) }))
    .mutation(async ({ input }: { input: { startingEquity: number } }) => {
      return initializeSession(input.startingEquity);
    }),

  getSession: publicProcedure.query(async () => {
    return getSession();
  }),

  startTrading: publicProcedure.mutation(async () => {
    return startTrading();
  }),

  stopTrading: publicProcedure.mutation(async () => {
    return stopTrading();
  }),

  resetSession: publicProcedure.mutation(async () => {
    return resetSession();
  }),

  recordTrade: publicProcedure
    .input(z.object({
      profit: z.number(),
      isWin: z.boolean(),
    }))
    .mutation(async ({ input }: { input: { profit: number; isWin: boolean } }) => {
      return recordTrade(input.profit, input.isWin);
    }),

  // Health monitoring
  getBotHealth: publicProcedure.query(async () => {
    return getBotHealth();
  }),

  getHealthAlerts: publicProcedure.query(async () => {
    return getHealthAlerts();
  }),

  resolveAlert: publicProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input }: { input: { alertId: string } }) => {
      resolveAlert(input.alertId);
      return { success: true };
    }),

  // Targets and risk
  getWeeklyTarget: publicProcedure.query(async () => {
    return getWeeklyTarget();
  }),

  getRiskManagement: publicProcedure.query(async () => {
    return getRiskManagement();
  }),

  // Smart entry analysis
  analyzeEntry: publicProcedure
    .input(z.object({
      symbol: z.string(),
      currentPrice: z.number(),
      priceHistory: z.array(z.number()),
    }))
    .query(async ({ input }: { input: { symbol: string; currentPrice: number; priceHistory: number[] } }) => {
      return analyzeSmartEntry(input.symbol, input.currentPrice, input.priceHistory);
    }),

  // Performance analytics
  getPerformanceAnalytics: publicProcedure.query(async () => {
    return getPerformanceAnalytics();
  }),
});
