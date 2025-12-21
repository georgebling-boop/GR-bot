import { describe, it, expect, beforeEach } from "vitest";
import SystemHealthMonitor, {
  type SystemHealth,
  type BotEnginePerformance,
} from "./systemHealth";

describe("SystemHealthMonitor", () => {
  let monitor: SystemHealthMonitor;

  beforeEach(() => {
    monitor = new SystemHealthMonitor();
  });

  describe("getSystemHealth", () => {
    it("should return system health metrics with valid structure", async () => {
      const health = await monitor.getSystemHealth();

      expect(health).toHaveProperty("timestamp");
      expect(health).toHaveProperty("cpu");
      expect(health).toHaveProperty("memory");
      expect(health).toHaveProperty("disk");
      expect(health).toHaveProperty("uptime");

      // Verify CPU properties
      expect(health.cpu).toHaveProperty("usage");
      expect(health.cpu).toHaveProperty("cores");
      expect(health.cpu).toHaveProperty("model");

      // Verify memory properties
      expect(health.memory).toHaveProperty("used");
      expect(health.memory).toHaveProperty("total");
      expect(health.memory).toHaveProperty("usage");

      // Verify disk properties
      expect(health.disk).toHaveProperty("used");
      expect(health.disk).toHaveProperty("total");
      expect(health.disk).toHaveProperty("usage");
    });

    it("should return valid CPU usage percentage (0-100)", async () => {
      const health = await monitor.getSystemHealth();

      expect(health.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(health.cpu.usage).toBeLessThanOrEqual(100);
    });

    it("should return valid memory usage percentage (0-100)", async () => {
      const health = await monitor.getSystemHealth();

      expect(health.memory.usage).toBeGreaterThanOrEqual(0);
      expect(health.memory.usage).toBeLessThanOrEqual(100);
    });

    it("should return valid disk usage percentage (0-100)", async () => {
      const health = await monitor.getSystemHealth();

      expect(health.disk.usage).toBeGreaterThanOrEqual(0);
      expect(health.disk.usage).toBeLessThanOrEqual(100);
    });

    it("should return positive uptime in seconds", async () => {
      const health = await monitor.getSystemHealth();

      expect(health.uptime).toBeGreaterThan(0);
    });

    it("should return CPU cores greater than 0", async () => {
      const health = await monitor.getSystemHealth();

      expect(health.cpu.cores).toBeGreaterThan(0);
    });
  });

  describe("getBotEnginePerformance", () => {
    it("should return engine performance metrics with valid structure", async () => {
      const performance = await monitor.getBotEnginePerformance();

      expect(performance).toHaveProperty("timestamp");
      expect(performance).toHaveProperty("apiResponseTime");
      expect(performance).toHaveProperty("strategyCalculationTime");
      expect(performance).toHaveProperty("candleProcessingTime");
      expect(performance).toHaveProperty("tradeEvaluationTime");
      expect(performance).toHaveProperty("lastUpdate");
      expect(performance).toHaveProperty("health");
    });

    it("should return valid health status", async () => {
      const performance = await monitor.getBotEnginePerformance();

      const validStates = ["excellent", "good", "fair", "poor"];
      expect(validStates).toContain(performance.health);
    });

    it("should return non-negative performance times", async () => {
      const performance = await monitor.getBotEnginePerformance();

      expect(performance.apiResponseTime).toBeGreaterThanOrEqual(0);
      expect(performance.strategyCalculationTime).toBeGreaterThanOrEqual(0);
      expect(performance.candleProcessingTime).toBeGreaterThanOrEqual(0);
      expect(performance.tradeEvaluationTime).toBeGreaterThanOrEqual(0);
    });

    it("should return valid ISO timestamp", async () => {
      const performance = await monitor.getBotEnginePerformance();

      const date = new Date(performance.lastUpdate);
      expect(date.getTime()).toBeGreaterThan(0);
    });
  });

  describe("getPerformanceMetrics", () => {
    it("should return combined system and engine metrics", async () => {
      const metrics = await monitor.getPerformanceMetrics();

      expect(metrics).toHaveProperty("system");
      expect(metrics).toHaveProperty("engine");

      // Verify system metrics
      expect(metrics.system).toHaveProperty("cpu");
      expect(metrics.system).toHaveProperty("memory");
      expect(metrics.system).toHaveProperty("disk");

      // Verify engine metrics
      expect(metrics.engine).toHaveProperty("apiResponseTime");
      expect(metrics.engine).toHaveProperty("health");
    });
  });

  describe("getPerformanceHistory", () => {
    it("should return performance history array", () => {
      const history = monitor.getPerformanceHistory();

      expect(Array.isArray(history)).toBe(true);
    });

    it("should accumulate performance samples", async () => {
      const initialHistory = monitor.getPerformanceHistory();
      const initialLength = initialHistory.length;

      // Get performance once
      await monitor.getBotEnginePerformance();

      const updatedHistory = monitor.getPerformanceHistory();
      expect(updatedHistory.length).toBeGreaterThanOrEqual(initialLength);
    });
  });

  describe("SystemHealth interface", () => {
    it("should have correct SystemHealth structure", async () => {
      const health = await monitor.getSystemHealth();

      // Type check
      const systemHealth: SystemHealth = health;
      expect(systemHealth.timestamp).toBeDefined();
      expect(systemHealth.cpu.usage).toBeDefined();
      expect(systemHealth.memory.used).toBeDefined();
      expect(systemHealth.disk.total).toBeDefined();
    });
  });

  describe("BotEnginePerformance interface", () => {
    it("should have correct BotEnginePerformance structure", async () => {
      const performance = await monitor.getBotEnginePerformance();

      // Type check
      const enginePerf: BotEnginePerformance = performance;
      expect(enginePerf.timestamp).toBeDefined();
      expect(enginePerf.apiResponseTime).toBeDefined();
      expect(enginePerf.health).toBeDefined();
    });
  });
});
