/**
 * Continuous Learning AI Engine
 * Learns from EVERY single trade in real-time with unlimited improvement potential
 * No caps on how fast or intelligent it can become
 * 
 * ENHANCED VERSION - Improvements for higher win rates:
 * - More aggressive pattern reinforcement (15x weight growth vs 10x)
 * - Faster strategy weight adjustments (5x max vs 4x, 0.05 min vs 0.1)
 * - Enhanced pattern matching with multi-factor scoring
 * - Stronger confidence signals from proven patterns
 * - Better risk management with faster adaptation
 * - Increased learning rate (0.35 vs 0.25) for quicker improvements
 * - Lower exploration rate (0.10 vs 0.15) to exploit winning strategies
 * - More sophisticated technical indicator analysis
 * - Ensemble pattern matching with weighted voting
 */

// ============= NEURAL MEMORY TYPES =============
export interface NeuralMemory {
  id: string;
  pattern: TradePattern;
  weight: number;
  activations: number;
  lastActivated: Date;
  successRate: number;
  avgProfit: number;
  confidence: number;
  decayRate: number;
}

export interface TradePattern {
  marketCondition: MarketState;
  indicators: IndicatorSnapshot;
  entryTiming: TimingPattern;
  exitTiming: TimingPattern;
  symbol: string;
  strategy: string;
}

export interface MarketState {
  trend: "bullish" | "bearish" | "sideways";
  volatility: number; // 0-100
  momentum: number; // -100 to 100
  volume: "low" | "normal" | "high";
  pricePosition: "oversold" | "neutral" | "overbought";
}

export interface IndicatorSnapshot {
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerMiddle: number;
  ema9: number;
  ema21: number;
  ema50: number;
  atr: number;
  volumeRatio: number;
}

export interface TimingPattern {
  hourOfDay: number;
  dayOfWeek: number;
  priceVelocity: number;
  timeSinceLastTrade: number;
}

// ============= LEARNING STATE =============
export interface LearningBrain {
  version: number;
  totalLearningCycles: number;
  totalTradesAnalyzed: number;
  neuralMemories: NeuralMemory[];
  strategyWeights: Map<string, number>;
  symbolPerformance: Map<string, SymbolLearning>;
  timingOptimization: TimingLearning;
  riskLearning: RiskLearning;
  adaptiveParameters: AdaptiveParameters;
  learningRate: number;
  explorationRate: number;
  confidenceThreshold: number;
  lastUpdate: Date;
  evolutionHistory: EvolutionSnapshot[];
}

export interface SymbolLearning {
  symbol: string;
  totalTrades: number;
  wins: number;
  losses: number;
  avgWinPercent: number;
  avgLossPercent: number;
  bestStrategy: string;
  bestTimeOfDay: number;
  volatilityPreference: "low" | "medium" | "high";
  momentumPreference: "positive" | "negative" | "neutral";
  confidence: number;
}

export interface TimingLearning {
  hourlyWinRates: number[];
  dailyWinRates: number[];
  bestHours: number[];
  worstHours: number[];
  optimalHoldTime: number;
  avgWinHoldTime: number;
  avgLossHoldTime: number;
}

export interface RiskLearning {
  optimalPositionSize: number;
  optimalStopLoss: number;
  optimalTakeProfit: number;
  maxDrawdownTolerance: number;
  riskRewardRatio: number;
  consecutiveLossLimit: number;
  recoveryStrategy: "aggressive" | "conservative" | "adaptive";
}

export interface AdaptiveParameters {
  takeProfitPercent: number;
  stopLossPercent: number;
  positionSizePercent: number;
  maxOpenTrades: number;
  entryConfidenceThreshold: number;
  exitConfidenceThreshold: number;
  trailingStopPercent: number;
  scalingFactor: number;
}

export interface EvolutionSnapshot {
  timestamp: Date;
  version: number;
  winRate: number;
  avgProfit: number;
  totalTrades: number;
  improvements: string[];
}

// ============= REAL-TIME LEARNING TYPES =============
export interface TradeLesson {
  tradeId: string;
  symbol: string;
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  profitPercent: number;
  duration: number;
  isWin: boolean;
  marketState: MarketState;
  indicators: IndicatorSnapshot;
  entryTiming: TimingPattern;
  exitTiming: TimingPattern;
  timestamp: Date;
}

export interface LearningInsight {
  type: "pattern" | "timing" | "risk" | "strategy" | "optimization";
  priority: "critical" | "high" | "medium" | "low";
  message: string;
  confidence: number;
  actionTaken: string;
  improvement: number;
}

// ============= BRAIN STATE =============
let brain: LearningBrain = initializeBrain();

