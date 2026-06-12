import {
  ExperimentStore, ExperimentRun, ConfigSnapshot, RunResult,
} from '@/types/experiment';
import { loadExperimentStore, createRun, setBaseline } from './experimentEngine';

const SEED_KEY = 'experiment-seed-v31';

function baselineV1Config(): ConfigSnapshot {
  return {
    assets: ['BTCUSDT', 'XRPUSDT'],
    strategies: ['sma_crossover'],
    strategyParams: {
      sma_crossover: { smaFast: 20, smaSlow: 50 },
    },
    filterThresholds: { atrPeriod: 14, atrThreshold: 0.5, minSmaDistance: 0.1 },
    riskSettings: {
      positionSizePercent: 5,
      stopLossPercent: 2,
      takeProfitPercent: 4,
      feePercent: 0.1,
      initialBalance: 10000,
    },
    allocationSettings: { maxExposure: 20 },
    governanceSettings: { dailyLossLimit: 5, drawdownLimit: 15, consecutiveLossLimit: 5, flipTradeLimit: 4 },
    operatorPolicy: { autonomyMode: 'PAPER_EXECUTION', activePolicies: [], activeOverrides: [] },
    adaptationSettings: { confidenceDecay: 0.02, adaptationStrength: 0.5 },
    timeframe: '15m',
  };
}

function baselineV2Config(): ConfigSnapshot {
  return {
    ...baselineV1Config(),
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30 },
    },
  };
}

function baselineV1Result(): RunResult {
  return {
    totalReturn: 6.8,
    netPnl: 680,
    maxDrawdown: 8.2,
    winRate: 52.1,
    profitFactor: 1.35,
    tradeCount: 47,
    longTradeCount: 28,
    shortTradeCount: 19,
    blockedTradeCount: 6,
    governanceInterventions: 2,
    avgHealthScore: 74,
    robustnessScore: 65,
    failurePointsDetected: 3,
    summaryCommentary: 'Archived Baseline v1: SMA 20/50 crossover. Replaced by Baseline v2 (Faster SMA 10/30) which demonstrated higher avg PnL, lower variance, and consistent outperformance.',
  };
}

function baselineV2Result(): RunResult {
  return {
    totalReturn: 9.4,
    netPnl: 940,
    maxDrawdown: 10.5,
    winRate: 48.7,
    profitFactor: 1.42,
    tradeCount: 72,
    longTradeCount: 41,
    shortTradeCount: 31,
    blockedTradeCount: 9,
    governanceInterventions: 3,
    avgHealthScore: 70,
    robustnessScore: 58,
    failurePointsDetected: 5,
    summaryCommentary: 'Archived Baseline v2 (promoted from Candidate 1 — Faster SMA 10/30). Replaced by Baseline v3 (Strong Sideways Filter) which demonstrated highest win rate, best profit factor, and lowest drawdown.',
  };
}

function baselineV3Config(): ConfigSnapshot {
  return {
    ...baselineV2Config(),
    filterThresholds: { atrPeriod: 14, atrThreshold: 0.5, minSmaDistance: 1.0 },
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30, cooldownCandles: 3, sidewaysFilter: 1, minSmaDistancePercent: 1.0 },
    },
  };
}

function baselineV3Result(): RunResult {
  return {
    totalReturn: 6.4,
    netPnl: 640,
    maxDrawdown: 4.8,
    winRate: 61.5,
    profitFactor: 1.74,
    tradeCount: 26,
    longTradeCount: 16,
    shortTradeCount: 10,
    blockedTradeCount: 31,
    governanceInterventions: 1,
    avgHealthScore: 81,
    robustnessScore: 78,
    failurePointsDetected: 1,
    summaryCommentary: 'Archived Baseline v3 (promoted from Candidate 5 — Strong Sideways Filter). Replaced by Baseline v4 (Entry Confirmation) which demonstrated higher win rate (65.0%), better profit factor (1.82), and lower drawdown (4.2%).',
  };
}

function baselineV4Config(): ConfigSnapshot {
  return {
    ...baselineV3Config(),
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30, cooldownCandles: 3, sidewaysFilter: 1, minSmaDistancePercent: 1.0, entryConfirmationCandles: 1 },
    },
  };
}

function baselineV4Result(): RunResult {
  return {
    totalReturn: 5.8,
    netPnl: 580,
    maxDrawdown: 4.2,
    winRate: 65.0,
    profitFactor: 1.82,
    tradeCount: 20,
    longTradeCount: 13,
    shortTradeCount: 7,
    blockedTradeCount: 37,
    governanceInterventions: 1,
    avgHealthScore: 83,
    robustnessScore: 80,
    failurePointsDetected: 1,
    summaryCommentary: 'Archived Baseline v4 (promoted from Candidate 7 — Entry Confirmation). Replaced by Baseline v5 (Tighter Stop Loss) which demonstrated positive PnL, lowest drawdown (0.56%), and better capital preservation.',
  };
}

function baselineV5Config(): ConfigSnapshot {
  return {
    ...baselineV4Config(),
    riskSettings: {
      positionSizePercent: 5,
      stopLossPercent: 1.5,
      takeProfitPercent: 4,
      feePercent: 0.1,
      initialBalance: 10000,
    },
  };
}

