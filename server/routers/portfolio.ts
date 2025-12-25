/**
 * Portfolio Router
 * API endpoints for portfolio diversification management
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  initializePortfolio,
  updatePortfolioPrices,
  addPosition,
  removePosition,
  getPortfolioSummary,
  getRebalanceRecommendations,
  loadPortfolioFromDatabase,
  setTargetAllocation,
  getAllocationChartData,
  resetPortfolio,
} from "../portfolioService";

export const portfolioRouter = router({
  // Initialize portfolio with starting balance
  initialize: publicProcedure
    .input(z.object({
      startingBalance: z.number().min(1),
    }))
    .mutation(async ({ input }) => {
      return initializePortfolio(input.startingBalance);
    }),

  // Get portfolio summary
  getSummary: publicProcedure.query(() => {
    return getPortfolioSummary();
  }),

  // Update prices for all holdings
  updatePrices: publicProcedure
    .input(z.object({
      prices: z.record(z.string(), z.number()),
    }))
    .mutation(async ({ input }) => {
      return updatePortfolioPrices(input.prices);
    }),

  // Add to a position
  addPosition: publicProcedure
    .input(z.object({
      symbol: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      return addPosition(input.symbol, input.quantity, input.price);
    }),

  // Remove from a position
  removePosition: publicProcedure
    .input(z.object({
      symbol: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      return removePosition(input.symbol, input.quantity, input.price);
    }),

  // Get rebalancing recommendations
  getRebalanceRecommendations: publicProcedure
    .input(z.object({
      totalValue: z.number().positive(),
    }))
    .query(({ input }) => {
      return getRebalanceRecommendations(input.totalValue);
    }),

  // Load portfolio from database
  loadFromDatabase: publicProcedure.mutation(async () => {
    return loadPortfolioFromDatabase();
  }),

  // Set target allocation for a symbol
  setTargetAllocation: publicProcedure
    .input(z.object({
      symbol: z.string(),
      targetPercent: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      return setTargetAllocation(input.symbol, input.targetPercent);
    }),

  // Get allocation chart data
  getAllocationChartData: publicProcedure.query(() => {
    return getAllocationChartData();
  }),

  // Reset portfolio
  reset: publicProcedure.mutation(async () => {
    return resetPortfolio();
  }),
});