function initializeBrain(): LearningBrain {
  return {
    version: 1,
    totalLearningCycles: 0,
    totalTradesAnalyzed: 0,
    neuralMemories: [],
    strategyWeights: new Map([
      ["momentum", 1.0],
      ["mean_reversion", 1.0],
      ["volatility_breakout", 1.0],
      ["rsi_scalp", 1.0],
      ["trend_following", 1.0],
      ["rsi_macd_bb", 1.0],
    ]),
    symbolPerformance: new Map(),
    timingOptimization: {
      hourlyWinRates: Array(24).fill(50),
      dailyWinRates: Array(7).fill(50),
      bestHours: [9, 10, 14, 15],
      worstHours: [3, 4, 5],
      optimalHoldTime: 30,
      avgWinHoldTime: 25,
      avgLossHoldTime: 45,
    },
    riskLearning: {
      optimalPositionSize: 5,
      optimalStopLoss: 1.5,
      optimalTakeProfit: 2.0,
      maxDrawdownTolerance: 10,
      riskRewardRatio: 1.5,
      consecutiveLossLimit: 3,
      recoveryStrategy: "adaptive",
    },
    adaptiveParameters: {
      takeProfitPercent: 2.0,
      stopLossPercent: 1.5,
      positionSizePercent: 5,
      maxOpenTrades: 3,
      entryConfidenceThreshold: 65,
      exitConfidenceThreshold: 60,
      trailingStopPercent: 0.5,
      scalingFactor: 1.0,
    },
    learningRate: 0.35, // Increased for FASTER adaptation and quicker learning
    explorationRate: 0.10, // Further reduced to exploit winning patterns more
    confidenceThreshold: 60, // Lowered to take more high-quality opportunities
    lastUpdate: new Date(),
    evolutionHistory: [],
  };
}

// ============= CORE LEARNING ENGINE =============

/**
 * Learn from a completed trade - called IMMEDIATELY after every trade
 * This is the heart of the continuous learning system
 */
export function learnFromTrade(lesson: TradeLesson): LearningInsight[] {
  const insights: LearningInsight[] = [];
  brain.totalLearningCycles++;
  brain.totalTradesAnalyzed++;
  brain.lastUpdate = new Date();
  
  // 1. Pattern Recognition & Memory Formation
  const patternInsight = learnPattern(lesson);
  if (patternInsight) insights.push(patternInsight);
  
  // 2. Strategy Weight Adjustment
  const strategyInsight = adjustStrategyWeight(lesson);
  if (strategyInsight) insights.push(strategyInsight);
  
  // 3. Symbol-Specific Learning
  const symbolInsight = learnSymbolBehavior(lesson);
  if (symbolInsight) insights.push(symbolInsight);
  
  // 4. Timing Optimization
  const timingInsight = optimizeTiming(lesson);
  if (timingInsight) insights.push(timingInsight);
  
  // 5. Risk Parameter Adjustment
  const riskInsight = adjustRiskParameters(lesson);
  if (riskInsight) insights.push(riskInsight);
  
  // 6. Adaptive Parameter Tuning
  const paramInsight = tuneAdaptiveParameters(lesson);
  if (paramInsight) insights.push(paramInsight);
  
  // 7. Neural Memory Consolidation
  consolidateMemories();
  
  // 8. Evolution Tracking
  if (brain.totalLearningCycles % 10 === 0) {
    recordEvolution(insights);
  }
  
  // 9. Increase learning speed based on performance
  adjustLearningRate();
  
  return insights;
}

/**
 * Pattern Recognition - Find and strengthen winning patterns
 */
function learnPattern(lesson: TradeLesson): LearningInsight | null {
  const patternId = generatePatternId(lesson);
  let existingMemory = brain.neuralMemories.find(m => m.id === patternId);
  
  if (existingMemory) {
    // Strengthen existing pattern
    existingMemory.activations++;
    existingMemory.lastActivated = new Date();
    
    // Update success rate with exponential moving average
    const alpha = brain.learningRate;
    const newSuccess = lesson.isWin ? 100 : 0;
    existingMemory.successRate = existingMemory.successRate * (1 - alpha) + newSuccess * alpha;
    existingMemory.avgProfit = existingMemory.avgProfit * (1 - alpha) + lesson.profitPercent * alpha;
    
    // Adjust weight based on performance - MORE AGGRESSIVE REINFORCEMENT
    if (lesson.isWin) {
      // Bigger boost for wins, especially profitable ones
      const profitBoost = 1 + (Math.abs(lesson.profitPercent) / 10);
      existingMemory.weight = Math.min(15, existingMemory.weight * (1.15 * profitBoost));
      existingMemory.confidence = Math.min(99, existingMemory.confidence + 2);
    } else {
      // Faster penalty for losses to avoid bad patterns
      const lossMultiplier = 1 + (Math.abs(lesson.profitPercent) / 20);
      existingMemory.weight = Math.max(0.05, existingMemory.weight * (0.9 / lossMultiplier));
      existingMemory.confidence = Math.max(5, existingMemory.confidence - 3);
    }
    
    return {
      type: "pattern",
      priority: existingMemory.successRate > 80 ? "high" : "medium",
      message: `Pattern "${patternId}" ${lesson.isWin ? "reinforced" : "weakened"}. Success rate: ${existingMemory.successRate.toFixed(1)}%`,
      confidence: existingMemory.confidence,
      actionTaken: lesson.isWin ? "Increased pattern weight" : "Decreased pattern weight",
      improvement: lesson.isWin ? 0.5 : -0.2,
    };
  } else {
    // Create new memory
    const newMemory: NeuralMemory = {
      id: patternId,
      pattern: {
        marketCondition: lesson.marketState,
        indicators: lesson.indicators,
        entryTiming: lesson.entryTiming,
        exitTiming: lesson.exitTiming,
        symbol: lesson.symbol,
        strategy: lesson.strategy,
      },
      weight: lesson.isWin ? 1.2 : 0.8,
      activations: 1,
      lastActivated: new Date(),
      successRate: lesson.isWin ? 100 : 0,
      avgProfit: lesson.profitPercent,
      confidence: 50,
      decayRate: 0.01,
    };
    
    brain.neuralMemories.push(newMemory);
    
    return {
      type: "pattern",
      priority: "medium",
      message: `New pattern discovered: ${patternId}`,
      confidence: 50,
      actionTaken: "Created new neural memory",
      improvement: 0.1,
    };
  }
}

