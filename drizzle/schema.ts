import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// AI Brain State - Persists the continuous learning AI's memory
export const aiBrainState = mysqlTable("ai_brain_state", {
  id: int("id").autoincrement().primaryKey(),
  version: int("version").notNull().default(1),
  brainData: text("brainData").notNull(), // JSON serialized brain state
  totalCycles: int("totalCycles").notNull().default(0),
  totalTrades: int("totalTrades").notNull().default(0),
  winRate: int("winRate").notNull().default(50), // Stored as percentage * 100
  patternsLearned: int("patternsLearned").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIBrainState = typeof aiBrainState.$inferSelect;
export type InsertAIBrainState = typeof aiBrainState.$inferInsert;

// Trade Alerts - Real-time notifications for trading opportunities
export const tradeAlerts = mysqlTable("trade_alerts", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  alertType: mysqlEnum("alertType", ["opportunity", "risk", "profit", "loss", "pattern"]).notNull(),
  strategy: varchar("strategy", { length: 64 }).notNull(),
  confidence: int("confidence").notNull(), // 0-100
  message: text("message").notNull(),
  price: varchar("price", { length: 32 }).notNull(),
  isRead: int("isRead").notNull().default(0), // 0 = unread, 1 = read
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TradeAlert = typeof tradeAlerts.$inferSelect;
export type InsertTradeAlert = typeof tradeAlerts.$inferInsert;

// Backtesting Results - Historical strategy performance
export const backtestResults = mysqlTable("backtest_results", {
  id: int("id").autoincrement().primaryKey(),
  strategy: varchar("strategy", { length: 64 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  totalTrades: int("totalTrades").notNull(),
  winningTrades: int("winningTrades").notNull(),
  losingTrades: int("losingTrades").notNull(),
  winRate: int("winRate").notNull(), // Stored as percentage * 100
  totalProfit: varchar("totalProfit", { length: 32 }).notNull(),
  maxDrawdown: varchar("maxDrawdown", { length: 32 }).notNull(),
  sharpeRatio: varchar("sharpeRatio", { length: 32 }).notNull(),
  resultData: text("resultData").notNull(), // JSON with detailed results
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BacktestResult = typeof backtestResults.$inferSelect;
export type InsertBacktestResult = typeof backtestResults.$inferInsert;

// Trade History - Stores all executed trades for learning and analysis
export const tradeHistory = mysqlTable("trade_history", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: varchar("tradeId", { length: 64 }).notNull().unique(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  strategy: varchar("strategy", { length: 64 }).notNull(),
  side: mysqlEnum("side", ["BUY", "SELL"]).notNull(),
  entryPrice: varchar("entryPrice", { length: 32 }).notNull(),
  exitPrice: varchar("exitPrice", { length: 32 }),
  quantity: varchar("quantity", { length: 32 }).notNull(),
  profit: varchar("profit", { length: 32 }),
  profitPercent: varchar("profitPercent", { length: 32 }),
  status: mysqlEnum("status", ["OPEN", "CLOSED", "CANCELLED"]).notNull(),
  marketState: text("marketState"), // JSON with market conditions at trade time
  indicators: text("indicators"), // JSON with indicator values at trade time
  openedAt: timestamp("openedAt").notNull(),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TradeHistoryRecord = typeof tradeHistory.$inferSelect;
export type InsertTradeHistory = typeof tradeHistory.$inferInsert;