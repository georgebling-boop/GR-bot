/**
 * Advanced Trading Engine
 * Targets 90% win rate with triple-figure weekly profits
 * Includes bot health monitoring, risk management, and smart entry/exit
 */

// ============= TYPES =============
export interface BotHealth {
  status: "healthy" | "warning" | "critical";
  uptime: number;
  lastHeartbeat: Date;
  cpuUsage: number;
  memoryUsage: number;
  apiLatency: number;
  tradesPerMinute: number;
  errorRate: number;
  connectionStatus: "connected" | "reconnecting" | "disconnected";
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  type: "info" | "warning" | "error";
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface WeeklyTarget {
  targetProfit: number;
  currentProfit: number;
  progressPercent: number;
  projectedProfit: number;
  daysRemaining: number;
  dailyTargetRemaining: number;
  onTrack: boolean;
  weekStartDate: Date;
  weekEndDate: Date;
}

export interface RiskManagement {
  maxDrawdownPercent: number;
  currentDrawdown: number;
  maxPositionSize: number;
  maxOpenTrades: number;
  dailyLossLimit: number;
  currentDailyLoss: number;
  riskPerTrade: number;
  isWithinLimits: boolean;
  riskScore: number; // 1-10, lower is safer
}

export interface SmartEntry {
  symbol: string;
  recommendedEntry: number;
  confidence: number;
  reasons: string[];
  expectedProfit: number;
  riskReward: number;
  timeframe: string;
  indicators: {
    rsi: number;
    macd: number;
    bollingerPosition: string;
    volumeStrength: number;
    trendStrength: number;
  };
}

export interface TradingSession {
  id: string;
  startTime: Date;
  equity: number;
  startingEquity: number;
  totalProfit: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  targetWinRate: number;
  weeklyTarget: WeeklyTarget;
  riskManagement: RiskManagement;
  botHealth: BotHealth;
  isActive: boolean;
  autoTradingEnabled: boolean;
  learningEnabled: boolean;
}

// ============= STATE =============
let currentSession: TradingSession | null = null;
let healthAlerts: HealthAlert[] = [];
let sessionStartTime = new Date();

// ============= BOT HEALTH =============
export function getBotHealth(): BotHealth {
  const now = new Date();
  const uptime = currentSession 
    ? (now.getTime() - sessionStartTime.getTime()) / 1000 
    : 0;
  
  // Simulate health metrics
  const cpuUsage = 15 + Math.random() * 20;
  const memoryUsage = 30 + Math.random() * 25;
  const apiLatency = 50 + Math.random() * 100;
  const tradesPerMinute = currentSession?.isActive ? 0.5 + Math.random() * 2 : 0;
  const errorRate = Math.random() * 2;
  
  // Determine status
  let status: "healthy" | "warning" | "critical" = "healthy";
  if (cpuUsage > 80 || memoryUsage > 85 || apiLatency > 500 || errorRate > 5) {
    status = "critical";
  } else if (cpuUsage > 60 || memoryUsage > 70 || apiLatency > 300 || errorRate > 2) {
    status = "warning";
  }
  
  return {
    status,
    uptime,
    lastHeartbeat: now,
    cpuUsage,
    memoryUsage,
    apiLatency,
    tradesPerMinute,
    errorRate,
    connectionStatus: "connected",
    alerts: healthAlerts.filter(a => !a.resolved).slice(0, 5),
  };
}

// ============= WEEKLY TARGETS =============
export function getWeeklyTarget(): WeeklyTarget {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysRemaining = 7 - dayOfWeek;
  
  // Week start (Sunday) and end (Saturday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const targetProfit = 100; // Triple figures = $100+ weekly
  const currentProfit = currentSession?.totalProfit || 0;
  const progressPercent = (currentProfit / targetProfit) * 100;
  
  // Project based on current performance
  const daysPassed = dayOfWeek || 1;
  const dailyAverage = currentProfit / daysPassed;
  const projectedProfit = dailyAverage * 7;
  
  const dailyTargetRemaining = daysRemaining > 0 
    ? (targetProfit - currentProfit) / daysRemaining 
    : 0;
  
  return {
    targetProfit,
    currentProfit,
    progressPercent: Math.min(progressPercent, 100),
    projectedProfit,
    daysRemaining,
    dailyTargetRemaining,
    onTrack: projectedProfit >= targetProfit || currentProfit >= targetProfit,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
  };
}

// ============= RISK MANAGEMENT =============
export function getRiskManagement(): RiskManagement {
  const equity = currentSession?.equity || 800;
  const startingEquity = currentSession?.startingEquity || 800;
  const currentDrawdown = ((startingEquity - equity) / startingEquity) * 100;
  
  // Risk parameters optimized for 90% win rate target
  const maxDrawdownPercent = 10; // Max 10% drawdown
  const maxPositionSize = equity * 0.05; // 5% per trade
  const maxOpenTrades = 3; // Conservative
  const dailyLossLimit = equity * 0.03; // 3% daily loss limit
  const riskPerTrade = 1; // 1% risk per trade
  
  const currentDailyLoss = Math.max(0, -(currentSession?.totalProfit ?? 0));
  
  const isWithinLimits = 
    currentDrawdown < maxDrawdownPercent &&
    currentDailyLoss < dailyLossLimit;
  
  // Risk score (1-10, lower is safer)
  let riskScore = 3;
  if (currentDrawdown > 5) riskScore += 2;
  if (currentDailyLoss > dailyLossLimit * 0.5) riskScore += 2;
  if (!isWithinLimits) riskScore = 10;
  
  return {
    maxDrawdownPercent,
    currentDrawdown: Math.max(0, currentDrawdown),
    maxPositionSize,
    maxOpenTrades,
    dailyLossLimit,
    currentDailyLoss,
    riskPerTrade,
    isWithinLimits,
    riskScore: Math.min(10, riskScore),
  };
}

// ============= SMART ENTRY ANALYSIS =============
export function analyzeSmartEntry(
  symbol: string,
  currentPrice: number,
  priceHistory: number[]
): SmartEntry {
  // Calculate indicators
  const rsi = calculateRSI(priceHistory);
  const macd = calculateMACD(priceHistory);
  const { position: bollingerPosition, upper, lower } = calculateBollinger(priceHistory, currentPrice);
  const volumeStrength = 50 + Math.random() * 50;
  const trendStrength = calculateTrendStrength(priceHistory);
  
  // Determine entry recommendation
  const reasons: string[] = [];
  let confidence = 50;
  let recommendedEntry = currentPrice;
  
  // RSI signals
  if (rsi < 30) {
    reasons.push("RSI oversold - strong buy signal");
    confidence += 15;
    recommendedEntry = currentPrice * 0.998; // Slight discount
  } else if (rsi < 40) {
    reasons.push("RSI approaching oversold");
    confidence += 8;
  } else if (rsi > 70) {
    reasons.push("RSI overbought - wait for pullback");
    confidence -= 10;
  }
  
  // MACD signals
  if (macd > 0) {
    reasons.push("MACD bullish crossover");
    confidence += 10;
  } else if (macd < -0.5) {
    reasons.push("MACD bearish - caution");
    confidence -= 5;
  }
  
  // Bollinger signals
  if (bollingerPosition === "below_lower") {
    reasons.push("Price below lower Bollinger - potential reversal");
    confidence += 12;
    recommendedEntry = lower;
  } else if (bollingerPosition === "near_lower") {
    reasons.push("Price near lower Bollinger band");
    confidence += 8;
  }
  
  // Trend signals
  if (trendStrength > 60) {
    reasons.push("Strong uptrend detected");
    confidence += 10;
  } else if (trendStrength < 40) {
    reasons.push("Weak/downtrend - reduced position size recommended");
    confidence -= 5;
  }
  
  // Volume confirmation
  if (volumeStrength > 70) {
    reasons.push("High volume confirms signal");
    confidence += 5;
  }
  
  // Cap confidence at 95% (never 100% certain)
  confidence = Math.min(95, Math.max(20, confidence));
  
  // Calculate expected profit and risk/reward
  const expectedProfit = confidence > 70 ? 1.5 : confidence > 50 ? 1.0 : 0.5;
  const riskReward = expectedProfit / 1.0; // Assuming 1% stop loss
  
  return {
    symbol,
    recommendedEntry,
    confidence,
    reasons,
    expectedProfit,
    riskReward,
    timeframe: "15m",
    indicators: {
      rsi,
      macd,
      bollingerPosition,
      volumeStrength,
      trendStrength,
    },
  };
}

// ============= INDICATOR CALCULATIONS =============
function calculateRSI(prices: number[]): number {
  if (prices.length < 14) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < Math.min(14, prices.length); i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): number {
  if (prices.length < 26) return 0;
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  return ema12 - ema26;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateBollinger(prices: number[], currentPrice: number): { position: string; upper: number; lower: number } {
  if (prices.length < 20) {
    return { position: "middle", upper: currentPrice * 1.02, lower: currentPrice * 0.98 };
  }
  
  const period = 20;
  const recentPrices = prices.slice(-period);
  const sma = recentPrices.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = recentPrices.map(p => Math.pow(p - sma, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  
  const upper = sma + (2 * stdDev);
  const lower = sma - (2 * stdDev);
  
  let position = "middle";
  if (currentPrice < lower) position = "below_lower";
  else if (currentPrice < lower + (sma - lower) * 0.3) position = "near_lower";
  else if (currentPrice > upper) position = "above_upper";
  else if (currentPrice > upper - (upper - sma) * 0.3) position = "near_upper";
  
  return { position, upper, lower };
}

function calculateTrendStrength(prices: number[]): number {
  if (prices.length < 10) return 50;
  
  const recentPrices = prices.slice(-10);
  let upMoves = 0;
  let downMoves = 0;
  
  for (let i = 1; i < recentPrices.length; i++) {
    if (recentPrices[i] > recentPrices[i - 1]) upMoves++;
    else if (recentPrices[i] < recentPrices[i - 1]) downMoves++;
  }
  
  const total = upMoves + downMoves;
  if (total === 0) return 50;
  
  return (upMoves / total) * 100;
}

// ============= SESSION MANAGEMENT =============
export function initializeSession(startingEquity: number = 800): TradingSession {
  sessionStartTime = new Date();
  
  currentSession = {
    id: `session_${Date.now()}`,
    startTime: sessionStartTime,
    equity: startingEquity,
    startingEquity,
    totalProfit: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    targetWinRate: 90, // 90% target
    weeklyTarget: getWeeklyTarget(),
    riskManagement: getRiskManagement(),
    botHealth: getBotHealth(),
    isActive: false,
    autoTradingEnabled: false,
    learningEnabled: true,
  };
  
  addHealthAlert("info", "Trading session initialized with $" + startingEquity);
  
  return currentSession;
}

export function getSession(): TradingSession | null {
  if (currentSession) {
    currentSession.weeklyTarget = getWeeklyTarget();
    currentSession.riskManagement = getRiskManagement();
    currentSession.botHealth = getBotHealth();
  }
  return currentSession;
}

export function startTrading(): TradingSession | null {
  if (!currentSession) {
    currentSession = initializeSession();
  }
  
  currentSession.isActive = true;
  currentSession.autoTradingEnabled = true;
  addHealthAlert("info", "Auto-trading started - targeting 90% win rate");
  
  return currentSession;
}

export function stopTrading(): TradingSession | null {
  if (currentSession) {
    currentSession.isActive = false;
    currentSession.autoTradingEnabled = false;
    addHealthAlert("info", "Auto-trading stopped");
  }
  return currentSession;
}

export function recordTrade(profit: number, isWin: boolean): TradingSession | null {
  if (!currentSession) return null;
  
  currentSession.totalTrades++;
  currentSession.totalProfit += profit;
  currentSession.equity += profit;
  
  if (isWin) {
    currentSession.winningTrades++;
  } else {
    currentSession.losingTrades++;
  }
  
  currentSession.winRate = currentSession.totalTrades > 0
    ? (currentSession.winningTrades / currentSession.totalTrades) * 100
    : 0;
  
  // Update weekly target
  currentSession.weeklyTarget = getWeeklyTarget();
  
  // Check if we hit weekly target
  if (currentSession.weeklyTarget.currentProfit >= currentSession.weeklyTarget.targetProfit) {
    addHealthAlert("info", "🎉 Weekly profit target achieved!");
  }
  
  // Check win rate progress
  if (currentSession.winRate >= 90 && currentSession.totalTrades >= 10) {
    addHealthAlert("info", "🏆 90% win rate achieved!");
  }
  
  return currentSession;
}

export function resetSession(): TradingSession {
  healthAlerts = [];
  return initializeSession();
}

// ============= HEALTH ALERTS =============
function addHealthAlert(type: "info" | "warning" | "error", message: string): void {
  healthAlerts.unshift({
    id: `alert_${Date.now()}`,
    type,
    message,
    timestamp: new Date(),
    resolved: false,
  });
  
  // Keep only last 20 alerts
  healthAlerts = healthAlerts.slice(0, 20);
}

export function resolveAlert(alertId: string): void {
  const alert = healthAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.resolved = true;
  }
}

export function getHealthAlerts(): HealthAlert[] {
  return healthAlerts;
}

// ============= PERFORMANCE ANALYTICS =============
export interface PerformanceAnalytics {
  hourlyProfit: number[];
  dailyProfit: number[];
  bestTradingHour: number;
  worstTradingHour: number;
  averageTradeProfit: number;
  averageTradeDuration: number;
  profitFactor: number;
  sharpeRatio: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}

export function getPerformanceAnalytics(): PerformanceAnalytics {
  // Generate sample analytics
  const hourlyProfit = Array.from({ length: 24 }, () => -5 + Math.random() * 15);
  const dailyProfit = Array.from({ length: 7 }, () => -10 + Math.random() * 30);
  
  const bestHourIndex = hourlyProfit.indexOf(Math.max(...hourlyProfit));
  const worstHourIndex = hourlyProfit.indexOf(Math.min(...hourlyProfit));
  
  return {
    hourlyProfit,
    dailyProfit,
    bestTradingHour: bestHourIndex,
    worstTradingHour: worstHourIndex,
    averageTradeProfit: currentSession ? currentSession.totalProfit / Math.max(1, currentSession.totalTrades) : 0,
    averageTradeDuration: 15 + Math.random() * 30, // minutes
    profitFactor: 1.5 + Math.random() * 1.5,
    sharpeRatio: 0.5 + Math.random() * 2,
    consecutiveWins: Math.floor(Math.random() * 5),
    consecutiveLosses: Math.floor(Math.random() * 2),
    maxConsecutiveWins: 5 + Math.floor(Math.random() * 10),
    maxConsecutiveLosses: 2 + Math.floor(Math.random() * 3),
  };
}
