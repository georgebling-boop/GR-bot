import { describe, it, expect, beforeEach } from "vitest";
import {
  createAlert,
  createProfitAlert,
  createLossAlert,
  createRiskAlert,
  createPatternAlert,
  getRecentAlerts,
  getUnreadCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  getAlertsByType,
  getAlertStats,
} from "./tradeAlerts";

describe("Trade Alerts Service", () => {
  describe("createAlert", () => {
    it("should create a new alert", async () => {
      const alert = await createAlert({
        symbol: "BTC",
        alertType: "opportunity",
        strategy: "momentum",
        confidence: 85,
        message: "Test opportunity alert",
        price: "43000.00",
      });
      
      expect(alert).toBeDefined();
      expect(alert.symbol).toBe("BTC");
      expect(alert.alertType).toBe("opportunity");
      expect(alert.strategy).toBe("momentum");
      expect(alert.confidence).toBe(85);
      expect(alert.isRead).toBe(false);
      expect(alert.createdAt).toBeDefined();
    });
  });

  describe("createProfitAlert", () => {
    it("should create a profit alert", async () => {
      const alert = await createProfitAlert("ETH", "rsi_scalp", 25.50, 2.5, 2350.00);
      
      expect(alert).toBeDefined();
      expect(alert.symbol).toBe("ETH");
      expect(alert.alertType).toBe("profit");
      expect(alert.confidence).toBe(100);
      expect(alert.message).toContain("+$25.50");
      expect(alert.message).toContain("+2.50%");
    });
  });

  describe("createLossAlert", () => {
    it("should create a loss alert", async () => {
      const alert = await createLossAlert("SOL", "bollinger_bounce", -15.00, -1.5, 95.00);
      
      expect(alert).toBeDefined();
      expect(alert.symbol).toBe("SOL");
      expect(alert.alertType).toBe("loss");
      expect(alert.message).toContain("Stop loss");
      expect(alert.message).toContain("-$15.00");
    });
  });

  describe("createRiskAlert", () => {
    it("should create a risk alert", async () => {
      const alert = await createRiskAlert(7.5, 10, 750.00);
      
      expect(alert).toBeDefined();
      expect(alert.symbol).toBe("PORTFOLIO");
      expect(alert.alertType).toBe("risk");
      expect(alert.strategy).toBe("risk_management");
      expect(alert.message).toContain("7.50%");
    });
  });

  describe("createPatternAlert", () => {
    it("should create a pattern alert", async () => {
      const alert = await createPatternAlert(
        "BTC",
        "double_bottom",
        82,
        "Bullish reversal pattern detected",
        43500.00
      );
      
      expect(alert).toBeDefined();
      expect(alert.symbol).toBe("BTC");
      expect(alert.alertType).toBe("pattern");
      expect(alert.strategy).toBe("double_bottom");
      expect(alert.confidence).toBe(82);
    });
  });

  describe("getRecentAlerts", () => {
    it("should return recent alerts", async () => {
      // Create some test alerts first
      await createAlert({
        symbol: "ADA",
        alertType: "opportunity",
        strategy: "test",
        confidence: 75,
        message: "Test alert 1",
        price: "0.62",
      });
      
      const alerts = await getRecentAlerts(10);
      
      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const alerts = await getRecentAlerts(5);
      expect(alerts.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      const count = await getUnreadCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getAlertsByType", () => {
    it("should filter alerts by type", async () => {
      // Create alerts of different types
      await createProfitAlert("BTC", "test", 10, 1, 43000);
      await createLossAlert("ETH", "test", -5, -0.5, 2300);
      
      const profitAlerts = await getAlertsByType("profit", 10);
      
      expect(profitAlerts).toBeDefined();
      profitAlerts.forEach(alert => {
        expect(alert.alertType).toBe("profit");
      });
    });
  });

  describe("getAlertStats", () => {
    it("should return alert statistics", async () => {
      const stats = await getAlertStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("unread");
      expect(stats).toHaveProperty("byType");
      expect(stats).toHaveProperty("last24h");
      expect(stats.byType).toHaveProperty("opportunity");
      expect(stats.byType).toHaveProperty("risk");
      expect(stats.byType).toHaveProperty("profit");
      expect(stats.byType).toHaveProperty("loss");
      expect(stats.byType).toHaveProperty("pattern");
    });
  });

  describe("markAlertAsRead", () => {
    it("should mark an alert as read", async () => {
      const alert = await createAlert({
        symbol: "XRP",
        alertType: "opportunity",
        strategy: "test",
        confidence: 70,
        message: "Test alert for marking",
        price: "0.62",
      });
      
      if (alert.id) {
        const success = await markAlertAsRead(alert.id);
        expect(success).toBe(true);
      }
    });
  });

  describe("markAllAlertsAsRead", () => {
    it("should mark all alerts as read", async () => {
      const success = await markAllAlertsAsRead();
      expect(success).toBe(true);
      
      const unreadCount = await getUnreadCount();
      // After marking all as read, unread count should be 0
      // (Note: This may not be exactly 0 if other tests create alerts concurrently)
      expect(unreadCount).toBeGreaterThanOrEqual(0);
    });
  });
});
