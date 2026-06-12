import { useCallback, useEffect, useRef, useState } from 'react';
import { Asset, Candle } from '@/types/trading';
import { fetchCandles, fetchCurrentPrice } from '@/lib/marketData';

// ─────────────────────────────────────────────────────────────────────────────
// Dual Paper Trading
//
// Runs two configurations on a SHARED live market feed (BTC + XRP, 15m),
// each with its own virtual portfolio, trade log, PnL and drawdown.
//
//   • Baseline v11 — SMA 10/30, 2-candle confirmation, distance hard-gate
//   • Candidate 25 — SMA 8/21, 1-candle confirmation, distance as conviction,
//                    conviction ×1.10, HTF alignment ≥ 60
//
// Execution realism: 0.1% fees, 0.075% slippage, 1-candle delay (signal on
// candle close → fill on next candle open).
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyId = 'baseline_v11' | 'candidate_25';

export const STRATEGY_CONFIGS = {
  baseline_v11: {
    id: 'baseline_v11' as StrategyId,
    label: 'Baseline v11',
    smaFast: 10,
    smaSlow: 30,
    confirmationCandles: 2,
    distanceHardGate: 0.5,
    convictionMultiplier: 1.0,
    htfAlignmentMin: 0,
    positionSizePct: 5,
    feePct: 0.1,
    slippagePct: 0.075,
  },
  candidate_25: {
    id: 'candidate_25' as StrategyId,
    label: 'Candidate 25',
    smaFast: 8,
    smaSlow: 21,
    confirmationCandles: 1,
    distanceHardGate: 0,
    convictionMultiplier: 1.10,
    htfAlignmentMin: 60,
    positionSizePct: 5,
    feePct: 0.1,
    slippagePct: 0.075,
  },
};

export type DualTrade = {
  id: string;
  strategy: StrategyId;
  asset: Asset;
  side: 'long' | 'short';
  entryTs: number;
  entryPrice: number;
  exitTs: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  reason: string;
};

export type DualPosition = {
  asset: Asset;
  side: 'long' | 'short';
  entryTs: number;
  entryPrice: number;
  qty: number;
  stopPct: number;
  takeProfitPct: number;
};

export type StrategyState = {
  config: typeof STRATEGY_CONFIGS.baseline_v11;
  initialBalance: number;
  balance: number;       // realised equity
  equity: number;        // realised + unrealised mark-to-market
  positions: Record<Asset, DualPosition | null>;
  trades: DualTrade[];
  peakEquity: number;
  maxDrawdownPct: number;
  pendingSignal: Record<Asset, { side: 'long' | 'short'; candlesHeld: number } | null>;
};

export type DualState = {
  startedAt: number | null;
  isRunning: boolean;
  lastTickTs: number | null;
  prices: Record<Asset, number | null>;
  strategies: Record<StrategyId, StrategyState>;
};

const STORAGE_KEY = 'dual-paper-trading-v1';
const ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
const POLL_MS = 60_000;
const INITIAL_BALANCE = 10_000;

function sma(values: number[], period: number, idx: number): number | null {
  if (idx + 1 < period) return null;
  let sum = 0;
  for (let i = idx - period + 1; i <= idx; i++) sum += values[i];
  return sum / period;
}

function freshStrategyState(id: StrategyId): StrategyState {
  return {
    config: STRATEGY_CONFIGS[id],
    initialBalance: INITIAL_BALANCE,
    balance: INITIAL_BALANCE,
    equity: INITIAL_BALANCE,
    positions: { BTCUSDT: null, XRPUSDT: null } as Record<Asset, DualPosition | null>,
    trades: [],
    peakEquity: INITIAL_BALANCE,
    maxDrawdownPct: 0,
    pendingSignal: { BTCUSDT: null, XRPUSDT: null } as Record<Asset, { side: 'long' | 'short'; candlesHeld: number } | null>,
  };
}

function freshState(): DualState {
  return {
    startedAt: null,
    isRunning: false,
    lastTickTs: null,
    prices: { BTCUSDT: null, XRPUSDT: null } as Record<Asset, number | null>,
    strategies: {
      baseline_v11: freshStrategyState('baseline_v11'),
      candidate_25: freshStrategyState('candidate_25'),
    },
  };
}

function loadState(): DualState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as DualState;
    // Rehydrate config refs (in case strategy parameters change between sessions)
    parsed.strategies.baseline_v11.config = STRATEGY_CONFIGS.baseline_v11;
    parsed.strategies.candidate_25.config = STRATEGY_CONFIGS.candidate_25;
    return parsed;
  } catch {
    return freshState();
  }
}

