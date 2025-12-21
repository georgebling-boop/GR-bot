import { publicProcedure, router } from "../_core/trpc";
import {
  getSystemHealthMonitor,
  type SystemHealth,
  type BotEnginePerformance,
  type PerformanceMetrics,
} from "../systemHealth";

/**
 * System Health & Performance tRPC Router
 * Provides real-time monitoring of system and bot engine performance
 */

export const systemHealthRouter = router({
  /**
   * Get current system health metrics
   * CPU, memory, disk, uptime
   */
  health: publicProcedure.query(async (): Promise<SystemHealth> => {
    const monitor = getSystemHealthMonitor();
    try {
      return await monitor.getSystemHealth();
    } catch (error) {
      console.error("[tRPC] Failed to get system health:", error);
      return {
        timestamp: Date.now(),
        cpu: {
          usage: 0,
          cores: 0,
          model: "Unknown",
        },
        memory: {
          used: 0,
          total: 0,
          usage: 0,
        },
        disk: {
          used: 0,
          total: 0,
          usage: 0,
        },
        uptime: 0,
      };
    }
  }),

  /**
   * Get Freqtrade engine performance metrics
   * API response time, strategy calculation time, etc.
   */
  enginePerformance: publicProcedure.query(
    async (): Promise<BotEnginePerformance> => {
      const monitor = getSystemHealthMonitor();
      try {
        return await monitor.getBotEnginePerformance();
      } catch (error) {
        console.error("[tRPC] Failed to get engine performance:", error);
        return {
          timestamp: Date.now(),
          apiResponseTime: 0,
          strategyCalculationTime: 0,
          candleProcessingTime: 0,
          tradeEvaluationTime: 0,
          lastUpdate: new Date().toISOString(),
          health: "poor",
        };
      }
    }
  ),

  /**
   * Get combined system and engine performance metrics
   * Useful for dashboard overview
   */
  combined: publicProcedure.query(
    async (): Promise<PerformanceMetrics> => {
      const monitor = getSystemHealthMonitor();
      try {
        return await monitor.getPerformanceMetrics();
      } catch (error) {
        console.error("[tRPC] Failed to get combined metrics:", error);
        return {
          system: {
            timestamp: Date.now(),
            cpu: { usage: 0, cores: 0, model: "Unknown" },
            memory: { used: 0, total: 0, usage: 0 },
            disk: { used: 0, total: 0, usage: 0 },
            uptime: 0,
          },
          engine: {
            timestamp: Date.now(),
            apiResponseTime: 0,
            strategyCalculationTime: 0,
            candleProcessingTime: 0,
            tradeEvaluationTime: 0,
            lastUpdate: new Date().toISOString(),
            health: "poor",
          },
        };
      }
    }
  ),

  /**
   * Get performance history for charting
   * Returns last 100 performance samples
   */
  history: publicProcedure.query(
    async (): Promise<BotEnginePerformance[]> => {
      const monitor = getSystemHealthMonitor();
      try {
        return monitor.getPerformanceHistory();
      } catch (error) {
        console.error("[tRPC] Failed to get performance history:", error);
        return [];
      }
    }
  ),
});
