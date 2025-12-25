import { describe, it, expect, beforeEach } from "vitest";
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
  getPerformanceAnalytics,
  getHealthAlerts,
} from "./advancedTradingEngine";

describe("Advanced Trading Engine", () => {
  beforeEach(() => {
    resetSession();
  });

  describe("Session Management", () => {
    it("should initialize session with $800", () => {
      const session = initializeSession(800);
      expect(session.equity).toBe(800);
      expect(session.startingEquity).toBe(800);
      expect(session.targetWinRate).toBe(90);
      expect(session.isActive).toBe(false);
    });

    it("should start trading", () => {
      initializeSession(800);
      const session = startTrading();
      expect(session?.isActive).toBe(true);
      expect(session?.autoTradingEnabled).toBe(true);
    });

    it("should stop trading", () => {
      initializeSession(800);
      startTrading();
      const session = stopTrading();
      expect(session?.isActive).toBe(false);
      expect(session?.autoTradingEnabled).toBe(false);
    });

    it("should record winning trade", () => {
      initializeSession(800);
      const session = recordTrade(10, true);
      expect(session?.totalTrades).toBe(1);
      expect(session?.winningTrades).toBe(1);
      expect(session?.equity).toBe(810);
      expect(session?.winRate).toBe(100);
    });

    it("should record losing trade", () => {
      initializeSession(800);
      const session = recordTrade(-5, false);
      expect(session?.totalTrades).toBe(1);
      expect(session?.losingTrades).toBe(1);
      expect(session?.equity).toBe(795);
      expect(session?.winRate).toBe(0);
    });

    it("should calculate win rate correctly", () => {
      initializeSession(800);
      recordTrade(10, true);
      recordTrade(10, true);
      recordTrade(10, true);
      recordTrade(-5, false);
      const session = getSession();
      expect(session?.winRate).toBe(75);
    });
  });

  describe("Bot Health", () => {
    it("should return bot health status", () => {
      initializeSession(800);
      const health = getBotHealth();
      expect(health.status).toBeDefined();
      expect(["healthy", "warning", "critical"]).toContain(health.status);
      expect(health.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(health.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(health.connectionStatus).toBe("connected");
    });
  });

  describe("Weekly Target", () => {
    it("should return weekly target with $1000 goal", () => {
      initializeSession(800);
      const target = getWeeklyTarget();
      expect(target.targetProfit).toBe(1000);
      expect(target.daysRemaining).toBeGreaterThanOrEqual(0);
      expect(target.daysRemaining).toBeLessThanOrEqual(7);
    });

    it("should track progress toward target", () => {
      initializeSession(800);
      recordTrade(50, true);
      const target = getWeeklyTarget();
      expect(target.currentProfit).toBe(50);
      expect(target.progressPercent).toBe(5); // 50/1000 = 5%
    });
  });

  describe("Risk Management", () => {
    it("should return risk parameters", () => {
      initializeSession(800);
      const risk = getRiskManagement();
      expect(risk.maxDrawdownPercent).toBe(10);
      expect(risk.maxPositionSize).toBe(40); // 5% of 800
      expect(risk.maxOpenTrades).toBe(3);
      expect(risk.isWithinLimits).toBe(true);
    });

    it("should detect when within limits", () => {
      initializeSession(800);
      const risk = getRiskManagement();
      expect(risk.isWithinLimits).toBe(true);
      expect(risk.riskScore).toBeLessThanOrEqual(5);
    });
  });

  describe("Smart Entry Analysis", () => {
    it("should analyze entry for a symbol", () => {
      const priceHistory = [100, 101, 102, 101, 100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90];
      const entry = analyzeSmartEntry("BTC/USDT", 90, priceHistory);
      
      expect(entry.symbol).toBe("BTC/USDT");
      expect(entry.confidence).toBeGreaterThan(0);
      expect(entry.confidence).toBeLessThanOrEqual(95);
      expect(entry.reasons.length).toBeGreaterThan(0);
      expect(entry.indicators.rsi).toBeDefined();
    });

    it("should detect oversold conditions", () => {
      // Declining prices should trigger oversold
      const priceHistory = Array.from({ length: 20 }, (_, i) => 100 - i * 2);
      const entry = analyzeSmartEntry("ETH/USDT", 60, priceHistory);
      
      expect(entry.indicators.rsi).toBeLessThan(50);
    });
  });

  describe("Performance Analytics", () => {
    it("should return performance analytics", () => {
      initializeSession(800);
      recordTrade(10, true);
      recordTrade(5, true);
      
      const analytics = getPerformanceAnalytics();
      expect(analytics.hourlyProfit).toHaveLength(24);
      expect(analytics.dailyProfit).toHaveLength(7);
      expect(analytics.profitFactor).toBeGreaterThan(0);
    });
  });

  describe("Health Alerts", () => {
    it("should create alerts on session init", () => {
      initializeSession(800);
      const alerts = getHealthAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe("info");
    });

    it("should create alert when trading starts", () => {
      initializeSession(800);
      startTrading();
      const alerts = getHealthAlerts();
      expect(alerts.some(a => a.message.includes("started"))).toBe(true);
    });
  });
});
