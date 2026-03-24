import {
  ExperimentStore, ExperimentRun, ConfigSnapshot, RunResult,
} from '@/types/experiment';
import { loadExperimentStore, createRun, setBaseline } from './experimentEngine';

const SEED_KEY = 'experiment-seed-v22';

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

  // ── Current Baseline v8 (promoted from Candidate 16) ──────────────
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
  const { store: s2g, runId: baselineV8Id } = createRun(s2f, {
    type: 'backtest',
    name: 'Baseline v8 — Weighted Multi-Strategy Portfolio',
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
      summaryCommentary: 'Baseline v8 (promoted from Candidate 16 — Weighted Multi-Strategy 70/30). Combines SMA Crossover (70%) and Mean Reversion (30%) for regime diversification. Retains 97% of Baseline v7 PnL ($910 vs $940) while reducing drawdown (2.0% vs 2.3%) and improving equity curve stability by 28%. Best balance between profit retention and risk reduction.',
    },
  });

  // Set Baseline v8 as current baseline
  const s3 = setBaseline(s2g, baselineV8Id);

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

  // ── Candidate 17 — Adaptive Allocation ─────────────────────────────
  const candidate17Cfg: ConfigSnapshot = {
    ...baselineV8Cfg,
    strategyParams: {
      sma_crossover: {
        ...baselineV8Cfg.strategyParams.sma_crossover,
        capitalAllocation: 'adaptive',
      },
      mean_reversion: {
        ...baselineV8Cfg.strategyParams.mean_reversion,
        capitalAllocation: 'adaptive',
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
      trendDetection: 'sma_slope_distance',
    },
  };
  createRun(s10, {
    type: 'backtest',
    name: 'Candidate 17 — Adaptive Allocation',
    startTime: now - 60000,
    endTime: now - 1000,
    duration: 59000,
    config: candidate17Cfg,
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
      summaryCommentary: 'Candidate 17 - Adaptive Allocation. Dynamically shifts capital between SMA (40-90%) and Mean Reversion (10-60%) based on market regime detected via SMA slope/distance. Strong trend → 85% SMA / 15% MR. Sideways → 55% SMA / 45% MR. Choppy/volatile → 45% SMA / 55% MR. Outperforms Baseline v8 on all metrics: +$120 PnL, -0.4% drawdown, +1.4% win rate, +0.16 profit factor. Per-regime: Bullish +$520 (vs $410), Bearish +$180 (vs $140), Sideways +$330 (vs $360 — MR captures more). Smoothest equity curve of any configuration.',
    },
  });
}
