/**
 * Hyperliquid Router
 * API endpoints for Hyperliquid exchange integration
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {
  initializeHyperliquid,
  getConnectionStatus,
  getMarkets,
  getMarketData,
  getAllPrices,
  getAccountState,
  getOpenOrders,
  getRecentTrades,
  placeMarketOrder,
  placeLimitOrder,
  placeStopLoss,
  placeTakeProfit,
  cancelOrder,
  cancelAllOrders,
  closePosition,
  setLeverage,
  disconnect,
  switchNetwork,
} from "../hyperliquid";
import {
  saveHyperliquidConnection,
  getActiveHyperliquidConnection,
  deactivateHyperliquidConnection,
} from "../db";

export const hyperliquidRouter = router({
  // Connect to Hyperliquid with wallet
  connect: publicProcedure
    .input(z.object({
      privateKey: z.string().min(1, "Private key is required"),
      useMainnet: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Hyperliquid Router] Attempting connection, mainnet: ${input.useMainnet}`);
      
      const success = initializeHyperliquid({
        privateKey: input.privateKey,
        useMainnet: input.useMainnet,
      });
      
      const status = getConnectionStatus();
      console.log(`[Hyperliquid Router] Connection result: ${success}, error: ${status.error}`);
      
      // Save connection to database for persistence
      if (success && status.wallet) {
        try {
          await saveHyperliquidConnection(
            input.privateKey,
            status.wallet,
            input.useMainnet
          );
          console.log(`[Hyperliquid Router] Connection saved to database`);
        } catch (dbError) {
          console.error(`[Hyperliquid Router] Failed to save connection to database:`, dbError);
        }
      }
      
      return {
        success,
        status,
        error: status.error,
      };
    }),

  // Disconnect from Hyperliquid
  disconnect: publicProcedure
    .mutation(async () => {
      disconnect();
      // Deactivate connection in database
      try {
        await deactivateHyperliquidConnection();
      } catch (dbError) {
        console.error(`[Hyperliquid Router] Failed to deactivate connection in database:`, dbError);
      }
      return { success: true };
    }),

  // Get connection status
  getStatus: publicProcedure
    .query(async () => {
      return getConnectionStatus();
    }),

  // Switch network (mainnet/testnet)
  switchNetwork: publicProcedure
    .input(z.object({
      useMainnet: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      switchNetwork(input.useMainnet);
      return { success: true, network: input.useMainnet ? "mainnet" : "testnet" };
    }),

  // Get all available markets
  getMarkets: publicProcedure
    .query(async () => {
      return getMarkets();
    }),

  // Get market data for a specific coin
  getMarketData: publicProcedure
    .input(z.object({
      coin: z.string(),
    }))
    .query(async ({ input }) => {
      return getMarketData(input.coin);
    }),

  // Get all prices
  getPrices: publicProcedure
    .query(async () => {
      return getAllPrices();
    }),

  // Get account state (balance, positions, margin)
  getAccountState: publicProcedure
    .query(async () => {
      return getAccountState();
    }),

  // Get open orders
  getOpenOrders: publicProcedure
    .query(async () => {
      return getOpenOrders();
    }),

  // Get recent trades
  getRecentTrades: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      return getRecentTrades(input.limit);
    }),

  // Place market order
  placeMarketOrder: publicProcedure
    .input(z.object({
      coin: z.string(),
      side: z.enum(["buy", "sell"]),
      size: z.number().positive(),
      reduceOnly: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      return placeMarketOrder(input.coin, input.side, input.size, input.reduceOnly);
    }),

  // Place limit order
  placeLimitOrder: publicProcedure
    .input(z.object({
      coin: z.string(),
      side: z.enum(["buy", "sell"]),
      size: z.number().positive(),
      price: z.number().positive(),
      reduceOnly: z.boolean().optional().default(false),
      postOnly: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      return placeLimitOrder(
        input.coin,
        input.side,
        input.size,
        input.price,
        input.reduceOnly,
        input.postOnly
      );
    }),

  // Place stop-loss order
  placeStopLoss: publicProcedure
    .input(z.object({
      coin: z.string(),
      side: z.enum(["buy", "sell"]),
      size: z.number().positive(),
      triggerPrice: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      return placeStopLoss(input.coin, input.side, input.size, input.triggerPrice);
    }),

  // Place take-profit order
  placeTakeProfit: publicProcedure
    .input(z.object({
      coin: z.string(),
      side: z.enum(["buy", "sell"]),
      size: z.number().positive(),
      triggerPrice: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      return placeTakeProfit(input.coin, input.side, input.size, input.triggerPrice);
    }),

  // Cancel order
  cancelOrder: publicProcedure
    .input(z.object({
      coin: z.string(),
      orderId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const success = await cancelOrder(input.coin, input.orderId);
      return { success };
    }),

  // Cancel all orders
  cancelAllOrders: publicProcedure
    .input(z.object({
      coin: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const success = await cancelAllOrders(input.coin);
      return { success };
    }),

  // Close position
  closePosition: publicProcedure
    .input(z.object({
      coin: z.string(),
    }))
    .mutation(async ({ input }) => {
      return closePosition(input.coin);
    }),

  // Set leverage
  setLeverage: publicProcedure
    .input(z.object({
      coin: z.string(),
      leverage: z.number().min(1).max(50),
    }))
    .mutation(async ({ input }) => {
      const success = await setLeverage(input.coin, input.leverage);
      return { success };
    }),
});