/**
 * Strategy Weight Adjustment - Favor winning strategies
 */
function adjustStrategyWeight(lesson: TradeLesson): LearningInsight | null {
  const currentWeight = brain.strategyWeights.get(lesson.strategy) || 1.0;
  let newWeight: number;
  let adjustment: string;
  
  if (lesson.isWin) {
    // Increase weight for winning strategy - EVEN MORE AGGRESSIVE
    const profitMultiplier = 1 + (lesson.profitPercent / 50); // Bigger boost for larger profits
    const boost = (0.15 + (lesson.profitPercent / 100) * 0.3) * profitMultiplier;
    newWeight = Math.min(5.0, currentWeight + boost); // Increased max weight
    adjustment = `+${(boost * 100).toFixed(1)}%`;
  } else {
    // Decrease weight for losing strategy - MUCH FASTER PENALTY
    const lossMultiplier = 1 + (Math.abs(lesson.profitPercent) / 30);
    const penalty = (0.12 + (Math.abs(lesson.profitPercent) / 100) * 0.15) * lossMultiplier;
    newWeight = Math.max(0.05, currentWeight - penalty); // Lower minimum to really penalize bad strategies
    adjustment = `-${(penalty * 100).toFixed(1)}%`;
  }
  
  brain.strategyWeights.set(lesson.strategy, newWeight);
  
  // Normalize weights
  const totalWeight = Array.from(brain.strategyWeights.values()).reduce((a, b) => a + b, 0);
  brain.strategyWeights.forEach((w, k) => {
    brain.strategyWeights.set(k, (w / totalWeight) * brain.strategyWeights.size);
  });
  
  return {
    type: "strategy",
    priority: Math.abs(newWeight - currentWeight) > 0.1 ? "high" : "low",
    message: `Strategy "${lesson.strategy}" weight adjusted ${adjustment}. New weight: ${newWeight.toFixed(2)}`,
    confidence: 75,
    actionTaken: lesson.isWin ? "Boosted strategy priority" : "Reduced strategy priority",
    improvement: lesson.isWin ? 0.3 : -0.1,
  };
}

/**
 * Symbol-Specific Learning - Learn each crypto's behavior
 */
function learnSymbolBehavior(lesson: TradeLesson): LearningInsight | null {
  let symbolData = brain.symbolPerformance.get(lesson.symbol);
  
  if (!symbolData) {
    symbolData = {
      symbol: lesson.symbol,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      avgWinPercent: 0,
      avgLossPercent: 0,
      bestStrategy: lesson.strategy,
      bestTimeOfDay: lesson.entryTiming.hourOfDay,
      volatilityPreference: "medium",
      momentumPreference: "neutral",
      confidence: 30,
    };
  }
  
  symbolData.totalTrades++;
  
  if (lesson.isWin) {
    symbolData.wins++;
    symbolData.avgWinPercent = (symbolData.avgWinPercent * (symbolData.wins - 1) + lesson.profitPercent) / symbolData.wins;
    
    // Update best strategy if this one performs better
    const strategyWeight = brain.strategyWeights.get(lesson.strategy) || 1.0;
    const bestStrategyWeight = brain.strategyWeights.get(symbolData.bestStrategy) || 1.0;
    if (strategyWeight > bestStrategyWeight) {
      symbolData.bestStrategy = lesson.strategy;
    }
  } else {
    symbolData.losses++;
    symbolData.avgLossPercent = (symbolData.avgLossPercent * (symbolData.losses - 1) + Math.abs(lesson.profitPercent)) / symbolData.losses;
  }
  
  // Update volatility preference based on performance
  if (lesson.marketState.volatility > 70 && lesson.isWin) {
    symbolData.volatilityPreference = "high";
  } else if (lesson.marketState.volatility < 30 && lesson.isWin) {
    symbolData.volatilityPreference = "low";
  }
  
  // Update momentum preference
  if (lesson.marketState.momentum > 30 && lesson.isWin) {
    symbolData.momentumPreference = "positive";
  } else if (lesson.marketState.momentum < -30 && lesson.isWin) {
    symbolData.momentumPreference = "negative";
  }
  
  // Update confidence
  const winRate = symbolData.totalTrades > 0 ? (symbolData.wins / symbolData.totalTrades) * 100 : 50;
  symbolData.confidence = Math.min(95, 30 + winRate * 0.6 + symbolData.totalTrades * 0.5);
  
  brain.symbolPerformance.set(lesson.symbol, symbolData);
  
  return {
    type: "pattern",
    priority: symbolData.totalTrades >= 10 ? "high" : "low",
    message: `${lesson.symbol} learning updated. Win rate: ${winRate.toFixed(1)}%, Best strategy: ${symbolData.bestStrategy}`,
    confidence: symbolData.confidence,
    actionTaken: "Updated symbol-specific model",
    improvement: lesson.isWin ? 0.2 : -0.1,
  };
}

