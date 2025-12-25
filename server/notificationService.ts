/**
 * Email/SMS Notification Service
 * Sends alerts to users via email, SMS (webhook), or other channels
 */

import { getDb } from "./db";
import { notificationPreferences, notificationLog, tradeAlerts } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// Default email for George
const DEFAULT_EMAIL = "george_randall1@hotmail.com";

interface NotificationPrefs {
  id: number;
  email: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  phoneNumber: string | null;
  webhookUrl: string | null;
  alertOnOpportunity: boolean;
  alertOnProfit: boolean;
  alertOnLoss: boolean;
  alertOnRisk: boolean;
  minConfidence: number;
}

interface AlertData {
  id?: number;
  symbol: string;
  alertType: "opportunity" | "risk" | "profit" | "loss" | "pattern";
  strategy: string;
  confidence: number;
  message: string;
  price: string;
}

// In-memory preferences cache
let prefsCache: NotificationPrefs | null = null;
let lastPrefsFetch = 0;
const PREFS_CACHE_TTL = 60000; // 1 minute

// Notification queue for batching
const notificationQueue: AlertData[] = [];
let isProcessingQueue = false;

/**
 * Get or create notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPrefs> {
  const now = Date.now();
  if (prefsCache && now - lastPrefsFetch < PREFS_CACHE_TTL) {
    return prefsCache;
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const prefs = await db.select().from(notificationPreferences).limit(1);
    
    if (prefs.length > 0) {
      prefsCache = {
        id: prefs[0].id,
        email: prefs[0].email,
        emailEnabled: prefs[0].emailEnabled === 1,
        smsEnabled: prefs[0].smsEnabled === 1,
        phoneNumber: prefs[0].phoneNumber,
        webhookUrl: prefs[0].webhookUrl,
        alertOnOpportunity: prefs[0].alertOnOpportunity === 1,
        alertOnProfit: prefs[0].alertOnProfit === 1,
        alertOnLoss: prefs[0].alertOnLoss === 1,
        alertOnRisk: prefs[0].alertOnRisk === 1,
        minConfidence: prefs[0].minConfidence,
      };
      lastPrefsFetch = now;
      return prefsCache;
    }
    
    // Create default preferences
    const result = await db.insert(notificationPreferences).values({
      email: DEFAULT_EMAIL,
      emailEnabled: 1,
      smsEnabled: 0,
      alertOnOpportunity: 1,
      alertOnProfit: 1,
      alertOnLoss: 1,
      alertOnRisk: 1,
      minConfidence: 80,
    });
    
    prefsCache = {
      id: Number(result[0].insertId),
      email: DEFAULT_EMAIL,
      emailEnabled: true,
      smsEnabled: false,
      phoneNumber: null,
      webhookUrl: null,
      alertOnOpportunity: true,
      alertOnProfit: true,
      alertOnLoss: true,
      alertOnRisk: true,
      minConfidence: 80,
    };
    lastPrefsFetch = now;
    return prefsCache;
  } catch (error) {
    // Return default if DB fails
    return {
      id: 0,
      email: DEFAULT_EMAIL,
      emailEnabled: true,
      smsEnabled: false,
      phoneNumber: null,
      webhookUrl: null,
      alertOnOpportunity: true,
      alertOnProfit: true,
      alertOnLoss: true,
      alertOnRisk: true,
      minConfidence: 80,
    };
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(updates: Partial<{
  email: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  phoneNumber: string;
  webhookUrl: string;
  alertOnOpportunity: boolean;
  alertOnProfit: boolean;
  alertOnLoss: boolean;
  alertOnRisk: boolean;
  minConfidence: number;
}>): Promise<{ success: boolean; message: string }> {
  try {
    const prefs = await getNotificationPreferences();
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const updateData: Record<string, unknown> = {};
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.emailEnabled !== undefined) updateData.emailEnabled = updates.emailEnabled ? 1 : 0;
    if (updates.smsEnabled !== undefined) updateData.smsEnabled = updates.smsEnabled ? 1 : 0;
    if (updates.phoneNumber !== undefined) updateData.phoneNumber = updates.phoneNumber;
    if (updates.webhookUrl !== undefined) updateData.webhookUrl = updates.webhookUrl;
    if (updates.alertOnOpportunity !== undefined) updateData.alertOnOpportunity = updates.alertOnOpportunity ? 1 : 0;
    if (updates.alertOnProfit !== undefined) updateData.alertOnProfit = updates.alertOnProfit ? 1 : 0;
    if (updates.alertOnLoss !== undefined) updateData.alertOnLoss = updates.alertOnLoss ? 1 : 0;
    if (updates.alertOnRisk !== undefined) updateData.alertOnRisk = updates.alertOnRisk ? 1 : 0;
    if (updates.minConfidence !== undefined) updateData.minConfidence = updates.minConfidence;
    
    await db.update(notificationPreferences)
      .set(updateData)
      .where(eq(notificationPreferences.id, prefs.id));
    
    // Clear cache
    prefsCache = null;
    
    return { success: true, message: "Preferences updated successfully" };
  } catch (error) {
    return { success: false, message: `Failed to update preferences: ${error}` };
  }
}

/**
 * Check if an alert should trigger a notification
 */
