import {
  ExperimentStore, ExperimentRun, ConfigSnapshot, RunResult,
} from '@/types/experiment';
import { loadExperimentStore, createRun, setBaseline } from './experimentEngine';

const SEED_KEY = 'experiment-seed-v3';

function baselineConfig(): ConfigSnapshot {
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

function candidateConfig(): ConfigSnapshot {
  return {
    ...baselineConfig(),
    strategyParams: {
      sma_crossover: { smaFast: 10, smaSlow: 30 },
    },
  };
}

function baselineResult(): RunResult {
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
    summaryCommentary: 'Baseline v1: SMA 20/50 crossover. Stable trend-following with moderate drawdown. Sideways performance is the main weakness.',
  };
}

function candidateResult(): RunResult {
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
    summaryCommentary: 'Candidate 1 - Faster SMA 10/30. More trades and higher return but increased drawdown and lower win rate. Needs sideways-market evaluation.',
  };
}

export function seedExperiments(): void {
  if (localStorage.getItem(SEED_KEY)) return;

  let store = loadExperimentStore();

  // Create baseline run
  const now = Date.now();
  const { store: s1, runId: baselineId } = createRun(store, {
    type: 'backtest',
    name: 'Baseline v1 — SMA 20/50',
    startTime: now - 3600000,
    endTime: now - 1800000,
    duration: 1800000,
    config: baselineConfig(),
    versionIds: { sma_crossover: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: baselineResult(),
  });

  // Set as baseline
  const s2 = setBaseline(s1, baselineId);

  // Create candidate 1 run
  const { store: s3 } = createRun(s2, {
    type: 'backtest',
    name: 'Candidate 1 — Faster SMA 10/30',
    startTime: now - 1200000,
    endTime: now - 600000,
    duration: 600000,
    config: candidateConfig(),
    versionIds: { sma_crossover: 'v1.0' },
    datasetOrScenario: 'BTCUSDT + XRPUSDT 6-month historical',
    timeRangeTested: '2025-07-01 to 2025-12-31',
    assetsIncluded: ['BTCUSDT', 'XRPUSDT'],
    strategiesIncluded: ['sma_crossover'],
    operatorMode: 'PAPER_EXECUTION',
    result: candidateResult(),
  });

  // Create candidate 2 run — Higher Cooldown
  const candidate2Cfg: ConfigSnapshot = {
    ...baselineConfig(),
    strategyParams: {
      sma_crossover: { smaFast: 20, smaSlow: 50, cooldownCandles: 5 },
    },
  };
  createRun(s3, {
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

  localStorage.setItem(SEED_KEY, 'done');