/**
 * Timing Optimization - Learn best times to trade
 */
function optimizeTiming(lesson: TradeLesson): LearningInsight | null {
  const hour = lesson.entryTiming.hourOfDay;
  const day = lesson.entryTiming.dayOfWeek;
  
  // Update hourly win rates with exponential smoothing
  const alpha = 0.1;
  const hourlyResult = lesson.isWin ? 100 : 0;
  brain.timingOptimization.hourlyWinRates[hour] = 
    brain.timingOptimization.hourlyWinRates[hour] * (1 - alpha) + hourlyResult * alpha;
  
  // Update daily win rates
  brain.timingOptimization.dailyWinRates[day] = 
    brain.timingOptimization.dailyWinRates[day] * (1 - alpha) + hourlyResult * alpha;
  
  // Update best/worst hours
  const sortedHours = brain.timingOptimization.hourlyWinRates
    .map((rate, idx) => ({ hour: idx, rate }))
    .sort((a, b) => b.rate - a.rate);
  
  brain.timingOptimization.bestHours = sortedHours.slice(0, 4).map(h => h.hour);
  brain.timingOptimization.worstHours = sortedHours.slice(-3).map(h => h.hour);
  
  // Update hold time learning
  if (lesson.isWin) {
    brain.timingOptimization.avgWinHoldTime = 
      brain.timingOptimization.avgWinHoldTime * 0.9 + lesson.duration * 0.1;
  } else {
    brain.timingOptimization.avgLossHoldTime = 
      brain.timingOptimization.avgLossHoldTime * 0.9 + lesson.duration * 0.1;
  }
  
  // Calculate optimal hold time (closer to winning trades)
  brain.timingOptimization.optimalHoldTime = 
    brain.timingOptimization.avgWinHoldTime * 0.8 + brain.timingOptimization.avgLossHoldTime * 0.2;
  
  const isBestHour = brain.timingOptimization.bestHours.includes(hour);
  const isWorstHour = brain.timingOptimization.worstHours.includes(hour);
  
  return {
    type: "timing",
    priority: isWorstHour && !lesson.isWin ? "high" : "low",
    message: `Hour ${hour} win rate: ${brain.timingOptimization.hourlyWinRates[hour].toFixed(1)}%. ${isBestHour ? "✓ Best hour" : isWorstHour ? "⚠ Avoid this hour" : ""}`,
    confidence: 70,
    actionTaken: "Updated timing model",
    improvement: isBestHour && lesson.isWin ? 0.3 : isWorstHour && !lesson.isWin ? -0.2 : 0,
  };
}

/**
 * Risk Parameter Adjustment - Learn optimal risk settings - ENHANCED
 */
function adjustRiskParameters(lesson: TradeLesson): LearningInsight | null {
  const alpha = 0.08; // Faster adjustment for quicker learning
  
  if (lesson.isWin) {
    // Successful trade - moderately increase risk tolerance
    if (lesson.profitPercent > brain.adaptiveParameters.takeProfitPercent) {
      brain.riskLearning.optimalTakeProfit = 
        brain.riskLearning.optimalTakeProfit * (1 - alpha) + lesson.profitPercent * alpha;
    }
    
    // Increase position size more after wins
    brain.riskLearning.optimalPositionSize = 
      Math.min(12, brain.riskLearning.optimalPositionSize * 1.03); // Increased cap and rate
    
    brain.riskLearning.riskRewardRatio = 
      brain.riskLearning.riskRewardRatio * (1 - alpha) + 
      (lesson.profitPercent / brain.adaptiveParameters.stopLossPercent) * alpha;
      
    // Learn from big wins
    if (lesson.profitPercent > brain.riskLearning.optimalTakeProfit * 1.5) {
      brain.adaptiveParameters.takeProfitPercent = 
        Math.max(brain.adaptiveParameters.takeProfitPercent, lesson.profitPercent * 0.9);
    }
  } else {
    // Failed trade - tighten risk MORE AGGRESSIVELY
    if (Math.abs(lesson.profitPercent) > brain.adaptiveParameters.stopLossPercent) {
      brain.riskLearning.optimalStopLoss = 
        Math.max(0.3, brain.riskLearning.optimalStopLoss * 0.96); // Faster tightening
    }
    
    // Decrease position size faster after losses
    brain.riskLearning.optimalPositionSize = 
      Math.max(1.5, brain.riskLearning.optimalPositionSize * 0.96); // More aggressive reduction
      
    // Extra penalty for large losses
    if (Math.abs(lesson.profitPercent) > brain.riskLearning.optimalStopLoss * 1.5) {
      brain.riskLearning.optimalPositionSize = 
        Math.max(1.5, brain.riskLearning.optimalPositionSize * 0.9);
    }
  }
  
  return {
    type: "risk",
    priority: !lesson.isWin && Math.abs(lesson.profitPercent) > 3 ? "high" : "low",
    message: `Risk parameters adjusted. Position size: ${brain.riskLearning.optimalPositionSize.toFixed(1)}%, Stop loss: ${brain.riskLearning.optimalStopLoss.toFixed(2)}%`,
    confidence: 80,
    actionTaken: lesson.isWin ? "Increased risk tolerance" : "Tightened risk controls significantly",
    improvement: lesson.isWin ? 0.15 : -0.08,
  };
}

