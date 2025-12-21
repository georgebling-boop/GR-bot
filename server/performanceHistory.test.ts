import { describe, it, expect } from "vitest";
import {
  generatePerformanceHistory,
  getEquityCurveData,
  downsampleData,
  calculateMetrics,
} from "./performanceHistory";

describe("Performance History Module", () => {
  describe("generatePerformanceHistory", () => {
    it("should generate performance history for specified days", () => {
      const history = generatePerformanceHistory(7);
      expect(history.length).toBeGreaterThan(0);
      expect(history.length).toBe(7 * 24); // 24 hourly points per day
    });

    it("should have valid data points", () => {
      const history = generatePerformanceHistory(1);
      history.forEach((point) => {
        expect(point).toHaveProperty("timestamp");
        expect(point).toHaveProperty("equity");
        expect(point).toHaveProperty("profit");
        expect(point).toHaveProperty("profitPercent");
        expect(point).toHaveProperty("drawdown");
        expect(point).toHaveProperty("trades");
        expect(point.equity).toBeGreaterThan(0);
        expect(point.drawdown).toBeGreaterThanOrEqual(0);
      });
    });

    it("should have increasing timestamps", () => {
      const history = generatePerformanceHistory(1);
      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i].timestamp).toBeLessThan(history[i + 1].timestamp);
      }
    });

    it("should have non-decreasing trade count", () => {
      const history = generatePerformanceHistory(1);
      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i].trades).toBeLessThanOrEqual(history[i + 1].trades);
      }
    });
  });

  describe("getEquityCurveData", () => {
    it("should return data for 24h range", () => {
      const data = getEquityCurveData("24h");
      expect(data.points.length).toBeGreaterThan(0);
      expect(data.startEquity).toBeGreaterThan(0);
      expect(data.endEquity).toBeGreaterThan(0);
    });

    it("should return data for 7d range", () => {
      const data = getEquityCurveData("7d");
      expect(data.points.length).toBeGreaterThan(0);
    });

    it("should return data for 30d range", () => {
      const data = getEquityCurveData("30d");
      expect(data.points.length).toBeGreaterThan(0);
    });

    it("should return data for 90d range", () => {
      const data = getEquityCurveData("90d");
      expect(data.points.length).toBeGreaterThan(0);
    });

    it("should have consistent metrics", () => {
      const data = getEquityCurveData("7d");
      expect(data.totalProfit).toBe(data.endEquity - data.startEquity);
      expect(data.totalProfitPercent).toBe(
        (data.totalProfit / data.startEquity) * 100
      );
    });

    it("should have valid max/min equity", () => {
      const data = getEquityCurveData("7d");
      expect(data.maxEquity).toBeGreaterThanOrEqual(data.minEquity);
      expect(data.maxEquity).toBeGreaterThanOrEqual(data.startEquity);
      expect(data.maxEquity).toBeGreaterThanOrEqual(data.endEquity);
    });

    it("should have valid drawdown", () => {
      const data = getEquityCurveData("7d");
      expect(data.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(data.maxDrawdown).toBeLessThanOrEqual(100);
    });
  });

  describe("downsampleData", () => {
    it("should return original data if below target points", () => {
      const data = generatePerformanceHistory(1);
      const downsampled = downsampleData(data, 1000);
      expect(downsampled.length).toBeLessThanOrEqual(data.length);
    });

    it("should reduce data to target points", () => {
      const data = generatePerformanceHistory(30);
      const targetPoints = 100;
      const downsampled = downsampleData(data, targetPoints);
      expect(downsampled.length).toBeLessThanOrEqual(targetPoints);
    });

    it("should preserve first and last points", () => {
      const data = generatePerformanceHistory(7);
      const downsampled = downsampleData(data, 50);
      if (downsampled.length > 0) {
        expect(downsampled[downsampled.length - 1]).toBeDefined();
      }
    });

    it("should maintain temporal order", () => {
      const data = generatePerformanceHistory(7);
      const downsampled = downsampleData(data, 50);
      for (let i = 0; i < downsampled.length - 1; i++) {
        expect(downsampled[i].timestamp).toBeLessThanOrEqual(
          downsampled[i + 1].timestamp
        );
      }
    });
  });

  describe("calculateMetrics", () => {
    it("should calculate correct ROI", () => {
      const data = getEquityCurveData("7d");
      const metrics = calculateMetrics(data);
      const expectedRoi =
        ((data.endEquity - data.startEquity) / data.startEquity) * 100;
      expect(metrics.roi).toBe(expectedRoi);
    });

    it("should include all required metrics", () => {
      const data = getEquityCurveData("7d");
      const metrics = calculateMetrics(data);
      expect(metrics).toHaveProperty("startEquity");
      expect(metrics).toHaveProperty("endEquity");
      expect(metrics).toHaveProperty("totalProfit");
      expect(metrics).toHaveProperty("totalProfitPercent");
      expect(metrics).toHaveProperty("maxDrawdown");
      expect(metrics).toHaveProperty("roi");
    });

    it("should have consistent values", () => {
      const data = getEquityCurveData("7d");
      const metrics = calculateMetrics(data);
      expect(metrics.totalProfit).toBe(data.totalProfit);
      expect(metrics.maxDrawdown).toBe(data.maxDrawdown);
    });
  });
});
