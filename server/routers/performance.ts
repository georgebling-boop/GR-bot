import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getEquityCurveData,
  downsampleData,
  calculateMetrics,
  type EquityCurveData,
} from "../performanceHistory";

/**
 * Performance & Export Router
 * Provides procedures for equity curve data and trade export
 */

export const performanceRouter = router({
  /**
   * Get equity curve data for a specific time range
   */
  getEquityCurve: publicProcedure
    .input(z.object({ timeRange: z.enum(["24h", "7d", "30d", "90d"]) }))
    .query(async ({ input }): Promise<EquityCurveData> => {
      try {
        const data = getEquityCurveData(input.timeRange);
        // Downsample for better chart performance
        const downsampled = downsampleData(data.points, 500);
        return {
          ...data,
          points: downsampled,
        };
      } catch (error) {
        console.error(
          `[Performance] Failed to get equity curve for ${input.timeRange}:`,
          error
        );
        return {
          points: [],
          startEquity: 0,
          endEquity: 0,
          totalProfit: 0,
          totalProfitPercent: 0,
          maxDrawdown: 0,
          maxEquity: 0,
          minEquity: 0,
        };
      }
    }),

  /**
   * Get performance metrics summary
   */
  getMetrics: publicProcedure
    .input(z.object({ timeRange: z.enum(["24h", "7d", "30d", "90d"]) }))
    .query(async ({ input }) => {
      try {
        const data = getEquityCurveData(input.timeRange);
        return calculateMetrics(data);
      } catch (error) {
        console.error(
          `[Performance] Failed to get metrics for ${input.timeRange}:`,
          error
        );
        return {
          startEquity: 0,
          endEquity: 0,
          totalProfit: 0,
          totalProfitPercent: 0,
          maxDrawdown: 0,
          maxEquity: 0,
          minEquity: 0,
          roi: 0,
        };
      }
    }),

  /**
   * Export trades as JSON
   */
  exportTradesAsJson: publicProcedure
    .input(
      z.object({
        trades: z.array(
          z.object({
            trade_id: z.number(),
            pair: z.string(),
            stake_amount: z.number(),
            amount: z.number(),
            open_rate: z.number(),
            current_rate: z.number(),
            profit_abs: z.number(),
            profit_ratio: z.number(),
            open_date: z.string(),
            close_date: z.string().optional(),
            is_open: z.boolean(),
            fee_open: z.number(),
            fee_close: z.number(),
            exchange: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const json = JSON.stringify(input.trades, null, 2);
        return {
          success: true,
          data: json,
          filename: `trades_${new Date().toISOString().split("T")[0]}.json`,
        };
      } catch (error) {
        console.error("[Performance] Failed to export trades as JSON:", error);
        return {
          success: false,
          error: "Failed to export trades",
        };
      }
    }),

  /**
   * Export trades as CSV
   */
  exportTradesAsCsv: publicProcedure
    .input(
      z.object({
        trades: z.array(
          z.object({
            trade_id: z.number(),
            pair: z.string(),
            stake_amount: z.number(),
            amount: z.number(),
            open_rate: z.number(),
            current_rate: z.number(),
            profit_abs: z.number(),
            profit_ratio: z.number(),
            open_date: z.string(),
            close_date: z.string().optional(),
            is_open: z.boolean(),
            fee_open: z.number(),
            fee_close: z.number(),
            exchange: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const trades = input.trades;
        if (trades.length === 0) {
          return {
            success: true,
            data: "Trade ID,Pair,Stake Amount,Amount,Open Rate,Current Rate,Profit (Abs),Profit (%),Open Date,Close Date,Status,Fee Open,Fee Close,Exchange\n",
            filename: `trades_${new Date().toISOString().split("T")[0]}.csv`,
          };
        }

        // Build CSV header
        const headers = [
          "Trade ID",
          "Pair",
          "Stake Amount",
          "Amount",
          "Open Rate",
          "Current Rate",
          "Profit (Abs)",
          "Profit (%)",
          "Open Date",
          "Close Date",
          "Status",
          "Fee Open",
          "Fee Close",
          "Exchange",
        ];

        // Build CSV rows
        const rows = trades.map((trade) => [
          trade.trade_id,
          trade.pair,
          trade.stake_amount.toFixed(8),
          trade.amount.toFixed(8),
          trade.open_rate.toFixed(8),
          trade.current_rate.toFixed(8),
          trade.profit_abs.toFixed(8),
          (trade.profit_ratio * 100).toFixed(2),
          trade.open_date,
          trade.close_date || "",
          trade.is_open ? "OPEN" : "CLOSED",
          trade.fee_open.toFixed(8),
          trade.fee_close.toFixed(8),
          trade.exchange,
        ]);

        // Combine header and rows
        const csv = [headers, ...rows]
          .map((row) =>
            row
              .map((cell) => {
                // Escape quotes and wrap in quotes if contains comma
                const str = String(cell);
                if (str.includes(",") || str.includes('"')) {
                  return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
              })
              .join(",")
          )
          .join("\n");

        return {
          success: true,
          data: csv,
          filename: `trades_${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        console.error("[Performance] Failed to export trades as CSV:", error);
        return {
          success: false,
          error: "Failed to export trades",
        };
      }
    }),
});