/**
 * Adaptive Parameter Tuning - Continuously optimize all parameters
 */
function tuneAdaptiveParameters(lesson: TradeLesson): LearningInsight | null {
  const alpha = brain.learningRate;
  
  // Adjust take profit based on actual profits
  if (lesson.isWin && lesson.profitPercent > 0) {
    brain.adaptiveParameters.takeProfitPercent = 
      brain.adaptiveParameters.takeProfitPercent * (1 - alpha) + 
      lesson.profitPercent * 1.1 * alpha; // Aim slightly higher
  }
  
  // Adjust stop loss based on actual losses
  if (!lesson.isWin && lesson.profitPercent < 0) {
    const actualLoss = Math.abs(lesson.profitPercent);
    if (actualLoss > brain.adaptiveParameters.stopLossPercent) {
      // Stop loss was too loose
      brain.adaptiveParameters.stopLossPercent = 
        Math.max(0.5, brain.adaptiveParameters.stopLossPercent * 0.95);
    }
  }
  
  // Adjust confidence thresholds based on trade outcomes - MORE RESPONSIVE
  if (lesson.isWin) {
    // Lower entry threshold more aggressively for winning conditions
    brain.adaptiveParameters.entryConfidenceThreshold = 
      Math.max(45, brain.adaptiveParameters.entryConfidenceThreshold - 1.5);
  } else {
    // Raise entry threshold faster after losses
    brain.adaptiveParameters.entryConfidenceThreshold = 
      Math.min(80, brain.adaptiveParameters.entryConfidenceThreshold + 2);
  }
  
  // Adjust trailing stop based on how trades close
  if (lesson.isWin && lesson.profitPercent > brain.adaptiveParameters.takeProfitPercent * 0.5) {
    brain.adaptiveParameters.trailingStopPercent = 
      Math.min(2, brain.adaptiveParameters.trailingStopPercent * 1.05);
  }
  
  // Adjust scaling factor based on overall performance
  const recentWinRate = calculateRecentWinRate();
  if (recentWinRate > 80) {
    brain.adaptiveParameters.scalingFactor = Math.min(2, brain.adaptiveParameters.scalingFactor * 1.02);
  } else if (recentWinRate < 50) {
    brain.adaptiveParameters.scalingFactor = Math.max(0.5, brain.adaptiveParameters.scalingFactor * 0.98);
  }
  
  return {
    type: "optimization",
    priority: "medium",
    message: `Parameters tuned. TP: ${brain.adaptiveParameters.takeProfitPercent.toFixed(2)}%, SL: ${brain.adaptiveParameters.stopLossPercent.toFixed(2)}%, Entry threshold: ${brain.adaptiveParameters.entryConfidenceThreshold.toFixed(0)}%`,
    confidence: 75,
    actionTaken: "Fine-tuned adaptive parameters",
    improvement: lesson.isWin ? 0.15 : -0.05,
  };
}

/**
 * Memory Consolidation - Prune weak memories, strengthen strong ones
 */
function consolidateMemories(): void {
  const now = new Date();
  
  brain.neuralMemories = brain.neuralMemories.filter(memory => {
    // Apply time decay
    const hoursSinceActivation = (now.getTime() - memory.lastActivated.getTime()) / (1000 * 60 * 60);
    memory.weight *= Math.exp(-memory.decayRate * hoursSinceActivation / 24);
    
    // Remove very weak or old memories
    if (memory.weight < 0.1 || (hoursSinceActivation > 168 && memory.activations < 3)) {
      return false;
    }
    
    return true;
  });
  
  // Sort by effectiveness
  brain.neuralMemories.sort((a, b) => (b.successRate * b.weight) - (a.successRate * a.weight));
  
  // Keep top 1000 memories (unlimited growth but pruned)
  if (brain.neuralMemories.length > 1000) {
    brain.neuralMemories = brain.neuralMemories.slice(0, 1000);
  }
}

/**
 * Record Evolution - Track improvement over time
 */
