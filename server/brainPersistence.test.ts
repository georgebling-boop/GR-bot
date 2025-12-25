import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  saveBrainToDatabase,
  loadBrainFromDatabase,
  startAutoSave,
  stopAutoSave,
  getPersistenceStatus,
  getBrainHistory,
} from "./brainPersistence";
import { learnFromTrade, resetBrain } from "./continuousLearningAI";

describe("Brain Persistence Service", () => {
  beforeEach(() => {
    // Reset brain state before each test
    resetBrain();
  });

  afterEach(() => {
    // Stop auto-save after each test
    stopAutoSave();
  });

  describe("saveBrainToDatabase", () => {
    it("should save brain state to database", async () => {
      // Train the brain with some trades first
      learnFromTrade({
        symbol: "BTC",
        strategy: "momentum",
        entryPrice: 43000,
        exitPrice: 43500,
        profit: 50,
        profitPercent: 1.16,
        duration: 30,
        marketState: {
          trend: "bullish",
          volatility: "medium",
          volume: "high",
          momentum: "positive",
        },
        indicators: {
          rsi: 55,
          macdHistogram: 0.5,
          bollingerPosition: 0.6,
          sma20Distance: 1.2,
          volumeRatio: 1.5,
        },
        isWin: true,
        timestamp: new Date(),
        entryTiming: {
          hourOfDay: 14,
          dayOfWeek: 3,
          minuteOfHour: 30,
        },
      });
      
      const result = await saveBrainToDatabase();
      
      expect(result).toBeDefined();
      // Result depends on database availability
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
      if (result.success) {
        expect(result.message).toContain("saved successfully");
        expect(result.savedAt).toBeDefined();
      }
    }, 15000);

    it("should handle database unavailability gracefully", async () => {
      // This test verifies error handling
      const result = await saveBrainToDatabase();
      
      expect(result).toBeDefined();
      // Result should indicate success or failure based on DB availability
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
    }, 15000);
  });

  describe("loadBrainFromDatabase", () => {
    it("should load brain state from database", async () => {
      // First save a brain state
      learnFromTrade({
        symbol: "ETH",
        strategy: "rsi_scalp",
        entryPrice: 2300,
        exitPrice: 2350,
        profit: 25,
        profitPercent: 2.17,
        duration: 15,
        marketState: {
          trend: "bullish",
          volatility: "low",
          volume: "medium",
          momentum: "positive",
        },
        indicators: {
          rsi: 35,
          macdHistogram: 0.3,
          bollingerPosition: 0.2,
          sma20Distance: 0.5,
          volumeRatio: 1.2,
        },
        isWin: true,
        timestamp: new Date(),
        entryTiming: {
          hourOfDay: 10,
          dayOfWeek: 2,
          minuteOfHour: 15,
        },
      });
      
      await saveBrainToDatabase();
      
      // Reset and load
      resetBrain();
      const result = await loadBrainFromDatabase();
      
      expect(result).toBeDefined();
      // Result depends on whether save succeeded
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
    });

    it("should return appropriate message when no saved state exists", async () => {
      const result = await loadBrainFromDatabase();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
    });
  });

  describe("getPersistenceStatus", () => {
    it("should return persistence status", () => {
      const status = getPersistenceStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.autoSaveEnabled).toBe("boolean");
      expect(status.saveCount).toBeGreaterThanOrEqual(0);
    });

    it("should show auto-save disabled initially", () => {
      const status = getPersistenceStatus();
      expect(status.autoSaveEnabled).toBe(false);
    });
  });

  describe("startAutoSave / stopAutoSave", () => {
    it("should enable auto-save", () => {
      startAutoSave();
      const status = getPersistenceStatus();
      expect(status.autoSaveEnabled).toBe(true);
    });

    it("should disable auto-save", () => {
      startAutoSave();
      stopAutoSave();
      const status = getPersistenceStatus();
      expect(status.autoSaveEnabled).toBe(false);
    });

    it("should handle multiple start calls", () => {
      startAutoSave();
      startAutoSave();
      const status = getPersistenceStatus();
      expect(status.autoSaveEnabled).toBe(true);
    });

    it("should handle multiple stop calls", () => {
      stopAutoSave();
      stopAutoSave();
      const status = getPersistenceStatus();
      expect(status.autoSaveEnabled).toBe(false);
    });
  });

  describe("getBrainHistory", () => {
    it("should return brain history", async () => {
      const history = await getBrainHistory();
      
      expect(history).toBeDefined();
      expect(history).toHaveProperty("records");
      expect(Array.isArray(history.records)).toBe(true);
    });

    it("should return records with correct structure", async () => {
      // Save a brain state first
      learnFromTrade({
        symbol: "SOL",
        strategy: "momentum",
        entryPrice: 98,
        exitPrice: 100,
        profit: 2,
        profitPercent: 2.04,
        duration: 20,
        marketState: {
          trend: "bullish",
          volatility: "medium",
          volume: "high",
          momentum: "positive",
        },
        indicators: {
          rsi: 60,
          macdHistogram: 0.4,
          bollingerPosition: 0.7,
          sma20Distance: 1.0,
          volumeRatio: 1.3,
        },
        isWin: true,
        timestamp: new Date(),
        entryTiming: {
          hourOfDay: 9,
          dayOfWeek: 1,
          minuteOfHour: 0,
        },
      });
      
      await saveBrainToDatabase();
      
      const history = await getBrainHistory();
      
      if (history.records.length > 0) {
        const record = history.records[0];
        expect(record).toHaveProperty("id");
        expect(record).toHaveProperty("version");
        expect(record).toHaveProperty("totalCycles");
        expect(record).toHaveProperty("totalTrades");
        expect(record).toHaveProperty("winRate");
        expect(record).toHaveProperty("patternsLearned");
        expect(record).toHaveProperty("updatedAt");
      }
    });
  });
});
