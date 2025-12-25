/**
 * Notifications Router
 * API endpoints for email/SMS notification management
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendNotification,
  testNotification,
  getNotificationHistory,
  getNotificationStats,
} from "../notificationService";

export const notificationsRouter = router({
  // Get notification preferences
  getPreferences: publicProcedure.query(async () => {
    return getNotificationPreferences();
  }),

  // Update notification preferences
  updatePreferences: publicProcedure
    .input(z.object({
      email: z.string().email().optional(),
      emailEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
      phoneNumber: z.string().optional(),
      webhookUrl: z.string().optional(),
      alertOnOpportunity: z.boolean().optional(),
      alertOnProfit: z.boolean().optional(),
      alertOnLoss: z.boolean().optional(),
      alertOnRisk: z.boolean().optional(),
      minConfidence: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      return updateNotificationPreferences(input);
    }),

  // Send a test notification
  testNotification: publicProcedure.mutation(async () => {
    return testNotification();
  }),

  // Get notification history
  getHistory: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
    }).optional())
    .query(async ({ input }) => {
      return getNotificationHistory(input?.limit || 50);
    }),

  // Get notification stats
  getStats: publicProcedure.query(async () => {
    return getNotificationStats();
  }),

  // Manually trigger a notification (for testing)
  sendAlert: publicProcedure
    .input(z.object({
      symbol: z.string(),
      alertType: z.enum(["opportunity", "risk", "profit", "loss", "pattern"]),
      strategy: z.string(),
      confidence: z.number().min(0).max(100),
      message: z.string(),
      price: z.string(),
    }))
    .mutation(async ({ input }) => {
      return sendNotification(input);
    }),
});
