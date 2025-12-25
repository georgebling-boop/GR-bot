/**
 * Self-Learning Trading System
 * Analyzes past trades, identifies patterns, and continuously improves strategies
 */

export interface TradePattern {
  id: string;
  name: string;
  conditions: PatternCondition[];
  successRate: number;
  sampleSize: number;
  avgProfit: number;
  lastUpdated: Date;
}

export interface PatternCondition {
  indicator: string;
  operator: ">" | "<" | "=" | ">=" | "<=";
  value: number;
  weight: number;
}

export interface LearningInsight {
  type: "success" | "warning" | "info";
  message: string;
  confidence: number;
  actionable: boolean;
}

export interface StrategyPerformance {
  name: string;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  score: number;
}

export interface MarketCondition {
  trend: "bullish" | "bearish" | "sideways";
  volatility: "low" | "medium" | "high";
  volume: "low" | "normal" | "high";
  momentum: number;
  confidence: number;
}

export interface LearningState {
  isLearning: boolean;
  totalAnalyzedTrades: number;
  patternsDiscovered: number;
  currentWinRate: number;
  targetWinRate: number;
  improvementRate: number;
  lastLearningCycle: Date;
  insights: LearningInsight[];
  strategyRankings: StrategyPerformance[];
  marketCondition: MarketCondition;
  optimizedParameters: Record<string, number>;
}

// In-memory learning state
let learningState: LearningState = {
  isLearning: false,
  totalAnalyzedTrades: 0,
  patternsDiscovered: 0,
  currentWinRate: 50,
  targetWinRate: 65,
  improvementRate: 0,
  lastLearningCycle: new Date(),
  insights: [],
  strategyRankings: [],
  marketCondition: {
    trend: "sideways",
    volatility: "medium",
    volume: "normal",
    momentum: 0,
    confidence: 50,
  },
  optimizedParameters: {
    takeProfitPercent: 1.5,
    stopLossPercent: 1.0,
    positionSizePercent: 5,
    maxOpenTrades: 5,
    rsiOversold: 30,
    rsiOverbought: 70,
    macdThreshold: 0,
    bollingerDeviation: 2,
  },
};

// Historical trade data for learning
interface HistoricalTrade {
  id: string;
  symbol: string;
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  profitPercent: number;
  duration: number;
  marketCondition: MarketCondition;
  indicators: Record<string, number>;
  isWin: boolean;
  timestamp: Date;
}

let historicalTrades: HistoricalTrade[] = [];
let discoveredPatterns: TradePattern[] = [];

/**
 * Analyze a completed trade and learn from it
 */
export function analyzeTrade(trade: {
  symbol: string;
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  profitPercent: number;
  duration: number;
  indicators?: Record<string, number>;
}): LearningInsight[] {
  const insights: LearningInsight[] = [];
  
  // Create historical trade record
  const historicalTrade: HistoricalTrade = {
    id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol: trade.symbol,
    strategy: trade.strategy,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    profit: trade.profit,
    profitPercent: trade.profitPercent,
    duration: trade.duration,
    marketCondition: { ...learningState.marketCondition },
    indicators: trade.indicators || {},
    isWin: trade.profit > 0,
    timestamp: new Date(),
  };
  
  historicalTrades.push(historicalTrade);
  learningState.totalAnalyzedTrades++;
  
  // Update win rate
  const recentTrades = historicalTrades.slice(-100);
  const wins = recentTrades.filter(t => t.isWin).length;
  const newWinRate = (wins / recentTrades.length) * 100;
  
  // Calculate improvement
  const previousWinRate = learningState.currentWinRate;
  learningState.currentWinRate = newWinRate;
  learningState.improvementRate = newWinRate - previousWinRate;
  
  // Generate insights based on trade outcome
  if (trade.profit > 0) {
    if (trade.profitPercent > 2) {
      insights.push({
        type: "success",
        message: `Strong win on ${trade.symbol} (+${trade.profitPercent.toFixed(2)}%). ${trade.strategy} strategy performing well.`,
        confidence: 85,
        actionable: false,
      });
    }
    
    // Learn from winning conditions
    if (trade.indicators) {
      learnFromWinningTrade(historicalTrade);
    }
  } else {
    if (trade.profitPercent < -2) {
      insights.push({
        type: "warning",
        message: `Significant loss on ${trade.symbol} (${trade.profitPercent.toFixed(2)}%). Adjusting ${trade.strategy} parameters.`,
        confidence: 75,
        actionable: true,
      });
      
      // Adjust parameters after loss
      adjustParametersAfterLoss(trade.strategy, trade.profitPercent);
    }
  }
  
  // Check for pattern matches
  const matchedPatterns = findMatchingPatterns(historicalTrade);
  if (matchedPatterns.length > 0) {
    insights.push({
      type: "info",
      message: `Trade matched ${matchedPatterns.length} known pattern(s). Using learned behavior.`,
      confidence: 70,
      actionable: false,
    });
  }
  
  learningState.insights = [...insights, ...learningState.insights].slice(0, 20);
  learningState.lastLearningCycle = new Date();
  
  return insights;
}

