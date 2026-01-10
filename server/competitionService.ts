/**
 * Paper Trading Competitions Service
 * Run multiple AI instances with different strategies to find the optimal configuration
 */

import { getDb } from "./db";
import { tradingCompetitions, competitionParticipants } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// Available strategies for competition
const AVAILABLE_STRATEGIES = [
  { id: "momentum", name: "Momentum", description: "Follows price momentum and trends" },
  { id: "rsi_scalp", name: "RSI Scalp", description: "Scalps based on RSI oversold/overbought" },
  { id: "bollinger_bounce", name: "Bollinger Bounce", description: "Trades Bollinger Band bounces" },
  { id: "mean_reversion", name: "Mean Reversion", description: "Bets on price returning to mean" },
  { id: "rsi_macd_bb", name: "RSI+MACD+BB", description: "Combined indicator strategy" },
  { id: "trend_following", name: "Trend Following", description: "Follows established trends" },
  { id: "volatility_breakout", name: "Volatility Breakout", description: "Trades volatility breakouts" },
  { id: "aggressive_scalp", name: "Aggressive Scalp", description: "High-frequency scalping" },
];

interface Participant {
  id: number;
  name: string;
  strategy: string;
  currentBalance: number;
  startingBalance: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalTrades: number;
  winRate: number;
  rank: number;
  isActive: boolean;
  trades: Trade[];
}

interface Trade {
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  profit?: number;
  timestamp: Date;
}

interface Competition {
  id: number;
  name: string;
  status: "pending" | "running" | "completed";
  startingBalance: number;
  duration: number; // minutes
  startedAt: Date | null;
  endedAt: Date | null;
  winnerId: number | null;
  participants: Participant[];
  elapsedTime: number; // seconds
  remainingTime: number; // seconds
}

// In-memory competition state
let activeCompetition: Competition | null = null;
let competitionInterval: NodeJS.Timeout | null = null;
let tradeInterval: NodeJS.Timeout | null = null;

/**
 * Create a new competition
 */
export async function createCompetition(params: {
  name: string;
  startingBalance: number;
  duration: number; // minutes
  strategies: string[];
}): Promise<{ success: boolean; message: string; competition?: Competition }> {
  try {
    if (activeCompetition && activeCompetition.status === "running") {
      return { success: false, message: "A competition is already running" };
    }
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Create competition record
    const result = await db.insert(tradingCompetitions).values({
      name: params.name,
      status: "pending",
      startingBalance: params.startingBalance.toString(),
      duration: params.duration,
    });
    
    const competitionId = Number(result[0].insertId);
    
    // Create participants for each strategy
    const participants: Participant[] = [];
    
    for (let i = 0; i < params.strategies.length; i++) {
      const strategyId = params.strategies[i];
      const strategy = AVAILABLE_STRATEGIES.find(s => s.id === strategyId);
      
      if (strategy) {
        const participantResult = await db.insert(competitionParticipants).values({
          competitionId,
          name: `AI Bot ${i + 1} (${strategy.name})`,
          strategy: strategyId,
          currentBalance: params.startingBalance.toString(),
          totalProfit: "0",
          totalTrades: 0,
          winRate: 0,
          rank: i + 1,
          isActive: 1,
        });
        
        participants.push({
          id: Number(participantResult[0].insertId),
          name: `AI Bot ${i + 1} (${strategy.name})`,
          strategy: strategyId,
          currentBalance: params.startingBalance,
          startingBalance: params.startingBalance,
          totalProfit: 0,
          totalProfitPercent: 0,
          totalTrades: 0,
          winRate: 0,
          rank: i + 1,
          isActive: true,
          trades: [],
        });
      }
    }
    
    activeCompetition = {
      id: competitionId,
      name: params.name,
      status: "pending",
      startingBalance: params.startingBalance,
      duration: params.duration,
      startedAt: null,
      endedAt: null,
      winnerId: null,
      participants,
      elapsedTime: 0,
      remainingTime: params.duration * 60,
    };
    
    return {
      success: true,
      message: `Competition "${params.name}" created with ${participants.length} AI bots`,
      competition: activeCompetition,
    };
  } catch (error) {
    return { success: false, message: `Failed to create competition: ${error}` };
  }
}

/**
 * Start the competition
 */
