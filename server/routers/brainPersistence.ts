import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  saveBrainToDatabase,
  loadBrainFromDatabase,
  startAutoSave,
  stopAutoSave,
  getPersistenceStatus,
  getBrainHistory,
} from "../brainPersistence";

export const brainPersistenceRouter = router({
  /**
   * Save brain state to database
   */
  save: publicProcedure.mutation(async () => {
    return saveBrainToDatabase();
  }),

  /**
   * Load brain state from database
   */
  load: publicProcedure.mutation(async () => {
    return loadBrainFromDatabase();
  }),

  /**
   * Get persistence status
   */
  getStatus: publicProcedure.query(() => {
    return getPersistenceStatus();
  }),

  /**
   * Start auto-save
   */
  startAutoSave: publicProcedure.mutation(() => {
    startAutoSave();
    return { success: true, message: "Auto-save started" };
  }),

  /**
   * Stop auto-save
   */
  stopAutoSave: publicProcedure.mutation(() => {
    stopAutoSave();
    return { success: true, message: "Auto-save stopped" };
  }),

  /**
   * Get brain history
   */
  getHistory: publicProcedure.query(async () => {
    return getBrainHistory();
  }),
});
