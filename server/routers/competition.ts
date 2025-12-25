/**
 * Competition Router
 * API endpoints for paper trading competitions
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createCompetition,
  startCompetition,
  endCompetition,
  getCompetitionStatus,
  getLeaderboard,
  getAvailableStrategies,
  getCompetitionHistory,
  cancelCompetition,
  getWinningStrategyAnalysis,
} from "../competitionService";

export const competitionRouter = router({
  // Create a new competition
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      startingBalance: z.number().min(100),
      duration: z.number().min(1).max(1440), // 1 minute to 24 hours
      strategies: z.array(z.string()).min(2).max(8),
    }))
    .mutation(async ({ input }) => {
      return createCompetition(input);
    }),

  // Start the competition
  start: publicProcedure.mutation(async () => {
    return startCompetition();
  }),

  // End the competition
  end: publicProcedure.mutation(async () => {
    return endCompetition();
  }),

  // Cancel the competition
  cancel: publicProcedure.mutation(async () => {
    return cancelCompetition();
  }),

  // Get current competition status
  getStatus: publicProcedure.query(() => {
    return getCompetitionStatus();
  }),

  // Get leaderboard
  getLeaderboard: publicProcedure.query(() => {
    return getLeaderboard();
  }),

  // Get available strategies
  getStrategies: publicProcedure.query(() => {
    return getAvailableStrategies();
  }),

  // Get competition history
  getHistory: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional().default(10),
    }).optional())
    .query(async ({ input }) => {
      return getCompetitionHistory(input?.limit || 10);
    }),

  // Get winning strategy analysis
  getWinningAnalysis: publicProcedure.query(() => {
    return getWinningStrategyAnalysis();
  }),
});