function recordEvolution(insights: LearningInsight[]): void {
  const winRate = calculateRecentWinRate();
  const avgProfit = calculateRecentAvgProfit();
  
  const snapshot: EvolutionSnapshot = {
    timestamp: new Date(),
    version: brain.version,
    winRate,
    avgProfit,
    totalTrades: brain.totalTradesAnalyzed,
    improvements: insights.filter(i => i.improvement > 0).map(i => i.message),
  };
  
  brain.evolutionHistory.push(snapshot);
  
  // Keep last 100 snapshots
  if (brain.evolutionHistory.length > 100) {
    brain.evolutionHistory = brain.evolutionHistory.slice(-100);
  }
  
  // Version bump on significant improvement
  if (brain.evolutionHistory.length >= 2) {
    const prev = brain.evolutionHistory[brain.evolutionHistory.length - 2];
    if (winRate > prev.winRate + 5 || avgProfit > prev.avgProfit + 0.5) {
      brain.version++;
    }
  }
}

/**
 * Adjust Learning Rate - Speed up learning when performing well
 */
function adjustLearningRate(): void {
  const recentWinRate = calculateRecentWinRate();
  
  if (recentWinRate > 70) {
    // Performing well - learn faster and exploit more
    brain.learningRate = Math.min(0.4, brain.learningRate * 1.1);
    brain.explorationRate = Math.max(0.05, brain.explorationRate * 0.9);
  } else if (recentWinRate > 50) {
    // Decent performance - slight boost
    brain.learningRate = Math.min(0.35, brain.learningRate * 1.05);
  } else if (recentWinRate < 40) {
    // Struggling - explore more aggressively to find better strategies
    brain.learningRate = Math.max(0.15, brain.learningRate * 0.9);
    brain.explorationRate = Math.min(0.35, brain.explorationRate * 1.15);
  }
}

// ============= HELPER FUNCTIONS =============

function generatePatternId(lesson: TradeLesson): string {
  const trend = lesson.marketState.trend[0];
  const vol = lesson.marketState.volatility > 70 ? "H" : lesson.marketState.volatility < 30 ? "L" : "M";
  const rsi = lesson.indicators.rsi > 70 ? "OB" : lesson.indicators.rsi < 30 ? "OS" : "N";
  const macd = lesson.indicators.macd > 0 ? "+" : "-";
  
  return `${lesson.symbol}_${lesson.strategy}_${trend}${vol}_RSI${rsi}_MACD${macd}`;
}

function calculateRecentWinRate(): number {
  const recentMemories = brain.neuralMemories.slice(0, 50);
  if (recentMemories.length === 0) return 50;
  
  const totalWeight = recentMemories.reduce((sum, m) => sum + m.weight, 0);
  const weightedSuccess = recentMemories.reduce((sum, m) => sum + m.successRate * m.weight, 0);
  
  return totalWeight > 0 ? weightedSuccess / totalWeight : 50;
}

function calculateRecentAvgProfit(): number {
  const recentMemories = brain.neuralMemories.slice(0, 50);
  if (recentMemories.length === 0) return 0;
  
  const totalWeight = recentMemories.reduce((sum, m) => sum + m.weight, 0);
  const weightedProfit = recentMemories.reduce((sum, m) => sum + m.avgProfit * m.weight, 0);
  
  return totalWeight > 0 ? weightedProfit / totalWeight : 0;
}

// ============= PUBLIC API =============

/**
 * Get the current brain state
 */
export function getBrainState(): LearningBrain {
  return { ...brain };
}

/**
 * Get optimized parameters for trading
 */
export function getOptimizedParameters(): AdaptiveParameters {
  return { ...brain.adaptiveParameters };
}

/**
 * Set the confidence threshold manually (useful for tuning)
 */
export function setConfidenceThreshold(threshold: number): { success: boolean; newThreshold: number; message: string } {
  const clampedThreshold = Math.max(30, Math.min(90, threshold));
  brain.adaptiveParameters.entryConfidenceThreshold = clampedThreshold;
  brain.confidenceThreshold = clampedThreshold;
  
  return {
    success: true,
    newThreshold: clampedThreshold,
    message: `Confidence threshold set to ${clampedThreshold}%. AI will ${clampedThreshold < 60 ? 'take more trades' : clampedThreshold > 75 ? 'be more selective' : 'trade normally'}.`
  };
}

/**
 * Get strategy weights for decision making
 */
export function getStrategyWeights(): Record<string, number> {
  const weights: Record<string, number> = {};
  brain.strategyWeights.forEach((weight, strategy) => {
    weights[strategy] = weight;
  });
  return weights;
}

/**
 * Get best strategy for a symbol
 */
export function getBestStrategyForSymbol(symbol: string): string {
  const symbolData = brain.symbolPerformance.get(symbol);
  if (symbolData && symbolData.confidence > 60) {
    return symbolData.bestStrategy;
  }
  
  // Return highest weighted strategy
  let bestStrategy = "rsi_macd_bb";
  let maxWeight = 0;
  brain.strategyWeights.forEach((weight, strategy) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      bestStrategy = strategy;
    }
  });
  
  return bestStrategy;
}

/**
 * Check if current hour is good for trading
 */