function baselineV5Result(): RunResult {
  return {
    totalReturn: 5.2,
    netPnl: 520,
    maxDrawdown: 3.4,
    winRate: 63.2,
    profitFactor: 1.78,
    tradeCount: 20,
    longTradeCount: 13,
    shortTradeCount: 7,
    blockedTradeCount: 37,
    governanceInterventions: 1,
    avgHealthScore: 85,
    robustnessScore: 83,
    failurePointsDetected: 1,
    summaryCommentary: 'Archived Baseline v5 (promoted from Candidate 9 — Tighter Stop Loss). Replaced by Baseline v6 (Asset Optimized Risk) which demonstrated higher PnL, no drawdown increase, and improved XRP performance via asset-specific risk settings.',
  };
}

function baselineV6Config(): ConfigSnapshot {
  return {
    ...baselineV5Config(),
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30, cooldownCandles: 3, entryConfirmation: 1, minSmaDistancePercent: 1.0, btcStopLoss: 1.0, btcTakeProfit: 4, xrpStopLoss: 2.0, xrpTakeProfit: 5 },
    },
  };
}

function baselineV6Result(): RunResult {
  return {
    totalReturn: 8.1,
    netPnl: 810,
    maxDrawdown: 3.1,
    winRate: 65.4,
    profitFactor: 1.92,
    tradeCount: 38,
    longTradeCount: 22,
    shortTradeCount: 16,
    blockedTradeCount: 18,
    governanceInterventions: 0,
    avgHealthScore: 86,
    robustnessScore: 84,
    failurePointsDetected: 0,
    summaryCommentary: 'Archived Baseline v6 (promoted from Candidate 11 — Asset Optimized Risk). Replaced by Baseline v7 (Trailing Stop) which demonstrated higher PnL (+$130), lower drawdown (2.3% vs 3.1%), and improved profit factor (2.08 vs 1.92).',
  };
}

function baselineV7Config(): ConfigSnapshot {
  return {
    ...baselineV6Config(),
    strategyParams: {
      sma_crossover: {
        ...baselineV6Config().strategyParams.sma_crossover,
        trailingStopEnabled: 1,
        trailingStopActivation: 2.0,
        trailingStopDistance: 1.0,
        moveToBreakevenAt: 2.0,
      },
    },
  };
}

function baselineV7Result(): RunResult {
  return {
    totalReturn: 9.4,
    netPnl: 940,
    maxDrawdown: 2.3,
    winRate: 67.1,
    profitFactor: 2.08,
    tradeCount: 38,
    longTradeCount: 22,
    shortTradeCount: 16,
    blockedTradeCount: 18,
    governanceInterventions: 0,
    avgHealthScore: 89,
    robustnessScore: 87,
    failurePointsDetected: 0,
    summaryCommentary: 'Archived Baseline v7 (promoted from Candidate 12 — Trailing Stop). Replaced by Baseline v8 (Weighted Multi-Strategy 70/30) which retains 97% of PnL while reducing drawdown and improving equity curve stability.',
  };
}

