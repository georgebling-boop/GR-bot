/**
 * Trade Alerts Service
 * Real-time notifications for trading opportunities and events
 */

import { getDb } from "./db";
import { tradeAlerts } from "../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import {
  getEntryConfidence,
  getBrainState,
  type MarketState,
  type IndicatorSnapshot,
} from "./continuousLearningAI";

export type AlertType = "opportunity" | "risk" | "profit" | "loss" | "pattern";

export interface TradeAlert {
  id?: number;
  symbol: string;
  alertType: AlertType;
  strategy: string;
  confidence: number;
  message: string;
  price: string;
  isRead: boolean;
  createdAt: Date;
}

// In-memory alert queue for real-time notifications
let alertQueue: TradeAlert[] = [];
const MAX_QUEUE_SIZE = 100;

// Alert thresholds
const OPPORTUNITY_CONFIDENCE_THRESHOLD = 75;
const RISK_ALERT_DRAWDOWN_THRESHOLD = 5;
const PATTERN_ALERT_CONFIDENCE = 80;

/**
 * Create a new trade alert
 */
export async function createAlert(alert: Omit<TradeAlert, "id" | "createdAt" | "isRead">): Promise<TradeAlert> {
  const newAlert: TradeAlert = {
    ...alert,
    isRead: false,
    createdAt: new Date(),
  };

  // Add to in-memory queue
  alertQueue.unshift(newAlert);
  if (alertQueue.length > MAX_QUEUE_SIZE) {
    alertQueue = alertQueue.slice(0, MAX_QUEUE_SIZE);
  }

  // Save to database
  try {
    const db = await getDb();
    if (db) {
      const result = await db.insert(tradeAlerts).values({
        symbol: alert.symbol,
        alertType: alert.alertType,
        strategy: alert.strategy,
        confidence: alert.confidence,
        message: alert.message,
        price: alert.price,
        isRead: 0,
      });
      newAlert.id = Number(result[0].insertId);
    }
  } catch (error) {
    console.error("Failed to save alert to database:", error);
  }

  console.log(`[TradeAlerts] New ${alert.alertType} alert: ${alert.message}`);
  return newAlert;
}

/**
 * Check for high-confidence trading opportunities
 */
export async function checkForOpportunities(
  symbol: string,
  currentPrice: number,
  marketState: MarketState,
  indicators: IndicatorSnapshot
): Promise<TradeAlert | null> {
  const brain = getBrainState();
  
  // Check each strategy for opportunities
  const strategies = Object.keys(brain.strategyWeights);
  
  for (const strategy of strategies) {
    const confidence = getEntryConfidence(symbol, strategy, marketState, indicators);
    
    if (confidence.shouldEnter && confidence.confidence >= OPPORTUNITY_CONFIDENCE_THRESHOLD) {
      const alert = await createAlert({
        symbol,
        alertType: "opportunity",
        strategy,
        confidence: confidence.confidence,
        message: `High-confidence ${strategy} opportunity detected for ${symbol}. ${confidence.reasons.join(". ")}`,
        price: currentPrice.toFixed(4),
      });
      return alert;
    }
  }
  
  return null;
}

/**
 * Create a profit alert when a trade closes profitably
 */
export async function createProfitAlert(
  symbol: string,
  strategy: string,
  profit: number,
  profitPercent: number,
  exitPrice: number
): Promise<TradeAlert> {
  return createAlert({
    symbol,
    alertType: "profit",
    strategy,
    confidence: 100,
    message: `Take profit hit! ${symbol} closed with +$${profit.toFixed(2)} (+${profitPercent.toFixed(2)}%)`,
    price: exitPrice.toFixed(4),
  });
}

/**
 * Create a loss alert when a trade closes at a loss
 */
export async function createLossAlert(
  symbol: string,
  strategy: string,
  loss: number,
  lossPercent: number,
  exitPrice: number
): Promise<TradeAlert> {
  return createAlert({
    symbol,
    alertType: "loss",
    strategy,
    confidence: 100,
    message: `Stop loss triggered! ${symbol} closed with -$${Math.abs(loss).toFixed(2)} (${lossPercent.toFixed(2)}%)`,
    price: exitPrice.toFixed(4),
  });
}

/**
 * Create a risk alert when drawdown exceeds threshold
 */
export async function createRiskAlert(
  currentDrawdown: number,
  maxDrawdown: number,
  equity: number
): Promise<TradeAlert> {
  return createAlert({
    symbol: "PORTFOLIO",
    alertType: "risk",
    strategy: "risk_management",
    confidence: Math.min(100, Math.round(currentDrawdown / maxDrawdown * 100)),
    message: `Risk alert! Drawdown at ${currentDrawdown.toFixed(2)}% (max: ${maxDrawdown}%). Current equity: $${equity.toFixed(2)}`,
    price: equity.toFixed(2),
  });
}

/**
 * Create a pattern alert when AI detects a significant pattern
 */
export async function createPatternAlert(
  symbol: string,
  patternName: string,
  confidence: number,
  description: string,
  currentPrice: number
): Promise<TradeAlert> {
  return createAlert({
    symbol,
    alertType: "pattern",
    strategy: patternName,
    confidence,
    message: `Pattern detected: ${patternName} on ${symbol}. ${description}`,
    price: currentPrice.toFixed(4),
  });
}