export function isGoodTradingTime(): { isGood: boolean; confidence: number; reason: string } {
  const hour = new Date().getHours();
  const winRate = brain.timingOptimization.hourlyWinRates[hour];
  
  if (brain.timingOptimization.bestHours.includes(hour)) {
    return { isGood: true, confidence: 85, reason: `Hour ${hour} is a top performing hour (${winRate.toFixed(1)}% win rate)` };
  }
  
  if (brain.timingOptimization.worstHours.includes(hour)) {
    return { isGood: false, confidence: 80, reason: `Hour ${hour} has poor performance (${winRate.toFixed(1)}% win rate). Consider waiting.` };
  }
  
  return { isGood: winRate >= 50, confidence: 60, reason: `Hour ${hour} has average performance (${winRate.toFixed(1)}% win rate)` };
}

/**
 * Get entry confidence for a potential trade
 */
export function getEntryConfidence(
  symbol: string,
  strategy: string,
  marketState: MarketState,
  indicators: IndicatorSnapshot
): { confidence: number; shouldEnter: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let confidence = 55; // Start slightly higher
  
  // Check strategy weight - STRONGER INFLUENCE
  const strategyWeight = brain.strategyWeights.get(strategy) || 1.0;
  confidence += (strategyWeight - 1) * 25; // Increased from 20
  if (strategyWeight > 1.5) {
    confidence += 5; // Extra boost for really strong strategies
    reasons.push(`${strategy} is a TOP performer (weight: ${strategyWeight.toFixed(2)})`);
  } else if (strategyWeight > 1.2) {
    reasons.push(`${strategy} is a strong performer`);
  }
  
  // Check symbol performance - ENHANCED
  const symbolData = brain.symbolPerformance.get(symbol);
  if (symbolData && symbolData.totalTrades > 5) {
    const symbolWinRate = (symbolData.wins / symbolData.totalTrades) * 100;
    const symbolBoost = (symbolWinRate - 50) * 0.4; // Increased from 0.3
    confidence += symbolBoost;
    if (symbolWinRate > 70) {
      confidence += 8; // Extra boost for very high win rate
      reasons.push(`${symbol} has EXCELLENT ${symbolWinRate.toFixed(0)}% win rate`);
    } else if (symbolWinRate > 60) {
      confidence += 3;
      reasons.push(`${symbol} has good ${symbolWinRate.toFixed(0)}% win rate`);
    } else if (symbolWinRate < 40) {
      confidence -= 5; // Penalty for poor performers
    }
    
    // Check if conditions match symbol preferences
    if (symbolData.volatilityPreference === "high" && marketState.volatility > 70) {
      confidence += 8; // Increased from 5
      reasons.push("High volatility matches symbol preference");
    } else if (symbolData.volatilityPreference === "low" && marketState.volatility < 30) {
      confidence += 8;
      reasons.push("Low volatility matches symbol preference");
    }
    
    // Check momentum preference
    if (symbolData.momentumPreference === "positive" && marketState.momentum > 20) {
      confidence += 5;
      reasons.push("Positive momentum matches preference");
    }
  }
  
  // Check timing - STRONGER INFLUENCE
  const timingCheck = isGoodTradingTime();
  if (timingCheck.isGood) {
    confidence += 15; // Increased from 10
    reasons.push(timingCheck.reason);
  } else {
    confidence -= 15; // Increased penalty
  }
  
  // Check pattern matches - MUCH STRONGER INFLUENCE
  const matchingPatterns = findMatchingPatterns(symbol, strategy, marketState, indicators);
  if (matchingPatterns.length > 0) {
    const bestPattern = matchingPatterns[0];
    const patternBoost = bestPattern.successRate * 0.3; // Increased from 0.2
    confidence += patternBoost;
    
    // Extra boost if multiple strong patterns agree
    if (matchingPatterns.length >= 3 && bestPattern.successRate > 70) {
      confidence += 10;
      reasons.push(`STRONG: ${matchingPatterns.length} patterns agree (${bestPattern.successRate.toFixed(0)}% success)`);
    } else if (bestPattern.successRate > 80) {
      confidence += 8;
      reasons.push(`Exceptional pattern: ${bestPattern.successRate.toFixed(0)}% success rate`);
    } else {
      reasons.push(`Matches pattern with ${bestPattern.successRate.toFixed(0)}% success`);
    }
  }
  
  // Enhanced technical indicator analysis
  if (indicators.rsi < 25) {
    confidence += 15; // Increased for strong oversold
    reasons.push("RSI VERY oversold - excellent entry");
  } else if (indicators.rsi < 35) {
    confidence += 10; // Increased from undefined
    reasons.push("RSI oversold - good entry");
  } else if (indicators.rsi > 75) {
    confidence -= 15; // Increased penalty
    reasons.push("RSI VERY overbought - risky entry");
  } else if (indicators.rsi > 65) {
    confidence -= 8;
    reasons.push("RSI overbought - caution");
  }
  
  // MACD with stronger signals
  if (indicators.macd > 0 && indicators.macdHistogram > 0) {
    const macdStrength = Math.abs(indicators.macdHistogram);
    if (macdStrength > 5) {
      confidence += 10;
      reasons.push("MACD strongly bullish");
    } else {
      confidence += 5;
      reasons.push("MACD bullish");
    }
  } else if (indicators.macd < 0 && indicators.macdHistogram < 0) {
    confidence -= 8;
  }
  
  // Bollinger Bands positioning (guard against division by zero)
  const bbRange = indicators.bollingerUpper - indicators.bollingerLower;
  if (bbRange > 0) {
    const bbPosition = (indicators.bollingerMiddle - indicators.bollingerLower) / bbRange;
    if (bbPosition < 0.2) {
      confidence += 8;
      reasons.push("Price near lower Bollinger Band");
    } else if (bbPosition > 0.8) {
      confidence -= 8;
    }
  }
  
  // Cap confidence
  confidence = Math.max(10, Math.min(95, confidence));
  
  const shouldEnter = confidence >= brain.adaptiveParameters.entryConfidenceThreshold;
  
  return { confidence, shouldEnter, reasons };
}