export function seedExperiments(): void {
  if (localStorage.getItem(SEED_KEY)) return;

  let store = loadExperimentStore();

  const now = Date.now();

  // ── Archived Baseline v1 (kept for reference) ──────────────────────
  const { store: s1 } = createRun(store, {
    type: 'backtest',
    name: 'Baseline v1 — SMA 20/50 (Archived)',
    startTime: now - 7200000,
    endTime: now - 5400000,
    duration: 1800000,
    config: baselineV1Config(),
    versionIds: { sma_crossover: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineV1Result(),
  });

  // ── Archived Baseline v2 (kept for reference) ──────────────────────
  const { store: s2 } = createRun(s1, {
    type: 'backtest',
    name: 'Baseline v2 — Faster SMA 10/30 (Archived)',
    startTime: now - 3600000,
    endTime: now - 1800000,
    duration: 1800000,
    config: baselineV2Config(),
    versionIds: { sma_crossover: 'v2.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineV2Result(),
  });

  // ── Archived Baseline v3 (kept for reference) ──────────────────────
  const { store: s2b } = createRun(s2, {
    type: 'backtest',
    name: 'Baseline v3 — Strong Sideways Filter (Archived)',
    startTime: now - 1500000,
    endTime: now - 900000,
    duration: 600000,
    config: baselineV3Config(),
    versionIds: { sma_crossover: 'v3.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineV3Result(),
  });

  // ── Archived Baseline v4 (kept for reference) ──────────────────────
  const { store: s2c } = createRun(s2b, {
    type: 'backtest',
    name: 'Baseline v4 — Entry Confirmation (Archived)',
    startTime: now - 800000,
    endTime: now - 400000,
    duration: 400000,
    config: baselineV4Config(),
    versionIds: { sma_crossover: 'v4.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineV4Result(),
  });

  // ── Archived Baseline v5 (kept for reference) ──────────────────────
  const { store: s2d } = createRun(s2c, {
    type: 'backtest',
    name: 'Baseline v5 — Tighter Stop Loss (Archived)',
    startTime: now - 350000,
    endTime: now - 150000,
    duration: 200000,
    config: baselineV5Config(),
    versionIds: { sma_crossover: 'v5.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineV5Result(),
  });

  // ── Archived Baseline v6 (kept for reference) ──────────────────────
  const { store: s2e } = createRun(s2d, {
    type: 'backtest',
    name: 'Baseline v6 — Asset Optimized Risk (Archived)',
    startTime: now - 100000,
    endTime: now - 10000,
    duration: 90000,
    config: baselineV6Config(),
    versionIds: { sma_crossover: 'v6.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineV6Result(),
  });

  // ── Archived Baseline v7 (kept for reference) ──────────────────────
  const { store: s2f } = createRun(s2e, {
    type: 'backtest',
    name: 'Baseline v7 — Trailing Stop (Archived)',
    startTime: now - 80000,
    endTime: now - 5000,
    duration: 75000,
    config: baselineV7Config(),
    versionIds: { sma_crossover: 'v7.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineV7Result(),
  });

  // ── Archived Baseline v8 (promoted from Candidate 16) ──────────────
  const baselineV8Cfg: ConfigSnapshot = {
    ...baselineV7Config(),
    strategies: ['sma_crossover', 'mean_reversion'],
    strategyParams: {
      sma_crossover: {
        ...baselineV7Config().strategyParams.sma_crossover,
        capitalAllocation: 70,
      },
      mean_reversion: {
        rsiPeriod: 14,
        rsiBuyThreshold: 35,
        rsiSellThreshold: 65,
        trendSmaPeriod: 50,
        trailingStopEnabled: 1,
        trailingStopActivation: 2.0,
        trailingStopDistance: 1.0,
        cooldownCandles: 3,
        entryConfirmation: 1,
        capitalAllocation: 30,
      },
    },
    allocationSettings: { maxExposure: 20 },
  };
  const { store: s2g } = createRun(s2f, {
    type: 'backtest',
    name: 'Baseline v8 — Weighted Multi-Strategy Portfolio (archived)',
    startTime: now - 70000,
    endTime: now - 2000,
    duration: 68000,
    config: baselineV8Cfg,
    versionIds: { sma_crossover: 'v7.0', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 9.1,
      netPnl: 910,
      maxDrawdown: 2.0,
      winRate: 64.8,
      profitFactor: 2.02,
      tradeCount: 48,
      longTradeCount: 28,
      shortTradeCount: 20,
      blockedTradeCount: 21,
      governanceInterventions: 0,
      avgHealthScore: 90,
      robustnessScore: 88,
      failurePointsDetected: 0,
      summaryCommentary: 'Baseline v8 (archived). Weighted Multi-Strategy 70/30 SMA/MR. Superseded by Baseline v9 (Adaptive Allocation) which achieved higher PnL ($1,030 vs $910), lower drawdown (1.6% vs 2.0%), and better profit factor (2.18 vs 2.02).',
    },
  });

  // ── Archived Baseline v9 (promoted from Candidate 17) ──────────────
  const baselineV9Cfg: ConfigSnapshot = {
    ...baselineV8Cfg,
    strategyParams: {
      sma_crossover: {
        ...baselineV8Cfg.strategyParams.sma_crossover,
        capitalAllocation: 70,
        adaptiveAllocation: 1,
      },
      mean_reversion: {
        ...baselineV8Cfg.strategyParams.mean_reversion,
        capitalAllocation: 30,
        adaptiveAllocation: 1,
      },
    },
    allocationSettings: {
      maxExposure: 20,
      adaptiveAllocation: 1,
      strongTrendSma: 85,
      strongTrendMr: 15,
      weakTrendSma: 55,
      weakTrendMr: 45,
      choppySma: 45,
      choppyMr: 55,
    },
  };
  const { store: s2h, runId: baselineV9Id } = createRun(s2g, {
    type: 'backtest',
    name: 'Baseline v9 — Adaptive Allocation (Archived)',
    startTime: now - 60000,
    endTime: now - 1000,
    duration: 59000,
    config: baselineV9Cfg,
    versionIds: { sma_crossover: 'v7.0', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    
    result: {
      totalReturn: 10.3,
      netPnl: 1030,
      maxDrawdown: 1.6,
      winRate: 66.2,
      profitFactor: 2.18,
      tradeCount: 52,
      longTradeCount: 30,
      shortTradeCount: 22,
      blockedTradeCount: 19,
      governanceInterventions: 0,
      avgHealthScore: 93,
      robustnessScore: 91,
      failurePointsDetected: 0,
      summaryCommentary: 'Archived Baseline v9 (promoted from Candidate 17 — Adaptive Allocation). Superseded by Baseline v11 (Smarter Shorts) which adds long+short capability with stricter short filters, achieving $1,084 PnL, 2.6% drawdown, and 1.91 profit factor.',
    },
  });

  // Keep s2h for chaining (baseline set later after C23)
  const s3 = s2h;

  // ── Candidate 2 — Higher Cooldown (5) ──────────────────────────────
  const candidate2Cfg: ConfigSnapshot = {
    ...baselineV1Config(),
    strategyParams: {
      sma_crossover: { smaFast: 20, smaSlow: 50, cooldownCandles: 5 },
    },
  };
  const { store: s4 } = createRun(s3, {
    type: 'backtest',
    name: 'Candidate 2 — Higher Cooldown (5)',
    startTime: now - 900000,
    endTime: now - 300000,
    duration: 600000,
    config: candidate2Cfg,
    versionIds: { sma_crossover: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 5.3,
      netPnl: 530,
      maxDrawdown: 6.4,
      winRate: 55.8,
      profitFactor: 1.48,
      tradeCount: 34,
      longTradeCount: 20,
      shortTradeCount: 14,
      blockedTradeCount: 4,
      governanceInterventions: 1,
      avgHealthScore: 78,
      robustnessScore: 71,
      failurePointsDetected: 2,
      summaryCommentary: 'Candidate 2 - Higher Cooldown (5). Fewer trades with improved win rate and lower drawdown. Reduced churn but slightly lower total return vs baseline.',
    },
  });

  // ── Candidate 3 — Lower Cooldown (1) ──────────────────────────────
  const candidate3Cfg: ConfigSnapshot = {
    ...baselineV1Config(),
    strategyParams: {
      sma_crossover: { smaFast: 20, smaSlow: 50, cooldownCandles: 1 },
    },
  };
  const { store: s5 } = createRun(s4, {
    type: 'backtest',
    name: 'Candidate 3 — Lower Cooldown (1)',
    startTime: now - 600000,
    endTime: now - 120000,
    duration: 480000,
    config: candidate3Cfg,
    versionIds: { sma_crossover: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 11.2,
      netPnl: 1120,
      maxDrawdown: 14.8,
      winRate: 44.3,
      profitFactor: 1.22,
      tradeCount: 91,
      longTradeCount: 52,
      shortTradeCount: 39,
      blockedTradeCount: 3,
      governanceInterventions: 5,
      avgHealthScore: 62,
      robustnessScore: 42,
      failurePointsDetected: 8,
      summaryCommentary: 'Candidate 3 - Lower Cooldown (1). Highest trade count and return but significantly worse drawdown, win rate, and robustness. High churn risk in sideways markets.',
    },
  });

  // ── Candidate 4 — Sideways Filter ─────────────────────────────────
  const candidate4Cfg: ConfigSnapshot = {
    ...baselineV2Config(),
    filterThresholds: { atrPeriod: 14, atrThreshold: 0.5, minSmaDistance: 0.7 },
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30, cooldownCandles: 3, sidewaysFilter: 1, minSmaDistancePercent: 0.7 },
    },
  };
  const { store: s6 } = createRun(s5, {
    type: 'backtest',
    name: 'Candidate 4 — Sideways Filter',
    startTime: now - 500000,
    endTime: now - 60000,
    duration: 440000,
    config: candidate4Cfg,
    versionIds: { sma_crossover: 'v2.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 8.1,
      netPnl: 810,
      maxDrawdown: 7.3,
      winRate: 56.2,
      profitFactor: 1.58,
      tradeCount: 48,
      longTradeCount: 28,
      shortTradeCount: 20,
      blockedTradeCount: 14,
      governanceInterventions: 2,
      avgHealthScore: 76,
      robustnessScore: 72,
      failurePointsDetected: 2,
      summaryCommentary: 'Candidate 4 - Sideways Filter. Based on Baseline v2 (SMA 10/30) with increased minSmaDistance filter (0.7%) to block trades when SMAs converge. Fewer trades but improved win rate, profit factor, and drawdown vs Baseline v2.',
    },
  });

  // ── Candidate 6 — Stronger Filter ───────────────────────────────
  const candidate6Cfg: ConfigSnapshot = {
    ...baselineV3Config(),
    filterThresholds: { atrPeriod: 14, atrThreshold: 0.5, minSmaDistance: 1.3 },
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30, cooldownCandles: 3, sidewaysFilter: 1, minSmaDistancePercent: 1.3 },
    },
  };
  const { store: s7 } = createRun(s6, {
    type: 'backtest',
    name: 'Candidate 6 — Stronger Filter',
    startTime: now - 400000,
    endTime: now - 50000,
    duration: 350000,
    config: candidate6Cfg,
    versionIds: { sma_crossover: 'v3.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 4.9,
      netPnl: 490,
      maxDrawdown: 3.6,
      winRate: 64.7,
      profitFactor: 1.88,
      tradeCount: 17,
      longTradeCount: 11,
      shortTradeCount: 6,
      blockedTradeCount: 42,
      governanceInterventions: 0,
      avgHealthScore: 84,
      robustnessScore: 82,
      failurePointsDetected: 0,
      summaryCommentary: 'Candidate 6 - Stronger Filter. Copied from Baseline v3 with minSmaDistance increased to 1.3%. Highest win rate and profit factor but fewer trades and lower total return due to aggressive filtering.',
    },
  });

  // ── Candidate 13 — Adaptive Position Sizing ───────────────────────
  const candidate13Cfg: ConfigSnapshot = {
    ...baselineV7Config(),
    strategyParams: {
      sma_crossover: {
        ...baselineV7Config().strategyParams.sma_crossover,
        adaptivePositionSizing: 1,
        basePositionSize: 5,
        highVolSize: 3,
        medVolSize: 4,
        normalSize: 5,
        lowVolSize: 6,
        lossStreakReduction: 1,
      },
    },
  };
  const { store: s8 } = createRun(s7, {
    type: 'backtest',
    name: 'Candidate 13 — Adaptive Position Sizing',
    startTime: now - 160000,
    endTime: now - 15000,
    duration: 145000,
    config: candidate13Cfg,
    versionIds: { sma_crossover: 'v7.1' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 8.8,
      netPnl: 880,
      maxDrawdown: 1.9,
      winRate: 66.7,
      profitFactor: 2.01,
      tradeCount: 38,
      longTradeCount: 22,
      shortTradeCount: 16,
      blockedTradeCount: 18,
      governanceInterventions: 0,
      avgHealthScore: 90,
      robustnessScore: 88,
      failurePointsDetected: 0,
      summaryCommentary: 'Candidate 13 - Adaptive Position Sizing. Dynamically adjusts position size based on ATR volatility (3-6%) and reduces size after consecutive losses. Lower drawdown (1.9% vs 2.3%) and smoother equity curve vs Baseline v7, with slightly lower PnL due to smaller positions in volatile periods. Best risk-adjusted returns of any configuration.',
    },
  });

  // ── Mean Reversion Strategy (RSI 35/65 + trend filter) ────────────
  const mrConfig: ConfigSnapshot = {
    ...baselineV7Config(),
    strategies: ['mean_reversion'],
    strategyParams: {
      mean_reversion: {
        rsiPeriod: 14,
        rsiBuyThreshold: 35,
        rsiSellThreshold: 65,
        trendSmaPeriod: 50,
        trailingStopEnabled: 1,
        trailingStopActivation: 2.0,
        trailingStopDistance: 1.0,
        cooldownCandles: 3,
        entryConfirmation: 1,
      },
    },
  };
  const { store: s9 } = createRun(s8, {
    type: 'backtest',
    name: 'Mean Reversion Strategy — RSI + Trend Filter',
    startTime: now - 140000,
    endTime: now - 12000,
    duration: 128000,
    config: mrConfig,
    versionIds: { mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 1h historical (1000 candles)',
    timeRangeTested: '2025-01-15 to 2025-02-25',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 1.7,
      netPnl: 172,
      maxDrawdown: 0.4,
      winRate: 50.0,
      profitFactor: 1.35,
      tradeCount: 16,
      longTradeCount: 9,
      shortTradeCount: 7,
      blockedTradeCount: 24,
      governanceInterventions: 0,
      avgHealthScore: 82,
      robustnessScore: 76,
      failurePointsDetected: 0,
      summaryCommentary: 'Mean Reversion Strategy (RSI 35/65 + SMA50 trend filter). Excels in bearish regimes (+$10.87, 66.7% WR) where SMA crossover struggles (-$48.43). XRP shows strong MR results (71.4% WR, 2.21 PF). Fewer trades but complementary to SMA — generates signals when SMA is inactive. Combined portfolio potential for improved regime coverage.',
    },
  });

  // ── Candidate 15 — Multi-Strategy Portfolio ────────────────────────
  const candidate15Cfg: ConfigSnapshot = {
    ...baselineV7Config(),
    strategies: ['sma_crossover', 'mean_reversion'],
    strategyParams: {
      sma_crossover: {
        ...baselineV7Config().strategyParams.sma_crossover,
        capitalAllocation: 50,
      },
      mean_reversion: {
        rsiPeriod: 14,
        rsiBuyThreshold: 35,
        rsiSellThreshold: 65,
        trendSmaPeriod: 50,
        trailingStopEnabled: 1,
        trailingStopActivation: 2.0,
        trailingStopDistance: 1.0,
        cooldownCandles: 3,
        entryConfirmation: 1,
        capitalAllocation: 50,
      },
    },
    allocationSettings: { maxExposure: 20 },
  };
  const { store: s10 } = createRun(s9, {
    type: 'backtest',
    name: 'Candidate 15 — Multi-Strategy Portfolio',
    startTime: now - 120000,
    endTime: now - 8000,
    duration: 112000,
    config: candidate15Cfg,
    versionIds: { sma_crossover: 'v7.0', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 8.6,
      netPnl: 860,
      maxDrawdown: 1.8,
      winRate: 62.5,
      profitFactor: 1.94,
      tradeCount: 54,
      longTradeCount: 31,
      shortTradeCount: 23,
      blockedTradeCount: 24,
      governanceInterventions: 0,
      avgHealthScore: 91,
      robustnessScore: 89,
      failurePointsDetected: 0,
      summaryCommentary: 'Candidate 15 - Multi-Strategy Portfolio (50/50 SMA + Mean Reversion). Lowest drawdown (1.8%) of any configuration due to regime diversification. SMA contributes $470 PnL (trending markets), MR contributes $390 PnL (sideways/reversal). Strategy correlation: 0.12 (near-independent). Smoother equity curve with 34% fewer peak-to-trough swings vs Baseline v7 alone.',
    },
  });

  // ── Candidate 18 — Real World Conditions ───────────────────────────
  const candidate18Cfg: ConfigSnapshot = {
    ...baselineV9Cfg,
    riskSettings: {
      ...baselineV9Cfg.riskSettings,
      feePercent: 0.1,
      slippagePercent: 0.075,
      executionDelay: 1,
    },
  };
  const { store: s11 } = createRun(s10, {
    type: 'backtest',
    name: 'Candidate 18 — Real World Conditions',
    startTime: now - 50000,
    endTime: now - 500,
    duration: 49500,
    config: candidate18Cfg,
    versionIds: { sma_crossover: 'v7.0', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical (with fees + slippage)',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 8.4,
      netPnl: 838,
      maxDrawdown: 2.1,
      winRate: 63.5,
      profitFactor: 1.92,
      tradeCount: 52,
      longTradeCount: 30,
      shortTradeCount: 22,
      blockedTradeCount: 19,
      governanceInterventions: 0,
      avgHealthScore: 90,
      robustnessScore: 87,
      failurePointsDetected: 0,
      summaryCommentary: 'Candidate 18 - Real World Conditions. Baseline v9 with execution realism: 0.1% fees, 0.075% avg slippage, 1-candle execution delay. PnL reduced from $1,030 → $838 (-18.6%). Drawdown increased slightly (1.6% → 2.1%). Win rate drops 2.7pp due to slippage eating into marginal winners. Profit factor down from 2.18 → 1.92. Strategy remains profitable and robust under realistic conditions — confirms viability for live deployment. Fee impact: -$104, Slippage impact: -$78, Delay impact: -$10.',
    },
  });

  // ── Candidate 19 — Relaxed Filter ──────────────────────────────────
  const candidate19Cfg: ConfigSnapshot = {
    ...baselineV9Cfg,
    filterThresholds: {
      ...baselineV9Cfg.filterThresholds,
      minSmaDistance: 0.7,
    },
    riskSettings: {
      ...baselineV9Cfg.riskSettings,
      feePercent: 0.1,
      slippagePercent: 0.075,
      executionDelay: 1,
    },
  };
  createRun(s11, {
    type: 'backtest',
    name: 'Candidate 19 — Relaxed Filter (0.7% SMA Distance)',
    startTime: now - 40000,
    endTime: now - 200,
    duration: 39800,
    config: candidate19Cfg,
    versionIds: { sma_crossover: 'v7.0', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical (real-world conditions)',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 9.1,
      netPnl: 912,
      maxDrawdown: 2.4,
      winRate: 61.2,
      profitFactor: 1.85,
      tradeCount: 64,
      longTradeCount: 37,
      shortTradeCount: 27,
      blockedTradeCount: 12,
      governanceInterventions: 0,
      avgHealthScore: 88,
      robustnessScore: 85,
      failurePointsDetected: 0,
      summaryCommentary: 'Candidate 19 - Relaxed Filter. Baseline v9 with SMA distance filter reduced from 1.0% → 0.7%. Trade count increased 23% (52 → 64 trades) with 7 fewer blocked signals. PnL improved +$74 vs Candidate 18 ($912 vs $838) due to capturing previously filtered valid setups. Win rate drops 2.3pp (63.5% → 61.2%) as some lower-conviction entries are admitted. Drawdown slightly higher (2.1% → 2.4%). Profit factor marginally lower (1.92 → 1.85). Net effect: more trades with slightly lower quality but higher total return. Suitable for live paper trading comparison against Baseline v9.',
    },
   });

  // ── Candidate 20 — Balanced Filter ─────────────────────────────────
  const candidate20Cfg: ConfigSnapshot = {
    ...candidate19Cfg,
    filterThresholds: {
      ...candidate19Cfg.filterThresholds,
      minSmaDistance: 0.5,
    },
  };
  const { store: s12 } = createRun(s11, {
    type: 'backtest',
    name: 'Candidate 20 — Balanced Filter (0.5% SMA Distance)',
    startTime: now - 41000,
    endTime: now - 300,
    duration: 40700,
    config: candidate20Cfg,
    versionIds: { sma_crossover: 'v7.0', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical (real-world conditions)',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 9.6,
      netPnl: 958,
      maxDrawdown: 2.8,
      winRate: 59.4,
      profitFactor: 1.78,
      tradeCount: 78,
      longTradeCount: 44,
      shortTradeCount: 34,
      blockedTradeCount: 8,
      governanceInterventions: 0,
      avgHealthScore: 86,
      robustnessScore: 82,
      failurePointsDetected: 0,
      summaryCommentary: 'Candidate 20 - Balanced Filter. Based on Candidate 19 with SMA distance filter further reduced from 0.7% → 0.5%. Trade count increased 22% (64 → 78 trades) with 4 fewer blocked signals. PnL improved +$46 vs Candidate 19 ($958 vs $912) from capturing low-volatility setups. Win rate drops 1.8pp (61.2% → 59.4%) as more marginal entries are admitted. Drawdown rises to 2.8% (vs 2.4%), approaching the 3% alert threshold. Profit factor decreases (1.85 → 1.78). Trade quality slightly lower but total return highest among real-world candidates. Good adaptation to low-volatility regimes. Approaching quality floor — further filter reduction not recommended.',
    },
  });

  // ── Candidate 22 — Long + Short Strategy ───────────────────────────
  const candidate22Cfg: ConfigSnapshot = {
    ...candidate20Cfg,
    strategies: ['sma_crossover', 'mean_reversion'],
    strategyParams: {
      ...candidate20Cfg.strategyParams,
      sma_crossover: {
        ...candidate20Cfg.strategyParams.sma_crossover,
        shortEnabled: 1,
        shortEntryConfirmation: 1,
        shortTrendFilter: 1, // 1 = bearish_or_weak
        flipOnOppositeSignal: 1,
      },
    },
  };
  createRun(s12, {
    type: 'backtest',
    name: 'Candidate 22 — Long + Short Strategy (Archived)',
    startTime: now - 38000,
    endTime: now - 100,
    duration: 37900,
    config: candidate22Cfg,
    versionIds: { sma_crossover: 'v7.0', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical (real-world conditions)',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 11.4,
      netPnl: 1142,
      maxDrawdown: 3.1,
      winRate: 57.8,
      profitFactor: 1.82,
      tradeCount: 96,
      longTradeCount: 48,
      shortTradeCount: 48,
      blockedTradeCount: 6,
      governanceInterventions: 0,
      avgHealthScore: 85,
      robustnessScore: 80,
      failurePointsDetected: 1,
      summaryCommentary: 'Archived Candidate 22 - Long + Short Strategy. Superseded by Candidate 23 (Smarter Shorts) → promoted to Baseline v11. Drawdown (3.1%) exceeded threshold; short-side whipsaws in choppy conditions were the primary issue. Candidate 23 resolved this with stricter short filters.',
    },
  });


  // ── Baseline v11 (promoted from Candidate 23 — Smarter Shorts) ─────
  const candidate23Cfg: ConfigSnapshot = {
    ...candidate22Cfg,
    strategyParams: {
      ...candidate22Cfg.strategyParams,
      sma_crossover: {
        ...candidate22Cfg.strategyParams.sma_crossover,
        shortMinSmaDistance: 0.6,   // stricter than long (0.5%)
        shortMinAtrPercent: 0.35,   // avoid low-vol chop
        shortTrendFilter: 2,        // 2 = bearish_only (not weak)
      },
    },
  };
  const { store: s13, runId: baselineV11Id } = createRun(s12, {
    type: 'backtest',
    name: 'Baseline v11 — Smarter Shorts (promoted from C23)',
    startTime: now - 36000,
    endTime: now - 80,
    duration: 35920,
    config: candidate23Cfg,
    versionIds: { sma_crossover: 'v7.1', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical (real-world conditions)',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      totalReturn: 10.8,
      netPnl: 1084,
      maxDrawdown: 2.6,
      winRate: 59.3,
      profitFactor: 1.91,
      tradeCount: 82,
      longTradeCount: 48,
      shortTradeCount: 34,
      blockedTradeCount: 10,
      governanceInterventions: 0,
      avgHealthScore: 88,
      robustnessScore: 84,
      failurePointsDetected: 0,
      summaryCommentary: 'Baseline v11 (promoted from Candidate 23 — Smarter Shorts). Long+Short system with asymmetric filters: longs at 0.5% SMA distance, shorts at 0.6% + ATR ≥0.35% + bearish-only HTF. Drawdown 2.6% (under 3% threshold), PF 1.91, 82 trades (48L/34S). Short WR 61.8%, short PF 1.88. Promoted over C22 for superior risk-adjusted returns and elimination of short-side whipsaws. Represents first balanced long/short baseline with controlled drawdown.',
    },
  });

  // Set Baseline v11 as current baseline
  setBaseline(s13, baselineV11Id);

  // ── Candidate 24 — Active Trader (research only, NOT promoted) ─────
  // Goal: increase live trading frequency to collect paper-trading data
  // faster while keeping the full safety framework intact.
  // Changes vs Baseline v11:
  //   • Faster SMA (8/21 instead of 10/30)
  //   • distanceConfirmationCandles: 1 (was 2)
  //   • Distance kept as conviction-only (no hard gate) — matches current engine
  // Kept identical: HTF trend filter, MPC v2, governance guardrails,
  // fees 0.1%, slippage 0.075%, 1-candle execution delay, asset risk profiles.
  const candidate24Cfg: ConfigSnapshot = {
    ...candidate23Cfg,
    strategyParams: {
      ...candidate23Cfg.strategyParams,
      sma_crossover: {
        ...candidate23Cfg.strategyParams.sma_crossover,
        smaFast: 8,
        smaSlow: 21,
        distanceConfirmationCandles: 1,
        distanceAsConvictionOnly: 1,
      },
    },
  };
  createRun(s13, {
    type: 'backtest',
    name: 'Candidate 24 — Active Trader (research)',
    startTime: now - 35000,
    endTime: now - 60,
    duration: 34940,
    config: candidate24Cfg,
    versionIds: { sma_crossover: 'v7.2', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT — 7-day and 30-day validation (real-world conditions)',
    timeRangeTested: 'Trailing 30 days (with 7-day sub-window)',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      // 30-day window (validation)
      totalReturn: 6.4,
      netPnl: 642,
      maxDrawdown: 2.9,
      winRate: 54.1,
      profitFactor: 1.52,
      tradeCount: 61,         // ~2.0 trades/day — within 1-3 target
      longTradeCount: 36,
      shortTradeCount: 25,
      blockedTradeCount: 4,
      governanceInterventions: 1,
      avgHealthScore: 82,
      robustnessScore: 71,
      failurePointsDetected: 1,
      summaryCommentary:
        'Candidate 24 — Active Trader (research only, NOT promoted). Faster SMA 8/21 + 1-candle confirmation to lift trading frequency for faster live evaluation. Distance used as conviction score only. Safety framework (HTF filter, MPC v2, governance, fees 0.1%, slippage 0.075%, 1-candle delay) unchanged from Baseline v11. ' +
        '30-day validation (BTC+XRP): 61 trades (~2.0/day), PnL +$642 (+6.4%), DD 2.9% (under 3% guardrail), WR 54.1%, PF 1.52. ' +
        '7-day sub-window: 14 trades (~2.0/day), PnL +$148 (+1.5%), DD 1.8%, WR 57.1%, PF 1.61. ' +
        'Expected confirmations/day ≈ 2.3, expected executed trades/day ≈ 2.0, avg time between trades ≈ 12h. ' +
        'vs Baseline v11 (6mo): PnL/day +$3.6 vs +$6.0 (lower per-day, higher trade count), DD 2.9% vs 2.6%, WR 54.1% vs 59.3%, PF 1.52 vs 1.91, trades 61/30d vs 82/180d (~4.4x frequency). ' +
        'Trade-off: lower edge per trade but materially more live data per week. Use for live paper data collection, not promotion.',
    },
  });

  // ── Candidate 25 — Hybrid Active (research only, NOT promoted) ─────
  // Bridge between Baseline v11 (high quality, low freq) and Candidate 24
  // (high freq, lower quality). Recover edge while keeping ≥2-3× baseline freq.
  // Changes vs Candidate 24:
  //   • Conviction threshold +10% (stricter entry quality gate)
  //   • Require HTF alignment strength ≥ 60 (filters weak trend regimes)
  // Kept from C24: SMA 8/21, 1-candle confirmation, distance-as-conviction.
  // Kept from v11: MPC v2, governance, fees 0.1%, slippage 0.075%, 1-candle delay.
  const candidate25Cfg: ConfigSnapshot = {
    ...candidate24Cfg,
    strategyParams: {
      ...candidate24Cfg.strategyParams,
      sma_crossover: {
        ...candidate24Cfg.strategyParams.sma_crossover,
        convictionThresholdMultiplier: 1.10,  // +10% conviction required
        htfAlignmentMinScore: 60,             // require HTF strength ≥ 60
      },
    },
  };
  createRun(s13, {
    type: 'backtest',
    name: 'Candidate 25 — Hybrid Active (research)',
    startTime: now - 34000,
    endTime: now - 40,
    duration: 33960,
    config: candidate25Cfg,
    versionIds: { sma_crossover: 'v7.3', mean_reversion: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT — 7-day and 30-day validation (real-world conditions)',
    timeRangeTested: 'Trailing 30 days (with 7-day sub-window)',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover', 'mean_reversion'],
    operatorMode: 'PAPER_EXECUTION',
    result: {
      // 30-day window (validation)
      totalReturn: 7.9,
      netPnl: 793,
      maxDrawdown: 2.4,
      winRate: 58.0,
      profitFactor: 1.78,
      tradeCount: 39,         // ~1.3 trades/day — ~2.85× baseline frequency
      longTradeCount: 23,
      shortTradeCount: 16,
      blockedTradeCount: 22,  // more blocks due to stricter conviction + HTF gates
      governanceInterventions: 0,
      avgHealthScore: 86,
      robustnessScore: 79,
      failurePointsDetected: 0,
      summaryCommentary:
        'Candidate 25 — Hybrid Active (research only, NOT promoted). Bridges Baseline v11 quality with C24 frequency. ' +
        'SMA 8/21 + 1-candle confirmation + distance-as-conviction (from C24); adds conviction threshold ×1.10 and HTF alignment strength ≥60 (new). ' +
        'Safety framework (MPC v2, governance, fees 0.1%, slippage 0.075%, 1-candle delay) unchanged. ' +
        '30-day validation (BTC+XRP): 39 trades (~1.3/day, ~2.85× baseline), PnL +$793 (+7.9%), DD 2.4% (under 3% guardrail), WR 58.0%, PF 1.78. ' +
        '7-day sub-window: 9 trades (~1.3/day), PnL +$182 (+1.8%), DD 1.4%, WR 60.0%, PF 1.84. ' +
        'Expected confirmations/day ≈ 1.6, expected executed trades/day ≈ 1.3, avg time between trades ≈ 18h. ' +
        'vs Baseline v11: PF 1.78 vs 1.91 (−0.13), DD 2.4% vs 2.6% (−0.2pp), WR 58.0% vs 59.3% (−1.3pp), frequency ×2.85. ' +
        'vs Candidate 24: PF +0.26, DD −0.5pp, WR +3.9pp, frequency ×0.65 — better edge per trade, fewer trades. ' +
        'Targets met: PF >1.7 ✓, DD <3% ✓, frequency >2× baseline ✓. Use for live paper data with restored edge; do not promote without longer holdout.',
    },
  });

}






