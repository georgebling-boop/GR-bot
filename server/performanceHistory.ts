/**
 * Performance History Service
 * Generates equity curve and performance data for charting
 */

export interface PerformancePoint {
  timestamp: number;
  equity: number;
  profit: number;
  profitPercent: number;
  drawdown: number;
  trades: number;
}

export interface EquityCurveData {
  points: PerformancePoint[];
  startEquity: number;
  endEquity: number;
  totalProfit: number;
  totalProfitPercent: number;
  maxDrawdown: number;
  maxEquity: number;
  minEquity: number;
}

/**
 * Generate mock performance history data
 * In production, this would come from your Freqtrade bot's database
 */
export function generatePerformanceHistory(
  days: number = 30
): PerformancePoint[] {
  const now = Date.now();
  const points: PerformancePoint[] = [];
  const startEquity = 10000;
  let currentEquity = startEquity;
  let maxEquity = startEquity;
  let tradeCount = 0;

  // Generate hourly data points
  const intervalMs = (days * 24 * 60 * 60 * 1000) / (days * 24);

  for (let i = 0; i < days * 24; i++) {
    const timestamp = now - (days * 24 - i) * 60 * 60 * 1000;

    // Simulate equity changes with random walk
    const change = (Math.random() - 0.48) * 100; // Slight upward bias
    currentEquity += change;

    // Simulate occasional trades
    if (Math.random() > 0.95) {
      tradeCount++;
    }

    // Track max equity for drawdown calculation
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity;
    }

    const profit = currentEquity - startEquity;
    const profitPercent = (profit / startEquity) * 100;
    const drawdown = ((maxEquity - currentEquity) / maxEquity) * 100;

    points.push({
      timestamp,
      equity: Math.max(currentEquity, 1000), // Prevent negative equity
      profit,
      profitPercent,
      drawdown: Math.max(drawdown, 0),
      trades: tradeCount,
    });
  }

  return points;
}

/**
 * Get equity curve data for a specific time range
 */
export function getEquityCurveData(
  timeRange: "24h" | "7d" | "30d" | "90d"
): EquityCurveData {
  let days = 1;
  switch (timeRange) {
    case "24h":
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
  }

  const points = generatePerformanceHistory(days);

  if (points.length === 0) {
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

  const startEquity = points[0].equity;
  const endEquity = points[points.length - 1].equity;
  const totalProfit = endEquity - startEquity;
  const totalProfitPercent = (totalProfit / startEquity) * 100;
  const maxDrawdown = Math.max(...points.map((p) => p.drawdown));
  const maxEquity = Math.max(...points.map((p) => p.equity));
  const minEquity = Math.min(...points.map((p) => p.equity));

  return {
    points,
    startEquity,
    endEquity,
    totalProfit,
    totalProfitPercent,
    maxDrawdown,
    maxEquity,
    minEquity,
  };
}

/**
 * Downsample data for better chart performance
 * Reduces number of points while maintaining shape
 */
export function downsampleData(
  points: PerformancePoint[],
  targetPoints: number = 500
): PerformancePoint[] {
  if (points.length <= targetPoints) {
    return points;
  }

  const bucketSize = Math.ceil(points.length / targetPoints);
  const downsampled: PerformancePoint[] = [];

  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, i + bucketSize);
    if (bucket.length === 0) continue;

    // Take the last point in each bucket
    downsampled.push(bucket[bucket.length - 1]);
  }

  return downsampled;
}

/**
 * Calculate performance metrics from equity curve
 */
export function calculateMetrics(data: EquityCurveData) {
  return {
    startEquity: data.startEquity,
    endEquity: data.endEquity,
    totalProfit: data.totalProfit,
    totalProfitPercent: data.totalProfitPercent,
    maxDrawdown: data.maxDrawdown,
    maxEquity: data.maxEquity,
    minEquity: data.minEquity,
    roi: ((data.endEquity - data.startEquity) / data.startEquity) * 100,
  };
}
