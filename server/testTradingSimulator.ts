/**
 * Test Trading Simulator
 * Simulates trading with a $100 virtual account for testing and backtesting
 */

export interface SimulatedTrade {
  trade_id: number;
  pair: string;
  stake_amount: number;
  amount: number;
  open_rate: number;
  current_rate: number;
  profit_abs: number;
  profit_ratio: number;
  open_date: string;
  close_date?: string;
  is_open: boolean;
  fee_open: number;
  fee_close: number;
  exchange: string;
  entry_reason?: string;
  exit_reason?: string;
}

export interface SimulationState {
  initial_stake: number;
  current_equity: number;
  total_profit: number;
  total_profit_percent: number;
  trades: SimulatedTrade[];
  open_trades: SimulatedTrade[];
  closed_trades: SimulatedTrade[];
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  max_drawdown: number;
  max_equity: number;
  min_equity: number;
  start_date: string;
  current_date: string;
}

/**
 * Initialize a new trading simulation with $100 starting capital
 */
export function initializeSimulation(): SimulationState {
  const initialStake = 100;
  return {
    initial_stake: initialStake,
    current_equity: initialStake,
    total_profit: 0,
    total_profit_percent: 0,
    trades: [],
    open_trades: [],
    closed_trades: [],
    total_trades: 0,
    winning_trades: 0,
    losing_trades: 0,
    win_rate: 0,
    max_drawdown: 0,
    max_equity: initialStake,
    min_equity: initialStake,
    start_date: new Date().toISOString(),
    current_date: new Date().toISOString(),
  };
}

/**
 * Simulate opening a trade
 */
export function openTrade(
  state: SimulationState,
  pair: string,
  stake_amount: number,
  open_rate: number
): SimulationState {
  const tradeId = state.total_trades + 1;
  const amount = stake_amount / open_rate;
  const fee = stake_amount * 0.001; // 0.1% fee

  const trade: SimulatedTrade = {
    trade_id: tradeId,
    pair,
    stake_amount,
    amount,
    open_rate,
    current_rate: open_rate,
    profit_abs: 0,
    profit_ratio: 0,
    open_date: new Date().toISOString(),
    is_open: true,
    fee_open: fee,
    fee_close: 0,
    exchange: "binance",
    entry_reason: "strategy_signal",
  };

  const newState = { ...state };
  newState.trades.push(trade);
  newState.open_trades.push(trade);
  newState.total_trades += 1;
  newState.current_equity -= stake_amount + fee;

  return newState;
}

/**
 * Simulate closing a trade
 */
export function closeTrade(
  state: SimulationState,
  tradeId: number,
  closeRate: number
): SimulationState {
  const newState = { ...state };
  const tradeIndex = newState.trades.findIndex((t) => t.trade_id === tradeId);

  if (tradeIndex === -1) {
    return newState;
  }

  const trade = newState.trades[tradeIndex];
  const closeFee = trade.stake_amount * 0.001; // 0.1% fee
  const profitAbs =
    trade.amount * closeRate - trade.stake_amount - trade.fee_open - closeFee;
  const profitRatio = profitAbs / trade.stake_amount;

  trade.current_rate = closeRate;
  trade.profit_abs = profitAbs;
  trade.profit_ratio = profitRatio;
  trade.close_date = new Date().toISOString();
  trade.is_open = false;
  trade.fee_close = closeFee;
  trade.exit_reason = "take_profit";

  // Update state
  newState.trades[tradeIndex] = trade;
  newState.open_trades = newState.open_trades.filter((t) => t.trade_id !== tradeId);
  newState.closed_trades.push(trade);

  // Update equity
  newState.current_equity += trade.stake_amount + profitAbs;
  newState.total_profit += profitAbs;
  newState.total_profit_percent =
    (newState.total_profit / newState.initial_stake) * 100;

  // Update win/loss counts
  if (profitAbs > 0) {
    newState.winning_trades += 1;
  } else if (profitAbs < 0) {
    newState.losing_trades += 1;
  }

  // Update win rate
  newState.win_rate =
    newState.total_trades > 0
      ? (newState.winning_trades / newState.total_trades) * 100
      : 0;

  // Update max/min equity
  if (newState.current_equity > newState.max_equity) {
    newState.max_equity = newState.current_equity;
  }
  if (newState.current_equity < newState.min_equity) {
    newState.min_equity = newState.current_equity;
  }

  // Calculate max drawdown
  newState.max_drawdown =
    ((newState.max_equity - newState.min_equity) / newState.max_equity) * 100;

  return newState;
}

/**
 * Update price of an open trade
 */
export function updateTradePrice(
  state: SimulationState,
  tradeId: number,
  currentRate: number
): SimulationState {
  const newState = { ...state };
  const trade = newState.open_trades.find((t) => t.trade_id === tradeId);

  if (!trade) {
    return newState;
  }

  const closeFee = trade.stake_amount * 0.001;
  const profitAbs =
    trade.amount * currentRate - trade.stake_amount - trade.fee_open - closeFee;
  const profitRatio = profitAbs / trade.stake_amount;

  trade.current_rate = currentRate;
  trade.profit_abs = profitAbs;
  trade.profit_ratio = profitRatio;

  // Update in main trades array as well
  const mainIndex = newState.trades.findIndex((t) => t.trade_id === tradeId);
  if (mainIndex !== -1) {
    newState.trades[mainIndex] = trade;
  }

  return newState;
}

/**
 * Generate sample trades for testing
 */
export function generateSampleTrades(state: SimulationState): SimulationState {
  let newState = state;

  // Sample trade 1: Winning trade
  newState = openTrade(newState, "BTC-USD", 25, 45000);
  newState = closeTrade(newState, 1, 46000); // +2.2% profit

  // Sample trade 2: Losing trade
  newState = openTrade(newState, "ETH-USD", 20, 2500);
  newState = closeTrade(newState, 2, 2450); // -2% loss

  // Sample trade 3: Open trade
  newState = openTrade(newState, "ADA-USD", 15, 0.8);
  newState = updateTradePrice(newState, 3, 0.82); // +2.5% unrealized

  // Sample trade 4: Winning trade
  newState = openTrade(newState, "XRP-USD", 18, 0.6);
  newState = closeTrade(newState, 4, 0.65); // +8.3% profit

  // Sample trade 5: Open trade
  newState = openTrade(newState, "SOL-USD", 22, 150);
  newState = updateTradePrice(newState, 5, 155); // +3.3% unrealized

  return newState;
}

/**
 * Get simulation summary
 */
export function getSimulationSummary(state: SimulationState) {
  return {
    initial_stake: state.initial_stake,
    current_equity: state.current_equity,
    total_profit: state.total_profit,
    total_profit_percent: state.total_profit_percent,
    total_trades: state.total_trades,
    winning_trades: state.winning_trades,
    losing_trades: state.losing_trades,
    win_rate: state.win_rate,
    max_drawdown: state.max_drawdown,
    max_equity: state.max_equity,
    min_equity: state.min_equity,
    open_trades_count: state.open_trades.length,
    closed_trades_count: state.closed_trades.length,
    roi: ((state.current_equity - state.initial_stake) / state.initial_stake) * 100,
  };
}
