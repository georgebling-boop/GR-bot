import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  learnFromTrade,
  getBrainState,
  getOptimizedParameters,
  setConfidenceThreshold,
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
  type TimingPattern,
} from "../continuousLearningAI";

// Input schemas
const marketStateSchema = z.object({
  trend: z.enum(["bullish", "bearish", "sideways"]),
  volatility: z.number(),
  momentum: z.number(),
  volume: z.enum(["low", "normal", "high"]),
  pricePosition: z.enum(["oversold", "neutral", "overbought"]),
});

const indicatorSnapshotSchema = z.object({
  rsi: z.number(),
  macd: z.number(),
  macdSignal: z.number(),
  macdHistogram: z.number(),
  bollingerUpper: z.number(),
  bollingerLower: z.number(),
  bollingerMiddle: z.number(),
  ema9: z.number(),
  ema21: z.number(),
  ema50: z.number(),
  atr: z.number(),
  volumeRatio: z.number(),
});

const timingPatternSchema = z.object({
  hourOfDay: z.number(),
  dayOfWeek: z.number(),
  priceVelocity: z.number(),
  timeSinceLastTrade: z.number(),
});

const tradeLessonSchema = z.object({
  tradeId: z.string(),
  symbol: z.string(),
  strategy: z.string(),
  entryPrice: z.number(),
  exitPrice: z.number(),
  profit: z.number(),
  profitPercent: z.number(),
  duration: z.number(),
  isWin: z.boolean(),
  marketState: marketStateSchema,
  indicators: indicatorSnapshotSchema,
  entryTiming: timingPatternSchema,
  exitTiming: timingPatternSchema,
  timestamp: z.string().transform((s) => new Date(s)),
});

export const continuousLearningRouter = router({
  /**
   * Learn from a completed trade - THE CORE LEARNING ENDPOINT
   * Called immediately after every trade closes
   */
  learnFromTrade: publicProcedure
    .input(tradeLessonSchema)
    .mutation(({ input }) => {
      const lesson: TradeLesson = {
        ...input,
        timestamp: input.timestamp,
      };
      const insights = learnFromTrade(lesson);
      return {
        success: true,
        insights,
        stats: getLearningStats(),
      };
    }),

  /**
   * Quick learn - simplified version for rapid learning
   * Automatically generates market state and indicators from available data
   */
  quickLearn: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        strategy: z.string(),
        entryPrice: z.number(),
        exitPrice: z.number(),
        profit: z.number(),
        profitPercent: z.number(),
        duration: z.number(),
        rsi: z.number().optional(),
        macd: z.number().optional(),
        trend: z.enum(["bullish", "bearish", "sideways"]).optional(),
        volatility: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const now = new Date();
      
      // Generate full lesson from simplified input
      const lesson: TradeLesson = {
        tradeId: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol: input.symbol,
        strategy: input.strategy,
        entryPrice: input.entryPrice,
        exitPrice: input.exitPrice,
        profit: input.profit,
        profitPercent: input.profitPercent,
        duration: input.duration,
        isWin: input.profit > 0,
        marketState: {
          trend: input.trend || "sideways",
          volatility: input.volatility || 50,
          momentum: input.profitPercent > 0 ? 20 : -20,
          volume: "normal",
          pricePosition: input.rsi 
            ? (input.rsi < 30 ? "oversold" : input.rsi > 70 ? "overbought" : "neutral")
            : "neutral",
        },
        indicators: {
          rsi: input.rsi || 50,
          macd: input.macd || 0,
          macdSignal: 0,
          macdHistogram: input.macd || 0,
          bollingerUpper: input.entryPrice * 1.02,
          bollingerLower: input.entryPrice * 0.98,
          bollingerMiddle: input.entryPrice,
          ema9: input.entryPrice,
          ema21: input.entryPrice,
          ema50: input.entryPrice,
          atr: input.entryPrice * 0.01,
          volumeRatio: 1,
        },
        entryTiming: {
          hourOfDay: now.getHours(),
          dayOfWeek: now.getDay(),
          priceVelocity: 0,
          timeSinceLastTrade: 0,
        },
        exitTiming: {
          hourOfDay: now.getHours(),
          dayOfWeek: now.getDay(),
          priceVelocity: input.profitPercent,
          timeSinceLastTrade: input.duration,
        },
        timestamp: now,
      };
      
      const insights = learnFromTrade(lesson);
      return {
        success: true,
        insights,
        stats: getLearningStats(),
      };
    }),

  /**
   * Get the full brain state
   */
  getBrainState: publicProcedure.query(() => {
    const brain = getBrainState();
    return {
      version: brain.version,
      totalLearningCycles: brain.totalLearningCycles,
      totalTradesAnalyzed: brain.totalTradesAnalyzed,
      patternsLearned: brain.neuralMemories.length,
      learningRate: brain.learningRate,
      explorationRate: brain.explorationRate,
      confidenceThreshold: brain.confidenceThreshold,
      lastUpdate: brain.lastUpdate,
      timingOptimization: brain.timingOptimization,
      riskLearning: brain.riskLearning,
      adaptiveParameters: brain.adaptiveParameters,
    };
  }),

  /**
   * Get optimized trading parameters
   */
  getOptimizedParameters: publicProcedure.query(() => {
    return getOptimizedParameters();
  }),

  /**
   * Set confidence threshold manually
   */
  setConfidenceThreshold: publicProcedure
    .input(z.object({ threshold: z.number().min(30).max(90) }))
    .mutation(({ input }) => {
      return setConfidenceThreshold(input.threshold);
    }),

  /**
   * Get strategy weights
   */
  getStrategyWeights: publicProcedure.query(() => {
    return getStrategyWeights();
  }),

  /**
   * Get best strategy for a specific symbol
   */
  getBestStrategy: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(({ input }) => {
      return {
        symbol: input.symbol,
        bestStrategy: getBestStrategyForSymbol(input.symbol),
        weights: getStrategyWeights(),
      };
    }),

  /**
   * Check if current time is good for trading
   */
  checkTradingTime: publicProcedure.query(() => {
    return isGoodTradingTime();
  }),

  /**
   * Get entry confidence for a potential trade
   */
  getEntryConfidence: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        strategy: z.string(),
        marketState: marketStateSchema,
        indicators: indicatorSnapshotSchema,
      })
    )
    .query(({ input }) => {
      return getEntryConfidence(
        input.symbol,
        input.strategy,
        input.marketState as MarketState,
        input.indicators as IndicatorSnapshot
      );
    }),

  /**
   * Get learning statistics
   */
  getStats: publicProcedure.query(() => {
    return getLearningStats();
  }),

  /**
   * Get evolution history
   */
  getEvolution: publicProcedure.query(() => {
    return getEvolutionHistory();
  }),

  /**
   * Reset the brain (for testing)
   */
  reset: publicProcedure.mutation(() => {
    resetBrain();
    return { success: true, message: "Brain reset to initial state" };
  }),

  /**
   * Export brain state for persistence
   */
  exportBrain: publicProcedure.query(() => {
    return {
      state: exportBrainState(),
      exportedAt: new Date(),
    };
  }),

  /**
   * Import brain state from persistence
   */
  importBrain: publicProcedure
    .input(z.object({ state: z.string() }))
    .mutation(({ input }) => {
      const success = importBrainState(input.state);
      return {
        success,
        message: success ? "Brain state imported successfully" : "Failed to import brain state",
        stats: success ? getLearningStats() : null,
      };
    }),
});