/**
 * Learn from a winning trade to identify successful patterns
 */
function learnFromWinningTrade(trade: HistoricalTrade): void {
  // Find similar winning trades
  const similarWins = historicalTrades.filter(t => 
    t.isWin &&
    t.strategy === trade.strategy &&
    t.symbol === trade.symbol &&
    Math.abs(t.profitPercent - trade.profitPercent) < 1
  );
  
  if (similarWins.length >= 3) {
    // Create or update pattern
    const patternId = `pattern_${trade.strategy}_${trade.symbol}`;
    const existingPattern = discoveredPatterns.find(p => p.id === patternId);
    
    if (existingPattern) {
      existingPattern.sampleSize++;
      existingPattern.successRate = (existingPattern.successRate * (existingPattern.sampleSize - 1) + 100) / existingPattern.sampleSize;
      existingPattern.avgProfit = (existingPattern.avgProfit * (existingPattern.sampleSize - 1) + trade.profitPercent) / existingPattern.sampleSize;
      existingPattern.lastUpdated = new Date();
    } else {
      const newPattern: TradePattern = {
        id: patternId,
        name: `${trade.strategy} on ${trade.symbol}`,
        conditions: [],
        successRate: 100,
        sampleSize: 1,
        avgProfit: trade.profitPercent,
        lastUpdated: new Date(),
      };
      discoveredPatterns.push(newPattern);
      learningState.patternsDiscovered++;
    }
  }
}

/**
 * Find patterns that match current trade conditions
 */
function findMatchingPatterns(trade: HistoricalTrade): TradePattern[] {
  return discoveredPatterns.filter(pattern => {
    // Simple matching based on strategy and symbol
    return pattern.name.includes(trade.strategy) || pattern.name.includes(trade.symbol);
  });
}

/**
 * Adjust strategy parameters after a loss
 */
function adjustParametersAfterLoss(strategy: string, lossPercent: number): void {
  const adjustmentFactor = Math.min(Math.abs(lossPercent) / 10, 0.2);
  
  // Tighten stop loss slightly
  learningState.optimizedParameters.stopLossPercent = Math.max(
    0.5,
    learningState.optimizedParameters.stopLossPercent * (1 - adjustmentFactor * 0.1)
  );
  
  // Reduce position size slightly after big losses
  if (lossPercent < -3) {
    learningState.optimizedParameters.positionSizePercent = Math.max(
      2,
      learningState.optimizedParameters.positionSizePercent * 0.95
    );
  }
}

/**
 * Detect current market conditions
 */
export function detectMarketCondition(prices: { symbol: string; price: number; change24h: number }[]): MarketCondition {
  if (prices.length === 0) {
    return learningState.marketCondition;
  }
  
  // Calculate average change
  const avgChange = prices.reduce((sum, p) => sum + p.change24h, 0) / prices.length;
  
  // Determine trend
  let trend: "bullish" | "bearish" | "sideways";
  if (avgChange > 2) {
    trend = "bullish";
  } else if (avgChange < -2) {
    trend = "bearish";
  } else {
    trend = "sideways";
  }
  
  // Calculate volatility based on spread of changes
  const changes = prices.map(p => p.change24h);
  const maxChange = Math.max(...changes);
  const minChange = Math.min(...changes);
  const spread = maxChange - minChange;
  
  let volatility: "low" | "medium" | "high";
  if (spread < 3) {
    volatility = "low";
  } else if (spread < 8) {
    volatility = "medium";
  } else {
    volatility = "high";
  }
  
  // Update market condition
  learningState.marketCondition = {
    trend,
    volatility,
    volume: "normal",
    momentum: avgChange,
    confidence: Math.min(90, 50 + prices.length * 5),
  };
  
  return learningState.marketCondition;
}

/**
 * Get optimized parameters for current market conditions
 */
export function getOptimizedParameters(): Record<string, number> {
  const params = { ...learningState.optimizedParameters };
  const condition = learningState.marketCondition;
  
  // Adjust based on market conditions
  if (condition.volatility === "high") {
    params.takeProfitPercent *= 1.3;
    params.stopLossPercent *= 1.2;
    params.positionSizePercent *= 0.8;
  } else if (condition.volatility === "low") {
    params.takeProfitPercent *= 0.8;
    params.stopLossPercent *= 0.9;
  }
  
  if (condition.trend === "bullish") {
    params.rsiOverbought = 75;
    params.positionSizePercent *= 1.1;
  } else if (condition.trend === "bearish") {
    params.rsiOversold = 25;
    params.positionSizePercent *= 0.9;
  }
  
  return params;
}

/**
 * Rank strategies by performance
 */