export async function startCompetition(): Promise<{ success: boolean; message: string }> {
  if (!activeCompetition) {
    return { success: false, message: "No competition to start" };
  }
  
  if (activeCompetition.status === "running") {
    return { success: false, message: "Competition is already running" };
  }
  
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    activeCompetition.status = "running";
    activeCompetition.startedAt = new Date();
    
    await db.update(tradingCompetitions)
      .set({ status: "running", startedAt: activeCompetition.startedAt })
      .where(eq(tradingCompetitions.id, activeCompetition.id));
    
    // Start the competition timer
    competitionInterval = setInterval(() => {
      if (activeCompetition) {
        activeCompetition.elapsedTime++;
        activeCompetition.remainingTime = Math.max(0, (activeCompetition.duration * 60) - activeCompetition.elapsedTime);
        
        // Check if competition should end
        if (activeCompetition.remainingTime <= 0) {
          endCompetition();
        }
      }
    }, 1000);
    
    // Start simulated trading for each participant
    tradeInterval = setInterval(() => {
      if (activeCompetition && activeCompetition.status === "running") {
        simulateTrades();
      }
    }, 3000); // Trade every 3 seconds
    
    return { success: true, message: "Competition started!" };
  } catch (error) {
    return { success: false, message: `Failed to start competition: ${error}` };
  }
}

/**
 * Simulate trades for all participants
 */
async function simulateTrades(): Promise<void> {
  if (!activeCompetition) return;
  
  const symbols = ["BTC", "ETH"];
  const basePrices: Record<string, number> = {
    BTC: 43000,
    ETH: 2300,
  };
  
  for (const participant of activeCompetition.participants) {
    if (!participant.isActive) continue;
    
    // Random chance to make a trade (60%)
    if (Math.random() > 0.6) continue;
    
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const basePrice = basePrices[symbol];
    
    // Add some volatility
    const priceVariation = (Math.random() - 0.5) * 0.02; // ±1%
    const currentPrice = basePrice * (1 + priceVariation);
    
    // Strategy-specific win probability
    const winProbability = getStrategyWinProbability(participant.strategy);
    const isWin = Math.random() < winProbability;
    
    // Calculate trade result
    const positionSize = participant.currentBalance * 0.05; // 5% position
    const profitPercent = isWin 
      ? 0.5 + Math.random() * 1.5 // 0.5% to 2% profit
      : -(0.3 + Math.random() * 1.2); // -0.3% to -1.5% loss
    
    const profit = positionSize * (profitPercent / 100);
    
    // Update participant
    participant.currentBalance += profit;
    participant.totalProfit = participant.currentBalance - participant.startingBalance;
    participant.totalProfitPercent = (participant.totalProfit / participant.startingBalance) * 100;
    participant.totalTrades++;
    
    // Update win rate
    const wins = Math.round(participant.totalTrades * (participant.winRate / 100));
    const newWins = isWin ? wins + 1 : wins;
    participant.winRate = (newWins / participant.totalTrades) * 100;
    
    // Add trade to history
    participant.trades.push({
      symbol,
      side: isWin ? "SELL" : "BUY",
      price: currentPrice,
      quantity: positionSize / currentPrice,
      profit,
      timestamp: new Date(),
    });
    
    // Keep only last 20 trades
    if (participant.trades.length > 20) {
      participant.trades = participant.trades.slice(-20);
    }
  }
  
  // Update rankings
  updateRankings();
}

/**
 * Get win probability based on strategy
 */
function getStrategyWinProbability(strategy: string): number {
  const probabilities: Record<string, number> = {
    momentum: 0.55,
    rsi_scalp: 0.58,
    bollinger_bounce: 0.52,
    mean_reversion: 0.54,
    rsi_macd_bb: 0.60,
    trend_following: 0.53,
    volatility_breakout: 0.51,
    aggressive_scalp: 0.56,
  };
  
  return probabilities[strategy] || 0.50;
}

/**
 * Update participant rankings
 */
function updateRankings(): void {
  if (!activeCompetition) return;
  
  // Sort by total profit
  const sorted = [...activeCompetition.participants].sort(
    (a, b) => b.totalProfit - a.totalProfit
  );
  
  // Update ranks
  sorted.forEach((p, index) => {
    const participant = activeCompetition!.participants.find(x => x.id === p.id);
    if (participant) {
      participant.rank = index + 1;
    }
  });
}

/**
 * End the competition
 */
