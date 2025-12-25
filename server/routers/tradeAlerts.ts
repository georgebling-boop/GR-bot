import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getRecentAlerts,
  getUnreadCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  getAlertsByType,
  getAlertsFromLastHours,
  getAlertStats,
  clearOldAlerts,
  type AlertType,
} from "../tradeAlerts";

export const tradeAlertsRouter = router({
  /**
   * Get recent alerts
   */
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      const alerts = await getRecentAlerts(input?.limit || 20);
      return { alerts };
    }),

  /**
   * Get unread count
   */
  getUnreadCount: publicProcedure.query(async () => {
    const count = await getUnreadCount();
    return { count };
  }),

  /**
   * Mark alert as read
   */
  markAsRead: publicProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await markAlertAsRead(input.alertId);
      return { success };
    }),

  /**
   * Mark all alerts as read
   */
  markAllAsRead: publicProcedure.mutation(async () => {
    const success = await markAllAlertsAsRead();
    return { success };
  }),

  /**
   * Get alerts by type
   */
  getByType: publicProcedure
    .input(z.object({
      alertType: z.enum(["opportunity", "risk", "profit", "loss", "pattern"]),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const alerts = await getAlertsByType(input.alertType as AlertType, input.limit);
      return { alerts };
    }),

  /**
   * Get alerts from last N hours
   */
  getFromLastHours: publicProcedure
    .input(z.object({ hours: z.number().min(1).max(168).default(24) }))
    .query(async ({ input }) => {
      const alerts = await getAlertsFromLastHours(input.hours);
      return { alerts };
    }),

  /**
   * Get alert statistics
   */
  getStats: publicProcedure.query(async () => {
    return getAlertStats();
  }),

  /**
   * Clear old alerts
   */
  clearOld: publicProcedure.mutation(async () => {
    const count = await clearOldAlerts();
    return { success: true, clearedCount: count };
  }),
});
