import {
  ExperimentStore, ExperimentRun, ConfigSnapshot, RunResult,
} from '@/types/experiment';
import { loadExperimentStore, createRun, setBaseline } from './experimentEngine';

const SEED_KEY = 'experiment-seed-v6';

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
    summaryCommentary: 'Baseline v2 (promoted from Candidate 1 — Faster SMA). Highest average PnL across scenarios, lowest variance (most stable), consistently outperformed Baseline v1.',
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

  // ── Current Baseline v2 (promoted from Candidate 1) ────────────────
  const { store: s2, runId: baselineV2Id } = createRun(s1, {
    type: 'backtest',
    name: 'Baseline v2 — Faster SMA 10/30',
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

  // Set Baseline v2 as current baseline
  const s3 = setBaseline(s2, baselineV2Id);

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
  createRun(s4, {
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
    filterThresholds: { atrPeriod: 14, atrThreshold: 0.5, minSmaDistance: 0.3 },
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30, cooldownCandles: 3, sidewaysFilter: true, minSmaDistancePercent: 0.3 },
    },
  };
  createRun(s4, {
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
      summaryCommentary: 'Candidate 4 - Sideways Filter. Based on Baseline v2 (SMA 10/30) with increased minSmaDistance filter (0.3%) to block trades when SMAs converge. Fewer trades but improved win rate, profit factor, and drawdown vs Baseline v2.',
    },
  });

  localStorage.setItem(SEED_KEY, 'done');
}
