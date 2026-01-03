import superjson from "superjson";
import { trpc } from "./trpc";
import { observable } from "@trpc/server/observable";
import type { TRPCLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";

// Mock trade interfaces
interface MockTrade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stake: number;
  profit?: number;
  profitPercent?: number;
  strategy: string;
  openedAt: string;
  closedAt?: string;
}

// Minimal in-memory mock state
let balance = 800;
let win = 0;
let loss = 0;
let totalTrades = 0;
let openTrades: MockTrade[] = [];
let closedTrades: MockTrade[] = [];
let strategyStats = [
  { name: "momentum_scalp", trades: 12, winRate: 58, totalProfit: 42.5 },
  { name: "mean_reversion", trades: 8, winRate: 50, totalProfit: -12.3 },
];

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "AVAXUSDT", "LINKUSDT", "ADAUSDT"];
let prices = symbols.map((s) => ({ symbol: s, price: 100 + Math.random() * 900, change24h: (Math.random() - 0.5) * 10 }));

function tickPrices() {
  prices = prices.map((p) => {
    const drift = (Math.random() - 0.5) * 2;
    const next = Math.max(0.01, p.price + drift);
    const change24h = (Math.random() - 0.5) * 10;
    return { ...p, price: next, change24h };
  });
}

setInterval(() => {
  tickPrices();
  // Simulate random trade closure
  if (openTrades.length > 0 && Math.random() < 0.3) {
    const t = openTrades.shift();
    if (t) {
      const exit = t.entryPrice * (1 + (Math.random() - 0.5) * 0.02);
      const profit = (exit - t.entryPrice) * t.quantity;
      const profitPercent = ((exit - t.entryPrice) / t.entryPrice) * 100;
      closedTrades.push({ ...t, exitPrice: exit, profit, profitPercent, closedAt: new Date().toISOString() });
      balance += profit;
      totalTrades += 1;
      if (profit >= 0) win += 1; else loss += 1;
    }
  }
}, 2000);

const UNAUTHED_ERR_MSG = "Unauthorized"; // stays consistent with client handler

// Create a mock link that handles operations
const mockLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return observable((observer) => {
      const { path } = op;
      
      let result: any;
      
      try {
        // Routes used in Dashboard/ViewOnly
        if (path === "scalper.getSession") {
          const startingBalance = 800;
          const totalProfit = balance - startingBalance;
          const totalProfitPercent = (totalProfit / startingBalance) * 100;
          const winRate = totalTrades === 0 ? 0 : (win / totalTrades) * 100;
          result = {
            session: {
              startingBalance,
              currentBalance: balance,
              totalProfit,
              totalProfitPercent,
              winRate,
              winningTrades: win,
              losingTrades: loss,
              totalTrades,
              openTrades,
              closedTrades,
              strategyStats,
            },
          };
        } else if (path === "scalper.getPrices") {
          result = { prices };
        } else if (path === "scalper.initialize") {
          balance = 800;
          win = 0; loss = 0; totalTrades = 0;
          openTrades = [];
          closedTrades = [];
          result = { ok: true };
        } else if (path === "scalper.start") {
          // add a fake open trade
          const sym = symbols[Math.floor(Math.random() * symbols.length)];
          const entryPrice = prices.find((p) => p.symbol === sym)?.price || 100;
          openTrades.push({
            id: String(Date.now()), symbol: sym, entryPrice, quantity: 0.1, stake: 50,
            strategy: "momentum_scalp", openedAt: new Date().toISOString(),
          });
          result = { ok: true };
        } else if (path === "scalper.stop") {
          result = { ok: true };
        } else if (path === "scalper.executeCycle") {
          // nudge prices and maybe open a trade
          tickPrices();
          if (Math.random() < 0.3) {
            const sym = symbols[Math.floor(Math.random() * symbols.length)];
            const entryPrice = prices.find((p) => p.symbol === sym)?.price || 100;
            openTrades.push({ id: String(Date.now()), symbol: sym, entryPrice, quantity: 0.05, stake: 25, strategy: "momentum_scalp", openedAt: new Date().toISOString() });
          }
          result = { actions: ["CYCLE EXECUTED"] };
        } else if (path === "scalper.reset") {
          balance = 800; win = 0; loss = 0; totalTrades = 0; openTrades = []; closedTrades = [];
          result = { ok: true };
        } else {
          // Default: unauthorized for unknown paths
          // Observer.error accepts any value, so this is safe
          observer.error(new Error(UNAUTHED_ERR_MSG) as any);
          return;
        }
        
        observer.next({ result: { type: 'data', data: result } });
        observer.complete();
      } catch (error) {
        observer.error(error as any);
      }
    });
  };
};

// Create a simple mock client
export function createMockClient() {
  const mock = trpc.createClient({
    links: [mockLink],
  });
  return mock;
}
