/**
 * Portfolio Diversification Service
 * Tracks multi-coin portfolio and provides allocation recommendations
 */

import { getDb } from "./db";
import { portfolioHoldings } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// Supported coins with their risk profiles
const COIN_PROFILES: Record<string, {
  name: string;
  riskLevel: "low" | "medium" | "high";
  category: "major" | "altcoin" | "meme";
  recommendedAllocation: number; // percentage
}> = {
  BTC: { name: "Bitcoin", riskLevel: "low", category: "major", recommendedAllocation: 60 },
  ETH: { name: "Ethereum", riskLevel: "low", category: "major", recommendedAllocation: 40 },
};

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  allocationPercent: number;
  targetAllocation: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: PortfolioHolding[];
  diversificationScore: number; // 0-100
  riskScore: number; // 0-100
}

interface RebalanceRecommendation {
  symbol: string;
  action: "buy" | "sell" | "hold";
  currentAllocation: number;
  targetAllocation: number;
  difference: number;
  amountToTrade: number;
  reason: string;
}

// In-memory portfolio state (synced with DB)
let portfolioState: Map<string, PortfolioHolding> = new Map();
let lastSyncTime = 0;
const SYNC_INTERVAL = 30000; // 30 seconds

/**
 * Initialize portfolio with starting balance
 */
