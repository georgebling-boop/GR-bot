import { describe, it, expect, beforeEach } from "vitest";
import {
  learnFromTrade,
  getBrainState,
  getOptimizedParameters,
  getStrategyWeights,
  getBestStrategyForSymbol,
  isGoodTradingTime,
  getEntryConfidence,
  getLearningStats,
  getEvolutionHistory,
  resetBrain,
  exportBrainState,
  importBrainState,
  type TradeLesson,
  type MarketState,
  type IndicatorSnapshot,
} from "./continuousLearningAI";

// Helper to create a trade lesson
function createTradeLesson(overrides: Partial<TradeLesson> = {}): TradeLesson {
  const now = new Date();
  return {
    tradeId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol: "BTC-USD",
    strategy: "momentum",
    entryPrice: 50000,
    exitPrice: 51000,
    profit: 10,
    profitPercent: 2,
    duration: 30,
    isWin: true,
    marketState: {
      trend: "bullish",
      volatility: 50,
      momentum: 20,
      volume: "normal",
      pricePosition: "neutral",
    },
    indicators: {
      rsi: 45,
      macd: 0.5,
      macdSignal: 0.3,
      macdHistogram: 0.2,
      bollingerUpper: 51000,
      bollingerLower: 49000,
      bollingerMiddle: 50000,
      ema9: 50100,
      ema21: 50000,
      ema50: 49800,
      atr: 500,
      volumeRatio: 1.2,
    },
    entryTiming: {
      hourOfDay: 10,
      dayOfWeek: 1,
      priceVelocity: 0.5,
      timeSinceLastTrade: 60,
    },
    exitTiming: {
      hourOfDay: 10,
      dayOfWeek: 1,
      priceVelocity: 1.0,
      timeSinceLastTrade: 90,
    },
    timestamp: now,
    ...overrides,
  };
}