/**
 * Get recent alerts from memory and database
 */
export async function getRecentAlerts(limit: number = 20): Promise<TradeAlert[]> {
  try {
    const db = await getDb();
    if (!db) {
      return alertQueue.slice(0, limit);
    }

    const dbAlerts = await db
      .select()
      .from(tradeAlerts)
      .orderBy(desc(tradeAlerts.createdAt))
      .limit(limit);

    return dbAlerts.map(a => ({
      id: a.id,
      symbol: a.symbol,
      alertType: a.alertType as AlertType,
      strategy: a.strategy,
      confidence: a.confidence,
      message: a.message,
      price: a.price,
      isRead: a.isRead === 1,
      createdAt: a.createdAt,
    }));
  } catch (error) {
    console.error("Failed to get alerts from database:", error);
    return alertQueue.slice(0, limit);
  }
}

/**
 * Get unread alerts count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      return alertQueue.filter(a => !a.isRead).length;
    }

    const result = await db
      .select()
      .from(tradeAlerts)
      .where(eq(tradeAlerts.isRead, 0));

    return result.length;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      const alert = alertQueue.find(a => a.id === alertId);
      if (alert) {
        alert.isRead = true;
        return true;
      }
      return false;
    }

    await db
      .update(tradeAlerts)
      .set({ isRead: 1 })
      .where(eq(tradeAlerts.id, alertId));

    return true;
  } catch (error) {
    console.error("Failed to mark alert as read:", error);
    return false;
  }
}

/**
 * Mark all alerts as read
 */
export async function markAllAlertsAsRead(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      alertQueue.forEach(a => a.isRead = true);
      return true;
    }

    await db
      .update(tradeAlerts)
      .set({ isRead: 1 })
      .where(eq(tradeAlerts.isRead, 0));

    alertQueue.forEach(a => a.isRead = true);
    return true;
  } catch (error) {
    console.error("Failed to mark all alerts as read:", error);
    return false;
  }
}

/**
 * Get alerts by type
 */
export async function getAlertsByType(alertType: AlertType, limit: number = 20): Promise<TradeAlert[]> {
  try {
    const db = await getDb();
    if (!db) {
      return alertQueue.filter(a => a.alertType === alertType).slice(0, limit);
    }

    const dbAlerts = await db
      .select()
      .from(tradeAlerts)
      .where(eq(tradeAlerts.alertType, alertType))
      .orderBy(desc(tradeAlerts.createdAt))
      .limit(limit);

    return dbAlerts.map(a => ({
      id: a.id,
      symbol: a.symbol,
      alertType: a.alertType as AlertType,
      strategy: a.strategy,
      confidence: a.confidence,
      message: a.message,
      price: a.price,
      isRead: a.isRead === 1,
      createdAt: a.createdAt,
    }));
  } catch (error) {
    console.error("Failed to get alerts by type:", error);
    return [];
  }
}

/**
 * Get alerts from the last N hours
 */
export async function getAlertsFromLastHours(hours: number): Promise<TradeAlert[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  try {
    const db = await getDb();
    if (!db) {
      return alertQueue.filter(a => a.createdAt >= cutoff);
    }

    const dbAlerts = await db
      .select()
      .from(tradeAlerts)
      .where(gte(tradeAlerts.createdAt, cutoff))
      .orderBy(desc(tradeAlerts.createdAt));

    return dbAlerts.map(a => ({
      id: a.id,
      symbol: a.symbol,
      alertType: a.alertType as AlertType,
      strategy: a.strategy,
      confidence: a.confidence,
      message: a.message,
      price: a.price,
      isRead: a.isRead === 1,
      createdAt: a.createdAt,
    }));
  } catch (error) {
    console.error("Failed to get alerts from last hours:", error);
    return [];
  }
}

/**
 * Clear old alerts (older than 7 days)
 */
export async function clearOldAlerts(): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  try {
    const db = await getDb();
    if (!db) {
      const oldCount = alertQueue.filter(a => a.createdAt < cutoff).length;
      alertQueue = alertQueue.filter(a => a.createdAt >= cutoff);
      return oldCount;
    }

    // Note: This would need a proper delete with condition
    // For now, we just clear the in-memory queue
    const oldCount = alertQueue.filter(a => a.createdAt < cutoff).length;
    alertQueue = alertQueue.filter(a => a.createdAt >= cutoff);
    return oldCount;
  } catch (error) {
    console.error("Failed to clear old alerts:", error);
    return 0;
  }
}

/**
 * Get alert statistics
 */
export async function getAlertStats(): Promise<{
  total: number;
  unread: number;
  byType: Record<AlertType, number>;
  last24h: number;
}> {
  const alerts = await getRecentAlerts(1000);
  const unread = alerts.filter(a => !a.isRead).length;
  const last24h = alerts.filter(a => 
    a.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  const byType: Record<AlertType, number> = {
    opportunity: 0,
    risk: 0,
    profit: 0,
    loss: 0,
    pattern: 0,
  };

  alerts.forEach(a => {
    byType[a.alertType]++;
  });

  return {
    total: alerts.length,
    unread,
    byType,
    last24h,
  };
}