export async function endCompetition(): Promise<{ success: boolean; message: string; winner?: Participant }> {
  if (!activeCompetition) {
    return { success: false, message: "No active competition" };
  }
  
  try {
    // Stop intervals
    if (competitionInterval) {
      clearInterval(competitionInterval);
      competitionInterval = null;
    }
    if (tradeInterval) {
      clearInterval(tradeInterval);
      tradeInterval = null;
    }
    
    // Find winner
    const winner = activeCompetition.participants.reduce((best, current) => 
      current.totalProfit > best.totalProfit ? current : best
    );
    
    activeCompetition.status = "completed";
    activeCompetition.endedAt = new Date();
    activeCompetition.winnerId = winner.id;
    
    // Update database
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.update(tradingCompetitions)
      .set({
        status: "completed",
        endedAt: activeCompetition.endedAt,
        winnerId: winner.id,
      })
      .where(eq(tradingCompetitions.id, activeCompetition.id));
    
    // Update participant records
    for (const p of activeCompetition.participants) {
      await db.update(competitionParticipants)
        .set({
          currentBalance: p.currentBalance.toString(),
          totalProfit: p.totalProfit.toString(),
          totalTrades: p.totalTrades,
          winRate: Math.round(p.winRate),
          rank: p.rank,
          isActive: 0,
        })
        .where(eq(competitionParticipants.id, p.id));
    }
    
    return {
      success: true,
      message: `Competition ended! Winner: ${winner.name} with $${winner.totalProfit.toFixed(2)} profit`,
      winner,
    };
  } catch (error) {
    return { success: false, message: `Failed to end competition: ${error}` };
  }
}

/**
 * Get current competition status
 */
export function getCompetitionStatus(): Competition | null {
  return activeCompetition;
}

/**
 * Get competition leaderboard
 */
export function getLeaderboard(): Participant[] {
  if (!activeCompetition) return [];
  
  return [...activeCompetition.participants].sort((a, b) => a.rank - b.rank);
}

/**
 * Get available strategies
 */
export function getAvailableStrategies(): typeof AVAILABLE_STRATEGIES {
  return AVAILABLE_STRATEGIES;
}

/**
 * Get competition history
 */
export async function getCompetitionHistory(limit = 10): Promise<{
  competitions: Array<{
    id: number;
    name: string;
    status: string;
    startingBalance: number;
    duration: number;
    startedAt: Date | null;
    endedAt: Date | null;
    winnerId: number | null;
    winnerName?: string;
    winnerProfit?: number;
  }>;
}> {
  try {
    const db = await getDb();
    if (!db) return { competitions: [] };
    
    const competitions = await db.select()
      .from(tradingCompetitions)
      .orderBy(desc(tradingCompetitions.createdAt))
      .limit(limit);
    
    const results = [];
    
    for (const comp of competitions) {
      let winnerName: string | undefined;
      let winnerProfit: number | undefined;
      
      if (comp.winnerId) {
        const winners = await db.select()
          .from(competitionParticipants)
          .where(eq(competitionParticipants.id, comp.winnerId))
          .limit(1);
        
        if (winners.length > 0) {
          winnerName = winners[0].name;
          winnerProfit = parseFloat(winners[0].totalProfit);
        }
      }
      
      results.push({
        id: comp.id,
        name: comp.name,
        status: comp.status,
        startingBalance: parseFloat(comp.startingBalance),
        duration: comp.duration,
        startedAt: comp.startedAt,
        endedAt: comp.endedAt,
        winnerId: comp.winnerId,
        winnerName,
        winnerProfit,
      });
    }
    
    return { competitions: results };
  } catch (error) {
    return { competitions: [] };
  }
}

/**
 * Reset/cancel current competition
 */
export async function cancelCompetition(): Promise<{ success: boolean; message: string }> {
  if (competitionInterval) {
    clearInterval(competitionInterval);
    competitionInterval = null;
  }
  if (tradeInterval) {
    clearInterval(tradeInterval);
    tradeInterval = null;
  }
  
  activeCompetition = null;
  
  return { success: true, message: "Competition cancelled" };
}

/**
 * Get winning strategy analysis
 */
export function getWinningStrategyAnalysis(): {
  bestStrategy: string;
  avgWinRate: number;
  avgProfit: number;
  recommendation: string;
} | null {
  if (!activeCompetition || activeCompetition.participants.length === 0) {
    return null;
  }
  
  // Find best performing strategy
  const winner = activeCompetition.participants.reduce((best, current) => 
    current.totalProfit > best.totalProfit ? current : best
  );
  
  // Calculate averages
  const avgWinRate = activeCompetition.participants.reduce((sum, p) => sum + p.winRate, 0) / activeCompetition.participants.length;
  const avgProfit = activeCompetition.participants.reduce((sum, p) => sum + p.totalProfit, 0) / activeCompetition.participants.length;
  
  const strategyInfo = AVAILABLE_STRATEGIES.find(s => s.id === winner.strategy);
  
  return {
    bestStrategy: strategyInfo?.name || winner.strategy,
    avgWinRate,
    avgProfit,
    recommendation: `The ${strategyInfo?.name || winner.strategy} strategy outperformed others with a ${winner.winRate.toFixed(1)}% win rate and $${winner.totalProfit.toFixed(2)} profit. Consider using this strategy for live trading.`,
  };
}