/**
 * Find patterns that match current conditions - ENHANCED MATCHING
 */
function findMatchingPatterns(
  symbol: string,
  strategy: string,
  marketState: MarketState,
  indicators: IndicatorSnapshot
): NeuralMemory[] {
  return brain.neuralMemories.filter(memory => {
    const pattern = memory.pattern;
    let matchScore = 0;
    
    // Must match symbol or be a general pattern
    if (pattern.symbol !== symbol && pattern.symbol !== "*") return false;
    
    // Strategy should match
    if (pattern.strategy !== strategy) return false;
    
    // Market condition similarity (weighted scoring)
    if (pattern.marketCondition.trend === marketState.trend) matchScore += 30;
    
    // Volatility similarity - more lenient
    const volDiff = Math.abs(pattern.marketCondition.volatility - marketState.volatility);
    if (volDiff < 15) matchScore += 20;
    else if (volDiff < 35) matchScore += 10;
    else return false; // Too different
    
    // RSI zone matching - refined zones
    const rsiZone = (rsi: number) => {
      if (rsi < 25) return "very_oversold";
      if (rsi < 40) return "oversold";
      if (rsi < 60) return "neutral";
      if (rsi < 75) return "overbought";
      return "very_overbought";
    };
    if (rsiZone(pattern.indicators.rsi) === rsiZone(indicators.rsi)) matchScore += 25;
    
    // Momentum similarity
    const momentumDiff = Math.abs(pattern.marketCondition.momentum - marketState.momentum);
    if (momentumDiff < 20) matchScore += 15;
    else if (momentumDiff < 40) matchScore += 5;
    
    // MACD trend similarity
    const macdTrend = (macd: number, signal: number) => macd > signal ? "bullish" : "bearish";
    if (macdTrend(pattern.indicators.macd, pattern.indicators.macdSignal) === 
        macdTrend(indicators.macd, indicators.macdSignal)) {
      matchScore += 10;
    }
    
    // Only accept patterns with good match score
    return matchScore >= 60; // Require at least 60% similarity
  }).sort((a, b) => {
    // Sort by weighted score: success rate * weight * confidence
    const scoreA = (a.successRate / 100) * a.weight * (a.confidence / 100);
    const scoreB = (b.successRate / 100) * b.weight * (b.confidence / 100);
    return scoreB - scoreA;
  });
}

/**
 * Get learning statistics
 */
export function getLearningStats(): {
  totalCycles: number;
  totalTrades: number;
  version: number;
  winRate: number;
  avgProfit: number;
  patternsLearned: number;
  strategiesRanked: string[];
  learningRate: number;
  confidence: number;
} {
  const winRate = calculateRecentWinRate();
  const avgProfit = calculateRecentAvgProfit();
  
  const strategiesRanked = Array.from(brain.strategyWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([strategy]) => strategy);
  
  return {
    totalCycles: brain.totalLearningCycles,
    totalTrades: brain.totalTradesAnalyzed,
    version: brain.version,
    winRate,
    avgProfit,
    patternsLearned: brain.neuralMemories.length,
    strategiesRanked,
    learningRate: brain.learningRate,
    confidence: Math.min(95, 50 + brain.totalTradesAnalyzed * 0.5 + winRate * 0.3),
  };
}

/**
 * Get evolution history
 */
export function getEvolutionHistory(): EvolutionSnapshot[] {
  return [...brain.evolutionHistory];
}

/**
 * Reset the brain (for testing)
 */
export function resetBrain(): void {
  brain = initializeBrain();
}

/**
 * Export brain state for persistence
 */
export function exportBrainState(): string {
  const exportData = {
    ...brain,
    strategyWeights: Object.fromEntries(brain.strategyWeights),
    symbolPerformance: Object.fromEntries(brain.symbolPerformance),
  };
  return JSON.stringify(exportData);
}

/**
 * Import brain state from persistence
 */
export function importBrainState(jsonState: string): boolean {
  try {
    const importData = JSON.parse(jsonState);
    brain = {
      ...importData,
      strategyWeights: new Map(Object.entries(importData.strategyWeights)),
      symbolPerformance: new Map(Object.entries(importData.symbolPerformance)),
      lastUpdate: new Date(importData.lastUpdate),
      evolutionHistory: importData.evolutionHistory.map((e: EvolutionSnapshot) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      })),
      neuralMemories: importData.neuralMemories.map((m: NeuralMemory) => ({
        ...m,
        lastActivated: new Date(m.lastActivated),
      })),
    };
    return true;
  } catch {
    return false;
  }
}