export function rankStrategies(): StrategyPerformance[] {
  const strategyMap = new Map<string, HistoricalTrade[]>();
  
  // Group trades by strategy
  historicalTrades.forEach(trade => {
    const existing = strategyMap.get(trade.strategy) || [];
    existing.push(trade);
    strategyMap.set(trade.strategy, existing);
  });
  
  const rankings: StrategyPerformance[] = [];
  
  strategyMap.forEach((trades, strategy) => {
    if (trades.length < 3) return;
    
    const wins = trades.filter(t => t.isWin);
    const losses = trades.filter(t => !t.isWin);
    
    const winRate = (wins.length / trades.length) * 100;
    const avgProfit = wins.length > 0 
      ? wins.reduce((sum, t) => sum + t.profitPercent, 0) / wins.length 
      : 0;
    const avgLoss = losses.length > 0 
      ? Math.abs(losses.reduce((sum, t) => sum + t.profitPercent, 0) / losses.length)
      : 0;
    
    const profitFactor = avgLoss > 0 ? avgProfit / avgLoss : avgProfit;
    
    // Calculate simple Sharpe-like ratio
    const returns = trades.map(t => t.profitPercent);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    
    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    trades.forEach(t => {
      cumulative += t.profitPercent;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Calculate composite score
    const score = (winRate * 0.3) + (profitFactor * 20) + (sharpeRatio * 10) - (maxDrawdown * 0.5);
    
    rankings.push({
      name: strategy,
      winRate,
      avgProfit,
      avgLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      totalTrades: trades.length,
      score,
    });
  });
  
  // Sort by score
  rankings.sort((a, b) => b.score - a.score);
  learningState.strategyRankings = rankings;
  
  return rankings;
}

/**
 * Get the best strategy for current conditions
 */
export function getBestStrategy(): string {
  const rankings = rankStrategies();
  const condition = learningState.marketCondition;
  
  if (rankings.length === 0) {
    // Default strategies based on market condition
    if (condition.trend === "bullish") return "momentum";
    if (condition.trend === "bearish") return "mean_reversion";
    if (condition.volatility === "high") return "volatility_breakout";
    return "rsi_macd_bb";
  }
  
  // Filter strategies that work well in current conditions
  const suitableStrategies = rankings.filter(s => {
    if (condition.volatility === "high" && s.maxDrawdown > 10) return false;
    if (s.winRate < 40) return false;
    return true;
  });
  
  return suitableStrategies.length > 0 ? suitableStrategies[0].name : rankings[0].name;
}

/**
 * Run a learning cycle to improve strategies
 */
export function runLearningCycle(): LearningState {
  learningState.isLearning = true;
  
  // Rank strategies
  rankStrategies();
  
  // Detect market conditions (use cached data)
  // Market condition is updated separately via detectMarketCondition
  
  // Generate insights
  const insights: LearningInsight[] = [];
  
  // Win rate insight
  if (learningState.currentWinRate >= learningState.targetWinRate) {
    insights.push({
      type: "success",
      message: `Target win rate achieved! Current: ${learningState.currentWinRate.toFixed(1)}%`,
      confidence: 90,
      actionable: false,
    });
  } else {
    const gap = learningState.targetWinRate - learningState.currentWinRate;
    insights.push({
      type: "info",
      message: `Win rate ${learningState.currentWinRate.toFixed(1)}%, ${gap.toFixed(1)}% below target. Optimizing parameters.`,
      confidence: 80,
      actionable: true,
    });
  }
  
  // Strategy insight
  if (learningState.strategyRankings.length > 0) {
    const best = learningState.strategyRankings[0];
    insights.push({
      type: "info",
      message: `Best strategy: ${best.name} (${best.winRate.toFixed(1)}% win rate, ${best.profitFactor.toFixed(2)} profit factor)`,
      confidence: 85,
      actionable: true,
    });
  }
  
  // Market condition insight
  insights.push({
    type: "info",
    message: `Market: ${learningState.marketCondition.trend} trend, ${learningState.marketCondition.volatility} volatility`,
    confidence: learningState.marketCondition.confidence,
    actionable: false,
  });
  
  // Patterns insight
  if (learningState.patternsDiscovered > 0) {
    insights.push({
      type: "success",
      message: `${learningState.patternsDiscovered} trading patterns discovered and being used`,
      confidence: 75,
      actionable: false,
    });
  }
  
  learningState.insights = insights;
  learningState.lastLearningCycle = new Date();
  learningState.isLearning = false;
  
  return learningState;
}

/**
 * Get current learning state
 */
export function getLearningState(): LearningState {
  return { ...learningState };
}

/**
 * Reset learning state
 */
export function resetLearning(): void {
  historicalTrades = [];
  discoveredPatterns = [];
  learningState = {
    isLearning: false,
    totalAnalyzedTrades: 0,
    patternsDiscovered: 0,
    currentWinRate: 50,
    targetWinRate: 65,
    improvementRate: 0,
    lastLearningCycle: new Date(),
    insights: [],
    strategyRankings: [],
    marketCondition: {
      trend: "sideways",
      volatility: "medium",
      volume: "normal",
      momentum: 0,
      confidence: 50,
    },
    optimizedParameters: {
      takeProfitPercent: 1.5,
      stopLossPercent: 1.0,
      positionSizePercent: 5,
      maxOpenTrades: 5,
      rsiOversold: 30,
      rsiOverbought: 70,
      macdThreshold: 0,
      bollingerDeviation: 2,
    },
  };
}

/**
 * Get discovered patterns
 */
export function getDiscoveredPatterns(): TradePattern[] {
  return [...discoveredPatterns];
}