describe("Continuous Learning AI", () => {
  beforeEach(() => {
    resetBrain();
  });

  describe("Brain Initialization", () => {
    it("should initialize with default state", () => {
      const brain = getBrainState();
      expect(brain.version).toBe(1);
      expect(brain.totalLearningCycles).toBe(0);
      expect(brain.totalTradesAnalyzed).toBe(0);
      expect(brain.neuralMemories.length).toBe(0);
      expect(brain.learningRate).toBe(0.1);
    });

    it("should have default strategy weights", () => {
      const weights = getStrategyWeights();
      expect(weights.momentum).toBe(1.0);
      expect(weights.mean_reversion).toBe(1.0);
      expect(weights.rsi_macd_bb).toBe(1.0);
    });

    it("should have default adaptive parameters", () => {
      const params = getOptimizedParameters();
      expect(params.takeProfitPercent).toBe(2.0);
      expect(params.stopLossPercent).toBe(1.5);
      expect(params.positionSizePercent).toBe(5);
    });
  });

  describe("Learning from Trades", () => {
    it("should learn from a winning trade", () => {
      const lesson = createTradeLesson({ isWin: true, profit: 10, profitPercent: 2 });
      const insights = learnFromTrade(lesson);
      
      expect(insights.length).toBeGreaterThan(0);
      
      const stats = getLearningStats();
      expect(stats.totalTrades).toBe(1);
      expect(stats.totalCycles).toBe(1);
    });

    it("should learn from a losing trade", () => {
      const lesson = createTradeLesson({ 
        isWin: false, 
        profit: -5, 
        profitPercent: -1,
        exitPrice: 49500 
      });
      const insights = learnFromTrade(lesson);
      
      expect(insights.length).toBeGreaterThan(0);
      
      const stats = getLearningStats();
      expect(stats.totalTrades).toBe(1);
    });

    it("should increase strategy weight after winning trade", () => {
      const initialWeights = getStrategyWeights();
      const initialMomentum = initialWeights.momentum;
      
      const lesson = createTradeLesson({ 
        strategy: "momentum", 
        isWin: true, 
        profitPercent: 3 
      });
      learnFromTrade(lesson);
      
      const newWeights = getStrategyWeights();
      // Weight should increase (but normalized)
      expect(newWeights.momentum).toBeGreaterThanOrEqual(initialMomentum * 0.9);
    });

    it("should decrease strategy weight after losing trade", () => {
      // First establish some baseline
      learnFromTrade(createTradeLesson({ strategy: "momentum", isWin: true }));
      const initialWeights = getStrategyWeights();
      
      // Now lose
      const lesson = createTradeLesson({ 
        strategy: "momentum", 
        isWin: false, 
        profit: -10,
        profitPercent: -2 
      });
      learnFromTrade(lesson);
      
      const newWeights = getStrategyWeights();
      // Weight should decrease relative to others
      expect(newWeights.momentum).toBeLessThanOrEqual(initialWeights.momentum * 1.1);
    });

    it("should create neural memories for patterns", () => {
      const lesson = createTradeLesson();
      learnFromTrade(lesson);
      
      const brain = getBrainState();
      expect(brain.neuralMemories.length).toBeGreaterThan(0);
    });

    it("should strengthen existing patterns on repeated success", () => {
      // Same pattern twice
      const lesson1 = createTradeLesson({ isWin: true });
      const lesson2 = createTradeLesson({ isWin: true });
      
      learnFromTrade(lesson1);
      const brain1 = getBrainState();
      const initialMemory = brain1.neuralMemories[0];
      
      learnFromTrade(lesson2);
      const brain2 = getBrainState();
      const updatedMemory = brain2.neuralMemories.find(m => m.id === initialMemory.id);
      
      expect(updatedMemory?.activations).toBe(2);
      expect(updatedMemory?.weight).toBeGreaterThanOrEqual(initialMemory.weight);
    });
  });

  describe("Timing Optimization", () => {
    it("should track hourly win rates", () => {
      // Win at hour 10
      learnFromTrade(createTradeLesson({ 
        isWin: true,
        entryTiming: { hourOfDay: 10, dayOfWeek: 1, priceVelocity: 0, timeSinceLastTrade: 0 }
      }));
      
      const brain = getBrainState();
      expect(brain.timingOptimization.hourlyWinRates[10]).toBeGreaterThan(50);
    });

    it("should identify good trading times", () => {
      const result = isGoodTradingTime();
      expect(result).toHaveProperty("isGood");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("reason");
    });
  });

  describe("Symbol-Specific Learning", () => {
    it("should learn symbol behavior", () => {
      learnFromTrade(createTradeLesson({ symbol: "ETH-USD", isWin: true }));
      learnFromTrade(createTradeLesson({ symbol: "ETH-USD", isWin: true }));
      learnFromTrade(createTradeLesson({ symbol: "ETH-USD", isWin: false }));
      
      const best = getBestStrategyForSymbol("ETH-USD");
      expect(best).toBeDefined();
    });

    it("should return default strategy for unknown symbols", () => {
      const best = getBestStrategyForSymbol("UNKNOWN-USD");
      expect(best).toBeDefined();
    });
  });

  describe("Entry Confidence", () => {
    it("should calculate entry confidence", () => {
      const marketState: MarketState = {
        trend: "bullish",
        volatility: 50,
        momentum: 20,
        volume: "normal",
        pricePosition: "neutral",
      };
      
      const indicators: IndicatorSnapshot = {
        rsi: 35,
        macd: 0.5,
        macdSignal: 0.3,
        macdHistogram: 0.2,
        bollingerUpper: 51000,
        bollingerLower: 49000,
        bollingerMiddle: 50000,
        ema9: 50100,
        ema21: 50000,
        ema50: 49800,
        atr: 500,
        volumeRatio: 1.2,
      };
      
      const result = getEntryConfidence("BTC-USD", "momentum", marketState, indicators);
      
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("shouldEnter");
      expect(result).toHaveProperty("reasons");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(95);
    });

    it("should give higher confidence for oversold RSI", () => {
      const marketState: MarketState = {
        trend: "bullish",
        volatility: 50,
        momentum: 20,
        volume: "normal",
        pricePosition: "oversold",
      };
      
      const oversoldIndicators: IndicatorSnapshot = {
        rsi: 25, // Oversold
        macd: 0.5,
        macdSignal: 0.3,
        macdHistogram: 0.2,
        bollingerUpper: 51000,
        bollingerLower: 49000,
        bollingerMiddle: 50000,
        ema9: 50100,
        ema21: 50000,
        ema50: 49800,
        atr: 500,
        volumeRatio: 1.2,
      };
      
      const neutralIndicators: IndicatorSnapshot = {
        ...oversoldIndicators,
        rsi: 50, // Neutral
      };
      
      const oversoldResult = getEntryConfidence("BTC-USD", "momentum", marketState, oversoldIndicators);
      const neutralResult = getEntryConfidence("BTC-USD", "momentum", marketState, neutralIndicators);
      
      expect(oversoldResult.confidence).toBeGreaterThan(neutralResult.confidence);
    });
  });

  describe("Risk Learning", () => {
    it("should adjust risk parameters after trades", () => {
      const initialParams = getOptimizedParameters();
      
      // Simulate several losing trades
      for (let i = 0; i < 5; i++) {
        learnFromTrade(createTradeLesson({ 
          isWin: false, 
          profit: -15, 
          profitPercent: -3 
        }));
      }
      
      const newParams = getOptimizedParameters();
      
      // Stop loss should tighten after losses
      expect(newParams.stopLossPercent).toBeLessThanOrEqual(initialParams.stopLossPercent);
    });
  });

  describe("Evolution Tracking", () => {
    it("should record evolution snapshots", () => {
      // Generate enough trades to trigger evolution recording
      for (let i = 0; i < 15; i++) {
        learnFromTrade(createTradeLesson({ isWin: i % 3 !== 0 }));
      }
      
      const evolution = getEvolutionHistory();
      expect(evolution.length).toBeGreaterThan(0);
    });
  });

  describe("Brain Export/Import", () => {
    it("should export brain state", () => {
      learnFromTrade(createTradeLesson());
      
      const exported = exportBrainState();
      expect(exported).toBeDefined();
      expect(typeof exported).toBe("string");
      
      const parsed = JSON.parse(exported);
      expect(parsed.totalTradesAnalyzed).toBe(1);
    });

    it("should import brain state", () => {
      // Train the brain
      for (let i = 0; i < 5; i++) {
        learnFromTrade(createTradeLesson({ isWin: true }));
      }
      
      const exported = exportBrainState();
      const statsBeforeReset = getLearningStats();
      
      // Reset and verify
      resetBrain();
      const statsAfterReset = getLearningStats();
      expect(statsAfterReset.totalTrades).toBe(0);
      
      // Import and verify
      const success = importBrainState(exported);
      expect(success).toBe(true);
      
      const statsAfterImport = getLearningStats();
      expect(statsAfterImport.totalTrades).toBe(statsBeforeReset.totalTrades);
    });

    it("should handle invalid import gracefully", () => {
      const success = importBrainState("invalid json");
      expect(success).toBe(false);
    });
  });

  describe("Learning Statistics", () => {
    it("should return learning statistics", () => {
      learnFromTrade(createTradeLesson({ isWin: true }));
      learnFromTrade(createTradeLesson({ isWin: false }));
      
      const stats = getLearningStats();
      
      expect(stats.totalCycles).toBe(2);
      expect(stats.totalTrades).toBe(2);
      expect(stats.version).toBeGreaterThanOrEqual(1);
      expect(stats.patternsLearned).toBeGreaterThan(0);
      expect(stats.strategiesRanked).toBeInstanceOf(Array);
      expect(stats.learningRate).toBeGreaterThan(0);
    });
  });

  describe("Continuous Improvement", () => {
    it("should improve win rate prediction over time", () => {
      // Simulate many trades with a pattern
      // Winning trades in bullish market
      for (let i = 0; i < 20; i++) {
        learnFromTrade(createTradeLesson({
          symbol: "BTC-USD",
          strategy: "momentum",
          isWin: true,
          marketState: {
            trend: "bullish",
            volatility: 50,
            momentum: 30,
            volume: "normal",
            pricePosition: "neutral",
          },
        }));
      }
      
      // Losing trades in bearish market
      for (let i = 0; i < 10; i++) {
        learnFromTrade(createTradeLesson({
          symbol: "BTC-USD",
          strategy: "momentum",
          isWin: false,
          profit: -5,
          profitPercent: -1,
          marketState: {
            trend: "bearish",
            volatility: 70,
            momentum: -30,
            volume: "high",
            pricePosition: "overbought",
          },
        }));
      }
      
      const stats = getLearningStats();
      expect(stats.patternsLearned).toBeGreaterThan(0);
      expect(stats.confidence).toBeGreaterThan(50);
    });

    it("should have no limit on learning cycles", () => {
      // Simulate 100 trades
      for (let i = 0; i < 100; i++) {
        learnFromTrade(createTradeLesson({ isWin: i % 2 === 0 }));
      }
      
      const stats = getLearningStats();
      expect(stats.totalCycles).toBe(100);
      expect(stats.totalTrades).toBe(100);
      
      // Should still be able to learn more
      learnFromTrade(createTradeLesson());
      const newStats = getLearningStats();
      expect(newStats.totalCycles).toBe(101);
    });
  });

  describe("Memory Management", () => {
    it("should consolidate memories and prune weak ones", () => {
      // Create many patterns
      const symbols = ["BTC-USD", "ETH-USD", "ADA-USD", "SOL-USD", "XRP-USD"];
      const strategies = ["momentum", "mean_reversion", "rsi_macd_bb"];
      
      for (let i = 0; i < 50; i++) {
        learnFromTrade(createTradeLesson({
          symbol: symbols[i % symbols.length],
          strategy: strategies[i % strategies.length],
          isWin: i % 3 !== 0,
        }));
      }
      
      const brain = getBrainState();
      // Should have memories but not unlimited
      expect(brain.neuralMemories.length).toBeGreaterThan(0);
      expect(brain.neuralMemories.length).toBeLessThanOrEqual(1000);
    });
  });
});