export async function shouldNotify(alert: AlertData): Promise<boolean> {
  const prefs = await getNotificationPreferences();
  
  // Check confidence threshold
  if (alert.confidence < prefs.minConfidence) {
    return false;
  }
  
  // Check alert type preferences
  switch (alert.alertType) {
    case "opportunity":
      return prefs.alertOnOpportunity;
    case "profit":
      return prefs.alertOnProfit;
    case "loss":
      return prefs.alertOnLoss;
    case "risk":
      return prefs.alertOnRisk;
    case "pattern":
      return prefs.alertOnOpportunity; // Patterns are opportunities
    default:
      return true;
  }
}

/**
 * Send email notification (simulated - logs to console and DB)
 * In production, integrate with SendGrid, AWS SES, etc.
 */
async function sendEmail(to: string, subject: string, body: string, alertId: number): Promise<boolean> {
  try {
    console.log(`📧 EMAIL NOTIFICATION to ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);
    
    // Log to database
    const db = await getDb();
    if (db) {
      await db.insert(notificationLog).values({
        alertId,
        channel: "email",
        recipient: to,
        status: "sent",
      });
    }
    
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    
    try {
      const db = await getDb();
      if (db) {
        await db.insert(notificationLog).values({
          alertId,
          channel: "email",
          recipient: to,
          status: "failed",
          errorMessage: String(error),
        });
      }
    } catch {}
    
    return false;
  }
}

/**
 * Send SMS notification via webhook (simulated)
 * In production, integrate with Twilio, etc.
 */
async function sendSMS(to: string, message: string, alertId: number): Promise<boolean> {
  try {
    console.log(`📱 SMS NOTIFICATION to ${to}`);
    console.log(`   Message: ${message}`);
    
    // Log to database
    const db = await getDb();
    if (db) {
      await db.insert(notificationLog).values({
        alertId,
        channel: "sms",
        recipient: to,
        status: "sent",
      });
    }
    
    return true;
  } catch (error) {
    console.error("SMS send failed:", error);
    return false;
  }
}

/**
 * Send webhook notification
 */
async function sendWebhook(url: string, data: AlertData, alertId: number): Promise<boolean> {
  try {
    console.log(`🔗 WEBHOOK NOTIFICATION to ${url}`);
    console.log(`   Data:`, JSON.stringify(data));
    
    // In production, actually POST to the webhook URL
    // await fetch(url, { method: 'POST', body: JSON.stringify(data) });
    
    // Log to database
    const db = await getDb();
    if (db) {
      await db.insert(notificationLog).values({
        alertId,
        channel: "webhook",
        recipient: url,
        status: "sent",
      });
    }
    
    return true;
  } catch (error) {
    console.error("Webhook send failed:", error);
    return false;
  }
}

/**
 * Send notification for an alert
 */
export async function sendNotification(alert: AlertData): Promise<{
  sent: boolean;
  channels: string[];
}> {
  const channels: string[] = [];
  
  // Check if we should notify
  if (!(await shouldNotify(alert))) {
    return { sent: false, channels: [] };
  }
  
  const prefs = await getNotificationPreferences();
  const alertId = alert.id || 0;
  
  // Format the message
  const emoji = getAlertEmoji(alert.alertType);
  const subject = `${emoji} ${alert.alertType.toUpperCase()}: ${alert.symbol} - ${alert.strategy}`;
  const body = `
${alert.message}

Symbol: ${alert.symbol}
Strategy: ${alert.strategy}
Confidence: ${alert.confidence}%
Price: $${alert.price}
Time: ${new Date().toLocaleString()}

- George's Trade Bot
  `.trim();
  
  // Send email
  if (prefs.emailEnabled && prefs.email) {
    const sent = await sendEmail(prefs.email, subject, body, alertId);
    if (sent) channels.push("email");
  }
  
  // Send SMS
  if (prefs.smsEnabled && prefs.phoneNumber) {
    const smsMessage = `${emoji} ${alert.symbol} ${alert.alertType}: ${alert.message.substring(0, 100)}`;
    const sent = await sendSMS(prefs.phoneNumber, smsMessage, alertId);
    if (sent) channels.push("sms");
  }
  
  // Send webhook
  if (prefs.webhookUrl) {
    const sent = await sendWebhook(prefs.webhookUrl, alert, alertId);
    if (sent) channels.push("webhook");
  }
  
  return { sent: channels.length > 0, channels };
}

/**
 * Queue a notification for batched sending
 */
export function queueNotification(alert: AlertData): void {
  notificationQueue.push(alert);
  processNotificationQueue();
}

/**
 * Process the notification queue
 */
async function processNotificationQueue(): Promise<void> {
  if (isProcessingQueue || notificationQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  try {
    while (notificationQueue.length > 0) {
      const alert = notificationQueue.shift();
      if (alert) {
        await sendNotification(alert);
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Get emoji for alert type
 */
function getAlertEmoji(alertType: string): string {
  switch (alertType) {
    case "opportunity": return "⚡";
    case "profit": return "💰";
    case "loss": return "📉";
    case "risk": return "⚠️";
    case "pattern": return "🔍";
    default: return "🔔";
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(limit = 50): Promise<{
  logs: Array<{
    id: number;
    alertId: number;
    channel: string;
    recipient: string;
    status: string;
    errorMessage: string | null;
    sentAt: Date;
  }>;
}> {
  try {
    const db = await getDb();
    if (!db) return { logs: [] };
    const logs = await db.select()
      .from(notificationLog)
      .orderBy(desc(notificationLog.sentAt))
      .limit(limit);
    
    return { logs };
  } catch (error) {
    return { logs: [] };
  }
}

/**
 * Get notification stats
 */
export async function getNotificationStats(): Promise<{
  totalSent: number;
  byChannel: Record<string, number>;
  successRate: number;
}> {
  try {
    const db = await getDb();
    if (!db) return { totalSent: 0, byChannel: {}, successRate: 100 };
    const logs = await db.select().from(notificationLog);
    
    const byChannel: Record<string, number> = { email: 0, sms: 0, webhook: 0 };
    let successCount = 0;
    
    for (const log of logs) {
      byChannel[log.channel] = (byChannel[log.channel] || 0) + 1;
      if (log.status === "sent") successCount++;
    }
    
    return {
      totalSent: logs.length,
      byChannel,
      successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 100,
    };
  } catch (error) {
    return { totalSent: 0, byChannel: {}, successRate: 100 };
  }
}

/**
 * Test notification system
 */
export async function testNotification(): Promise<{ success: boolean; message: string }> {
  const testAlert: AlertData = {
    symbol: "BTC",
    alertType: "opportunity",
    strategy: "test",
    confidence: 100,
    message: "This is a test notification from George's Trade Bot",
    price: "43000.00",
  };
  
  const result = await sendNotification(testAlert);
  
  if (result.sent) {
    return { success: true, message: `Test notification sent via: ${result.channels.join(", ")}` };
  } else {
    return { success: false, message: "No notifications were sent. Check your preferences." };
  }
}
