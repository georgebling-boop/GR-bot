import { describe, it, expect, beforeEach } from "vitest";
import {
  initializeHyperliquid,
  getConnectionStatus,
  disconnect,
} from "./hyperliquid";

describe("Hyperliquid Integration", () => {
  beforeEach(() => {
    // Disconnect before each test to ensure clean state
    disconnect();
  });

  describe("Connection Management", () => {
    it("should start disconnected", () => {
      const status = getConnectionStatus();
      expect(status.connected).toBe(false);
      expect(status.wallet).toBeNull();
    });

    it("should fail to connect with invalid private key", () => {
      const result = initializeHyperliquid({
        privateKey: "invalid-key",
        useMainnet: false,
      });
      expect(result).toBe(false);
      
      const status = getConnectionStatus();
      expect(status.connected).toBe(false);
    });

    it("should connect with valid private key format", () => {
      // Use a test private key (32 bytes hex)
      const testPrivateKey = "0x" + "a".repeat(64);
      const result = initializeHyperliquid({
        privateKey: testPrivateKey,
        useMainnet: false,
      });
      expect(result).toBe(true);
      
      const status = getConnectionStatus();
      expect(status.connected).toBe(true);
      expect(status.network).toBe("testnet");
      expect(status.wallet).toBeTruthy();
    });

    it("should disconnect properly", () => {
      const testPrivateKey = "0x" + "b".repeat(64);
      initializeHyperliquid({
        privateKey: testPrivateKey,
        useMainnet: false,
      });
      
      disconnect();
      
      const status = getConnectionStatus();
      expect(status.connected).toBe(false);
      expect(status.wallet).toBeNull();
    });

    it("should support mainnet connection", () => {
      const testPrivateKey = "0x" + "c".repeat(64);
      const result = initializeHyperliquid({
        privateKey: testPrivateKey,
        useMainnet: true,
      });
      expect(result).toBe(true);
      
      const status = getConnectionStatus();
      expect(status.network).toBe("mainnet");
    });
  });

  describe("Status Reporting", () => {
    it("should report correct connection status", () => {
      const status = getConnectionStatus();
      expect(status).toHaveProperty("connected");
      expect(status).toHaveProperty("network");
      expect(status).toHaveProperty("wallet");
      expect(typeof status.connected).toBe("boolean");
    });
  });
});

describe("Hyperliquid Trading Engine", () => {
  it("should export trading engine functions", async () => {
    const engine = await import("./hyperliquidTradingEngine");
    
    expect(typeof engine.initializeTradingEngine).toBe("function");
    expect(typeof engine.startTrading).toBe("function");
    expect(typeof engine.stopTrading).toBe("function");
    expect(typeof engine.getTradingStatus).toBe("function");
    expect(typeof engine.getActiveTrades).toBe("function");
    expect(typeof engine.getTradeHistory).toBe("function");
    expect(typeof engine.updateConfig).toBe("function");
    expect(typeof engine.getTradingStats).toBe("function");
  });

  it("should return correct initial trading status", async () => {
    const { getTradingStatus } = await import("./hyperliquidTradingEngine");
    
    const status = getTradingStatus();
    expect(status).toHaveProperty("isRunning");
    expect(status).toHaveProperty("connected");
    expect(status).toHaveProperty("activeTrades");
    expect(status).toHaveProperty("totalTrades");
    expect(status).toHaveProperty("config");
    expect(status.isRunning).toBe(false);
  });

  it("should return empty active trades initially", async () => {
    const { getActiveTrades } = await import("./hyperliquidTradingEngine");
    
    const trades = getActiveTrades();
    expect(Array.isArray(trades)).toBe(true);
    expect(trades.length).toBe(0);
  });

  it("should return correct trading stats", async () => {
    const { getTradingStats } = await import("./hyperliquidTradingEngine");
    
    const stats = getTradingStats();
    expect(stats).toHaveProperty("totalTrades");
    expect(stats).toHaveProperty("winningTrades");
    expect(stats).toHaveProperty("losingTrades");
    expect(stats).toHaveProperty("winRate");
    expect(stats).toHaveProperty("totalPnl");
    expect(stats).toHaveProperty("avgPnlPercent");
    expect(stats).toHaveProperty("bestTrade");
    expect(stats).toHaveProperty("worstTrade");
  });

  it("should allow config updates", async () => {
    const { updateConfig, getTradingStatus } = await import("./hyperliquidTradingEngine");
    
    updateConfig({ maxPositions: 10 });
    
    const status = getTradingStatus();
    expect(status.config.maxPositions).toBe(10);
  });
});