export async function initializePortfolio(startingBalance: number): Promise<{
  success: boolean;
  message: string;
  portfolio: PortfolioSummary;
}> {
  try {
    // Clear existing holdings
    portfolioState.clear();
    
    // Create initial diversified portfolio based on recommended allocations
    const holdings: PortfolioHolding[] = [];
    
    for (const [symbol, profile] of Object.entries(COIN_PROFILES)) {
      const allocation = profile.recommendedAllocation / 100;
      const value = startingBalance * allocation;
      
      holdings.push({
        symbol,
        quantity: 0, // Will be calculated based on current prices
        avgEntryPrice: 0,
        currentValue: value,
        profitLoss: 0,
        profitLossPercent: 0,
        allocationPercent: profile.recommendedAllocation,
        targetAllocation: profile.recommendedAllocation,
      });
      
      portfolioState.set(symbol, holdings[holdings.length - 1]);
    }
    
    // Save to database
    await syncToDatabase();
    
    const summary = calculatePortfolioSummary();
    
    return {
      success: true,
      message: `Portfolio initialized with $${startingBalance} across ${holdings.length} coins`,
      portfolio: summary,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize portfolio: ${error}`,
      portfolio: calculatePortfolioSummary(),
    };
  }
}

/**
 * Update portfolio with current prices
 */
export async function updatePortfolioPrices(prices: Record<string, number>): Promise<PortfolioSummary> {
  let totalValue = 0;
  
  for (const [symbol, holding] of Array.from(portfolioState.entries())) {
    const currentPrice = prices[symbol] || holding.avgEntryPrice;
    
    if (holding.quantity > 0) {
      holding.currentValue = holding.quantity * currentPrice;
      const cost = holding.quantity * holding.avgEntryPrice;
      holding.profitLoss = holding.currentValue - cost;
      holding.profitLossPercent = cost > 0 ? (holding.profitLoss / cost) * 100 : 0;
    }
    
    totalValue += holding.currentValue;
  }
  
  // Update allocation percentages
  for (const holding of Array.from(portfolioState.values())) {
    holding.allocationPercent = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
  }
  
  return calculatePortfolioSummary();
}

/**
 * Add to a position
 */
export async function addPosition(
  symbol: string,
  quantity: number,
  price: number
): Promise<{ success: boolean; message: string }> {
  try {
    let holding = portfolioState.get(symbol);
    
    if (!holding) {
      holding = {
        symbol,
        quantity: 0,
        avgEntryPrice: 0,
        currentValue: 0,
        profitLoss: 0,
        profitLossPercent: 0,
        allocationPercent: 0,
        targetAllocation: COIN_PROFILES[symbol]?.recommendedAllocation || 5,
      };
      portfolioState.set(symbol, holding);
    }
    
    // Calculate new average entry price
    const totalCost = (holding.quantity * holding.avgEntryPrice) + (quantity * price);
    const totalQuantity = holding.quantity + quantity;
    
    holding.quantity = totalQuantity;
    holding.avgEntryPrice = totalQuantity > 0 ? totalCost / totalQuantity : price;
    holding.currentValue = totalQuantity * price;
    
    await syncToDatabase();
    
    return { success: true, message: `Added ${quantity} ${symbol} at $${price}` };
  } catch (error) {
    return { success: false, message: `Failed to add position: ${error}` };
  }
}

/**
 * Remove from a position
 */
export async function removePosition(
  symbol: string,
  quantity: number,
  price: number
): Promise<{ success: boolean; message: string; profit: number }> {
  try {
    const holding = portfolioState.get(symbol);
    
    if (!holding || holding.quantity < quantity) {
      return { success: false, message: "Insufficient quantity", profit: 0 };
    }
    
    const profit = (price - holding.avgEntryPrice) * quantity;
    holding.quantity -= quantity;
    holding.currentValue = holding.quantity * price;
    
    if (holding.quantity === 0) {
      holding.avgEntryPrice = 0;
      holding.profitLoss = 0;
      holding.profitLossPercent = 0;
    }
    
    await syncToDatabase();
    
    return { success: true, message: `Sold ${quantity} ${symbol} at $${price}`, profit };
  } catch (error) {
    return { success: false, message: `Failed to remove position: ${error}`, profit: 0 };
  }
}

/**
 * Calculate portfolio summary
 */
function calculatePortfolioSummary(): PortfolioSummary {
  let totalValue = 0;
  let totalCost = 0;
  const holdings: PortfolioHolding[] = [];
  
  for (const holding of Array.from(portfolioState.values())) {
    totalValue += holding.currentValue;
    totalCost += holding.quantity * holding.avgEntryPrice;
    holdings.push({ ...holding });
  }
  
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
  
  // Calculate diversification score (0-100)
  // Higher score = more diversified
  const diversificationScore = calculateDiversificationScore(holdings, totalValue);
  
  // Calculate risk score (0-100)
  // Higher score = higher risk
  const riskScore = calculateRiskScore(holdings, totalValue);
  
  return {
    totalValue,
    totalCost,
    totalProfitLoss,
    totalProfitLossPercent,
    holdings: holdings.sort((a, b) => b.currentValue - a.currentValue),
    diversificationScore,
    riskScore,
  };
}

/**
 * Calculate diversification score
 */
function calculateDiversificationScore(holdings: PortfolioHolding[], totalValue: number): number {
  if (totalValue === 0 || holdings.length === 0) return 0;
  
  // Ideal: no single asset > 40%, at least 4 assets with > 5% each
  let score = 100;
  
  // Penalize concentration
  for (const holding of holdings) {
    if (holding.allocationPercent > 50) score -= 30;
    else if (holding.allocationPercent > 40) score -= 15;
  }
  
  // Reward having multiple assets
  const significantHoldings = holdings.filter(h => h.allocationPercent > 5).length;
  if (significantHoldings < 3) score -= 20;
  else if (significantHoldings >= 5) score += 10;
  
  // Check category diversification
  const categories = new Set(holdings.filter(h => h.allocationPercent > 5).map(h => COIN_PROFILES[h.symbol]?.category));
  if (categories.size < 2) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate risk score
 */
function calculateRiskScore(holdings: PortfolioHolding[], totalValue: number): number {
  if (totalValue === 0) return 50;
  
  let weightedRisk = 0;
  
  for (const holding of holdings) {
    const profile = COIN_PROFILES[holding.symbol];
    const riskValue = profile?.riskLevel === "high" ? 100 : profile?.riskLevel === "medium" ? 50 : 20;
    weightedRisk += (holding.allocationPercent / 100) * riskValue;
  }
  
  return Math.round(weightedRisk);
}

/**
 * Get rebalancing recommendations
 */
export function getRebalanceRecommendations(totalValue: number): RebalanceRecommendation[] {
  const recommendations: RebalanceRecommendation[] = [];
  
  for (const [symbol, holding] of Array.from(portfolioState.entries())) {
    const profile = COIN_PROFILES[symbol];
    const targetAllocation = profile?.recommendedAllocation || holding.targetAllocation;
    const difference = holding.allocationPercent - targetAllocation;
    
    if (Math.abs(difference) > 3) { // Only recommend if > 3% off target
      const amountToTrade = Math.abs(difference / 100) * totalValue;
      
      recommendations.push({
        symbol,
        action: difference > 0 ? "sell" : "buy",
        currentAllocation: holding.allocationPercent,
        targetAllocation,
        difference,
        amountToTrade,
        reason: difference > 0 
          ? `Overweight by ${difference.toFixed(1)}%`
          : `Underweight by ${Math.abs(difference).toFixed(1)}%`,
      });
    }
  }
  
  // Sort by absolute difference (most urgent first)
  return recommendations.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
}

/**
 * Get portfolio summary
 */
export function getPortfolioSummary(): PortfolioSummary {
  return calculatePortfolioSummary();
}

/**
 * Sync portfolio to database
 */
async function syncToDatabase(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    
    // Clear existing holdings
    await db.delete(portfolioHoldings);
    
    // Insert current holdings
    for (const holding of Array.from(portfolioState.values())) {
      if (holding.currentValue > 0 || holding.quantity > 0) {
        await db.insert(portfolioHoldings).values({
          symbol: holding.symbol,
          quantity: holding.quantity.toString(),
          avgEntryPrice: holding.avgEntryPrice.toString(),
          currentValue: holding.currentValue.toString(),
          profitLoss: holding.profitLoss.toString(),
          profitLossPercent: holding.profitLossPercent.toString(),
          allocationPercent: holding.allocationPercent.toString(),
          targetAllocation: holding.targetAllocation.toString(),
        });
      }
    }
    
    lastSyncTime = Date.now();
  } catch (error) {
    console.error("Failed to sync portfolio to database:", error);
  }
}

/**
 * Load portfolio from database
 */
export async function loadPortfolioFromDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, message: "Database not available" };
    
    const holdings = await db.select().from(portfolioHoldings);
    
    portfolioState.clear();
    
    for (const h of holdings) {
      portfolioState.set(h.symbol, {
        symbol: h.symbol,
        quantity: parseFloat(h.quantity),
        avgEntryPrice: parseFloat(h.avgEntryPrice),
        currentValue: parseFloat(h.currentValue),
        profitLoss: parseFloat(h.profitLoss),
        profitLossPercent: parseFloat(h.profitLossPercent),
        allocationPercent: parseFloat(h.allocationPercent),
        targetAllocation: parseFloat(h.targetAllocation),
      });
    }
    
    return { success: true, message: `Loaded ${holdings.length} holdings from database` };
  } catch (error) {
    return { success: false, message: `Failed to load portfolio: ${error}` };
  }
}

/**
 * Set target allocation for a symbol
 */
export async function setTargetAllocation(symbol: string, targetPercent: number): Promise<{
  success: boolean;
  message: string;
}> {
  const holding = portfolioState.get(symbol);
  
  if (!holding) {
    return { success: false, message: `Symbol ${symbol} not in portfolio` };
  }
  
  holding.targetAllocation = targetPercent;
  await syncToDatabase();
  
  return { success: true, message: `Target allocation for ${symbol} set to ${targetPercent}%` };
}

/**
 * Get allocation chart data
 */
export function getAllocationChartData(): Array<{
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}> {
  const colors: Record<string, string> = {
    BTC: "#F7931A",
    ETH: "#627EEA",
    SOL: "#00FFA3",
    ADA: "#0033AD",
    XRP: "#23292F",
    DOGE: "#C2A633",
  };
  
  const data = [];
  
  for (const holding of Array.from(portfolioState.values())) {
    if (holding.currentValue > 0) {
      data.push({
        symbol: holding.symbol,
        name: COIN_PROFILES[holding.symbol]?.name || holding.symbol,
        value: holding.currentValue,
        percentage: holding.allocationPercent,
        color: colors[holding.symbol] || "#888888",
      });
    }
  }
  
  return data.sort((a, b) => b.value - a.value);
}

/**
 * Reset portfolio
 */
export async function resetPortfolio(): Promise<{ success: boolean; message: string }> {
  portfolioState.clear();
  
  try {
    const db = await getDb();
    if (db) {
      await db.delete(portfolioHoldings);
    }
  } catch {}
  
  return { success: true, message: "Portfolio reset" };
}
