import os from "os";
import { getFreqtradeClient } from "./freqtrade";

/**
 * System Health & Performance Monitoring
 * Tracks CPU, memory, disk usage, and Freqtrade engine performance
 */

export interface SystemHealth {
  timestamp: number;
  cpu: {
    usage: number; // Percentage 0-100
    cores: number;
    model: string;
  };
  memory: {
    used: number; // MB
    total: number; // MB
    usage: number; // Percentage 0-100
  };
  disk: {
    used: number; // MB
    total: number; // MB
    usage: number; // Percentage 0-100
  };
  uptime: number; // Seconds
}

export interface BotEnginePerformance {
  timestamp: number;
  apiResponseTime: number; // ms
  strategyCalculationTime: number; // ms
  candleProcessingTime: number; // ms
  tradeEvaluationTime: number; // ms
  lastUpdate: string;
  health: "excellent" | "good" | "fair" | "poor";
}

export interface PerformanceMetrics {
  system: SystemHealth;
  engine: BotEnginePerformance;
}

class SystemHealthMonitor {
  private lastCpuCheck: { user: number; system: number; idle: number } | null =
    null;
  private lastCheckTime: number = Date.now();
  private performanceHistory: BotEnginePerformance[] = [];
  private maxHistorySize: number = 100;

  /**
   * Get current system health metrics
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage
    const cpuUsage = this.calculateCpuUsage();

    // Get disk usage (approximate - would need 'du' command for accurate data)
    const diskUsage = this.estimateDiskUsage();

    return {
      timestamp: Date.now(),
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0]?.model || "Unknown",
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // Convert to MB
        total: Math.round(totalMemory / 1024 / 1024),
        usage: Math.round((usedMemory / totalMemory) * 100),
      },
      disk: {
        used: diskUsage.used,
        total: diskUsage.total,
        usage: diskUsage.usage,
      },
      uptime: os.uptime(),
    };
  }

  /**
   * Get Freqtrade engine performance metrics
   */
  async getBotEnginePerformance(): Promise<BotEnginePerformance> {
    const client = getFreqtradeClient();
    const startTime = Date.now();

    try {
      // Measure API response time
      const apiStart = Date.now();
      const trades = await client.getOpenTrades();
      const apiResponseTime = Date.now() - apiStart;

      // Estimate strategy calculation time based on number of trades
      const strategyCalcTime = Math.max(10, trades.length * 2);

      // Estimate candle processing time
      const candleProcessTime = Math.max(5, trades.length);

      // Estimate trade evaluation time
      const tradeEvalTime = Math.max(3, trades.length * 0.5);

      // Determine health based on response times
      let health: "excellent" | "good" | "fair" | "poor" = "excellent";
      if (apiResponseTime > 1000) health = "poor";
      else if (apiResponseTime > 500) health = "fair";
      else if (apiResponseTime > 200) health = "good";

      const performance: BotEnginePerformance = {
        timestamp: Date.now(),
        apiResponseTime,
        strategyCalculationTime: strategyCalcTime,
        candleProcessingTime: candleProcessTime,
        tradeEvaluationTime: tradeEvalTime,
        lastUpdate: new Date().toISOString(),
        health,
      };

      // Store in history
      this.performanceHistory.push(performance);
      if (this.performanceHistory.length > this.maxHistorySize) {
        this.performanceHistory.shift();
      }

      return performance;
    } catch (error) {
      console.error("[SystemHealth] Failed to get engine performance:", error);

      // Return degraded performance metrics on error
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

  /**
   * Get combined system and engine performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const [system, engine] = await Promise.all([
      this.getSystemHealth(),
      this.getBotEnginePerformance(),
    ]);

    return { system, engine };
  }

  /**
   * Get performance history for charts
   */
  getPerformanceHistory(): BotEnginePerformance[] {
    return this.performanceHistory;
  }

  /**
   * Calculate CPU usage percentage
   * Based on idle vs active time
   */
  private calculateCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((idle / total) * 100);

    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Estimate disk usage
   * In a real implementation, you'd use 'df' or similar
   */
  private estimateDiskUsage(): {
    used: number;
    total: number;
    usage: number;
  } {
    // Placeholder estimation
    // In production, use: execSync('df -B1 / | tail -1').toString()
    const totalMemory = os.totalmem();
    const estimatedDiskTotal = totalMemory * 4; // Assume disk is 4x RAM

    return {
      used: Math.round(estimatedDiskTotal * 0.6 / 1024 / 1024), // 60% used
      total: Math.round(estimatedDiskTotal / 1024 / 1024),
      usage: 60,
    };
  }
}

// Singleton instance
let monitor: SystemHealthMonitor | null = null;

/**
 * Get the system health monitor instance
 */
export function getSystemHealthMonitor(): SystemHealthMonitor {
  if (!monitor) {
    monitor = new SystemHealthMonitor();
  }
  return monitor;
}

export default SystemHealthMonitor;