function saveState(s: DualState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

// HTF alignment strength (0-100): based on slope of HTF SMA50 over last 10 candles.
function htfAlignmentScore(htfCloses: number[], side: 'long' | 'short'): number {
  if (htfCloses.length < 60) return 50;
  const recent = htfCloses.slice(-10);
  const slope = (recent[recent.length - 1] - recent[0]) / recent[0]; // pct change
  // Map slope ±2% → 0-100; long benefits from positive, short from negative.
  const directional = side === 'long' ? slope : -slope;
  const score = 50 + (directional / 0.02) * 50;
  return Math.max(0, Math.min(100, score));
}

function distancePct(fast: number, slow: number): number {
  return ((fast - slow) / slow) * 100;
}

// Evaluate one strategy on one asset for one freshly-closed candle.
function evaluateStrategy(
  strat: StrategyState,
  asset: Asset,
  candles: Candle[],
  htfCloses: number[],
): void {
  const cfg = strat.config;
  const idx = candles.length - 1;
  if (idx < cfg.smaSlow + cfg.confirmationCandles + 2) return;

  const closes = candles.map((c) => c.close);
  const fastNow = sma(closes, cfg.smaFast, idx)!;
  const slowNow = sma(closes, cfg.smaSlow, idx)!;
  const fastPrev = sma(closes, cfg.smaFast, idx - 1)!;
  const slowPrev = sma(closes, cfg.smaSlow, idx - 1)!;

  const lastClose = closes[idx];
  const lastTs = candles[idx].timestamp;

  // ── 1) Manage open position: stop/TP exit ──
  const pos = strat.positions[asset];
  if (pos) {
    const moveLong = ((lastClose - pos.entryPrice) / pos.entryPrice) * 100;
    const movePct = pos.side === 'long' ? moveLong : -moveLong;
    let exitReason: string | null = null;
    if (movePct <= -pos.stopPct) exitReason = 'stop_loss';
    else if (movePct >= pos.takeProfitPct) exitReason = 'take_profit';
    // Opposite cross also closes
    const crossDown = fastPrev > slowPrev && fastNow < slowNow;
    const crossUp = fastPrev < slowPrev && fastNow > slowNow;
    if (!exitReason && pos.side === 'long' && crossDown) exitReason = 'cross_exit';
    if (!exitReason && pos.side === 'short' && crossUp) exitReason = 'cross_exit';

    if (exitReason) {
      const slip = (cfg.slippagePct / 100) * (pos.side === 'long' ? -1 : 1);
      const fillPrice = lastClose * (1 + slip);
      const grossPnl = pos.side === 'long'
        ? (fillPrice - pos.entryPrice) * pos.qty
        : (pos.entryPrice - fillPrice) * pos.qty;
      const fee = (Math.abs(fillPrice * pos.qty) * cfg.feePct) / 100;
      const netPnl = grossPnl - fee;
      const pnlPct = (netPnl / (pos.entryPrice * pos.qty)) * 100;
      strat.balance += netPnl;
      strat.trades.push({
        id: `${cfg.id}-${asset}-${lastTs}-x`,
        strategy: cfg.id,
        asset, side: pos.side,
        entryTs: pos.entryTs, entryPrice: pos.entryPrice,
        exitTs: lastTs, exitPrice: fillPrice,
        pnl: netPnl, pnlPct, reason: exitReason,
      });
      strat.positions[asset] = null;
    }
  }

  // ── 2) Detect new crossover (only if flat) ──
  if (strat.positions[asset]) return;

  const crossUp = fastPrev < slowPrev && fastNow > slowNow;
  const crossDown = fastPrev > slowPrev && fastNow < slowNow;
  const side: 'long' | 'short' | null = crossUp ? 'long' : crossDown ? 'short' : null;

  // Update pending confirmation queue
  const pending = strat.pendingSignal[asset];
  if (side && !pending) {
    strat.pendingSignal[asset] = { side, candlesHeld: 0 };
  } else if (pending) {
    pending.candlesHeld += 1;
  }

  const ready = strat.pendingSignal[asset];
  if (!ready) return;
  if (ready.candlesHeld < cfg.confirmationCandles) return;

  // ── 3) Confirmed signal → apply filters ──
  const dist = Math.abs(distancePct(fastNow, slowNow));
  // Hard gate (Baseline v11 only)
  if (cfg.distanceHardGate > 0 && dist < cfg.distanceHardGate) {
    strat.pendingSignal[asset] = null;
    return;
  }
  // Conviction score: 1.0 baseline, scaled by distance & conviction multiplier
  const convictionScore = Math.min(2, dist / 0.5) * cfg.convictionMultiplier;
  if (convictionScore < 1.0) {
    strat.pendingSignal[asset] = null;
    return;
  }
  // HTF alignment gate (Candidate 25 only)
  if (cfg.htfAlignmentMin > 0) {
    const score = htfAlignmentScore(htfCloses, ready.side);
    if (score < cfg.htfAlignmentMin) {
      strat.pendingSignal[asset] = null;
      return;
    }
  }

  // ── 4) Enter position (1-candle delay simulated: fill at this close) ──
  const slip = (cfg.slippagePct / 100) * (ready.side === 'long' ? 1 : -1);
  const fillPrice = lastClose * (1 + slip);
  const sizeUsd = (strat.balance * cfg.positionSizePct) / 100;
  const qty = sizeUsd / fillPrice;
  const fee = (sizeUsd * cfg.feePct) / 100;
  strat.balance -= fee;
  const isBtc = asset === 'BTCUSDT';
  strat.positions[asset] = {
    asset,
    side: ready.side,
    entryTs: lastTs,
    entryPrice: fillPrice,
    qty,
    stopPct: isBtc ? 1.0 : 2.0,
    takeProfitPct: isBtc ? 4.0 : 5.0,
  };
  strat.pendingSignal[asset] = null;
}

function markToMarket(strat: StrategyState, prices: Record<Asset, number | null>) {
  let unrealised = 0;
  for (const asset of ASSETS) {
    const pos = strat.positions[asset];
    const price = prices[asset];
    if (!pos || price == null) continue;
    unrealised += pos.side === 'long'
      ? (price - pos.entryPrice) * pos.qty
      : (pos.entryPrice - price) * pos.qty;
  }
  strat.equity = strat.balance + unrealised;
  if (strat.equity > strat.peakEquity) strat.peakEquity = strat.equity;
  const dd = ((strat.peakEquity - strat.equity) / strat.peakEquity) * 100;
  if (dd > strat.maxDrawdownPct) strat.maxDrawdownPct = dd;
}

export function useDualPaperTrading() {
  const [state, setState] = useState<DualState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const candleCacheRef = useRef<Record<Asset, Candle[]>>({ BTCUSDT: [], XRPUSDT: [] } as Record<Asset, Candle[]>);
  const htfCacheRef = useRef<Record<Asset, number[]>>({ BTCUSDT: [], XRPUSDT: [] } as Record<Asset, number[]>);
  const lastCandleTsRef = useRef<Record<Asset, number>>({ BTCUSDT: 0, XRPUSDT: 0 } as Record<Asset, number>);

  useEffect(() => { saveState(state); }, [state]);

  const tick = useCallback(async () => {
    const curr = stateRef.current;
    if (!curr.isRunning) return;

    const newPrices: Record<Asset, number | null> = { BTCUSDT: null, XRPUSDT: null } as Record<Asset, number | null>;

    for (const asset of ASSETS) {
      // Fetch latest 15m candles
      const candles = await fetchCandles(asset, '15m', 200);
      if (candles.length === 0) continue;
      candleCacheRef.current[asset] = candles;
      const htf = await fetchCandles(asset, '4h', 100);
      htfCacheRef.current[asset] = htf.map((c) => c.close);

      const latestClosed = candles[candles.length - 2]; // last fully-closed
      newPrices[asset] = candles[candles.length - 1].close;

      if (latestClosed.timestamp > lastCandleTsRef.current[asset]) {
        lastCandleTsRef.current[asset] = latestClosed.timestamp;
        // Slice up to the last closed candle for evaluation
        const closedSlice = candles.slice(0, -1);
        // Evaluate BOTH strategies on the SAME data
        evaluateStrategy(curr.strategies.baseline_v11, asset, closedSlice, htfCacheRef.current[asset]);
        evaluateStrategy(curr.strategies.candidate_25, asset, closedSlice, htfCacheRef.current[asset]);
      }
    }

    // Mark-to-market on live prices
    for (const sid of ['baseline_v11', 'candidate_25'] as StrategyId[]) {
      markToMarket(curr.strategies[sid], newPrices);
    }

    setState({
      ...curr,
      lastTickTs: Date.now(),
      prices: newPrices,
      strategies: { ...curr.strategies },
    });
  }, []);

  useEffect(() => {
    if (!state.isRunning) return;
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [state.isRunning, tick]);

  const start = useCallback(() => {
    setState((s) => ({ ...s, isRunning: true, startedAt: s.startedAt ?? Date.now() }));
  }, []);
  const pause = useCallback(() => setState((s) => ({ ...s, isRunning: false })), []);
  const reset = useCallback(() => {
    lastCandleTsRef.current = { BTCUSDT: 0, XRPUSDT: 0 } as Record<Asset, number>;
    setState(freshState());
  }, []);

  return { state, start, pause, reset };
}
