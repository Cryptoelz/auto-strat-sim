import {
  ExperimentStore, ExperimentRun, RunResult, ConfigSnapshot, ExperimentTag,
  ExperimentNote, RunComparison, AuditEvent, AuditEventType, StrategyVersion,
  BestRunCategory, DEFAULT_EXPERIMENT_STORE,
} from '@/types/experiment';

const STORAGE_KEY = 'experiment-store';

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadExperimentStore(): ExperimentStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_EXPERIMENT_STORE };
  } catch {
    return { ...DEFAULT_EXPERIMENT_STORE };
  }
}

export function saveExperimentStore(store: ExperimentStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ─── ID Generation ───────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Create Run ──────────────────────────────────────────────────────────────

export function createRun(
  store: ExperimentStore,
  run: Omit<ExperimentRun, 'id' | 'notes' | 'tags' | 'isBaseline'>
): { store: ExperimentStore; runId: string } {
  const id = uid();
  const newRun: ExperimentRun = {
    ...run,
    id,
    tags: [],
    notes: [],
    isBaseline: false,
  };
  const audit = createAuditEvent('run_created', id, `Run "${run.name}" created`);
  const completionAudit = createAuditEvent('run_completed', id, `Run "${run.name}" completed`);
  const updated: ExperimentStore = {
    ...store,
    runs: [newRun, ...store.runs].slice(0, 200),
    auditLog: [completionAudit, audit, ...store.auditLog].slice(0, 500),
    bestRuns: updateBestRuns(store.bestRuns, newRun),
  };
  saveExperimentStore(updated);
  return { store: updated, runId: id };
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export function updateTags(
  store: ExperimentStore, runId: string, tags: ExperimentTag[]
): ExperimentStore {
  const updated: ExperimentStore = {
    ...store,
    runs: store.runs.map(r => r.id === runId ? { ...r, tags } : r),
    auditLog: [createAuditEvent('tag_updated', runId, `Tags updated to: ${tags.join(', ')}`), ...store.auditLog].slice(0, 500),
  };
  saveExperimentStore(updated);
  return updated;
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export function addNote(
  store: ExperimentStore, runId: string, note: Omit<ExperimentNote, 'id' | 'timestamp'>
): ExperimentStore {
  const newNote: ExperimentNote = { ...note, id: uid(), timestamp: Date.now() };
  const updated: ExperimentStore = {
    ...store,
    runs: store.runs.map(r => r.id === runId ? { ...r, notes: [...r.notes, newNote] } : r),
    auditLog: [createAuditEvent('note_updated', runId, `Note added: ${note.purpose.slice(0, 50)}`), ...store.auditLog].slice(0, 500),
  };
  saveExperimentStore(updated);
  return updated;
}

// ─── Baseline ────────────────────────────────────────────────────────────────

export function setBaseline(store: ExperimentStore, runId: string): ExperimentStore {
  const oldBaselineId = store.currentBaselineId;
  const updated: ExperimentStore = {
    ...store,
    currentBaselineId: runId,
    runs: store.runs.map(r => ({
      ...r,
      isBaseline: r.id === runId,
      tags: r.id === runId && !r.tags.includes('baseline')
        ? [...r.tags.filter(t => t !== 'candidate'), 'baseline'] as ExperimentTag[]
        : r.id === oldBaselineId
          ? r.tags.filter(t => t !== 'baseline') as ExperimentTag[]
          : r.tags,
    })),
    auditLog: [createAuditEvent('baseline_replaced', runId, `Baseline set to run ${runId}`), ...store.auditLog].slice(0, 500),
  };
  saveExperimentStore(updated);
  return updated;
}

// ─── Delete Run ──────────────────────────────────────────────────────────────

export function deleteRun(store: ExperimentStore, runId: string): ExperimentStore {
  const updated: ExperimentStore = {
    ...store,
    runs: store.runs.filter(r => r.id !== runId),
    currentBaselineId: store.currentBaselineId === runId ? null : store.currentBaselineId,
  };
  saveExperimentStore(updated);
  return updated;
}

// ─── Compare Runs ────────────────────────────────────────────────────────────

export function compareRuns(store: ExperimentStore, runAId: string, runBId: string): RunComparison | null {
  const runA = store.runs.find(r => r.id === runAId);
  const runB = store.runs.find(r => r.id === runBId);
  if (!runA || !runB) return null;

  const metricKeys: Array<{ key: keyof RunResult; label: string; higherBetter: boolean }> = [
    { key: 'totalReturn', label: 'Total Return %', higherBetter: true },
    { key: 'netPnl', label: 'Net P&L', higherBetter: true },
    { key: 'maxDrawdown', label: 'Max Drawdown %', higherBetter: false },
    { key: 'winRate', label: 'Win Rate %', higherBetter: true },
    { key: 'profitFactor', label: 'Profit Factor', higherBetter: true },
    { key: 'tradeCount', label: 'Trade Count', higherBetter: true },
    { key: 'robustnessScore', label: 'Robustness', higherBetter: true },
    { key: 'governanceInterventions', label: 'Gov. Interventions', higherBetter: false },
  ];

  const metricDiffs = metricKeys.map(({ key, label, higherBetter }) => {
    const vA = runA.result[key] as number;
    const vB = runB.result[key] as number;
    const change = vB - vA;
    return {
      metric: label,
      valueA: vA,
      valueB: vB,
      change,
      improved: higherBetter ? change > 0 : change < 0,
    };
  });

  const paramDiffs: RunComparison['paramDiffs'] = [];
  const cfgA = runA.config;
  const cfgB = runB.config;
  if (cfgA.timeframe !== cfgB.timeframe) paramDiffs.push({ field: 'Timeframe', valueA: cfgA.timeframe, valueB: cfgB.timeframe });
  if (cfgA.riskSettings.positionSizePercent !== cfgB.riskSettings.positionSizePercent) paramDiffs.push({ field: 'Position Size %', valueA: cfgA.riskSettings.positionSizePercent, valueB: cfgB.riskSettings.positionSizePercent });
  if (cfgA.riskSettings.stopLossPercent !== cfgB.riskSettings.stopLossPercent) paramDiffs.push({ field: 'Stop Loss %', valueA: cfgA.riskSettings.stopLossPercent, valueB: cfgB.riskSettings.stopLossPercent });
  if (cfgA.riskSettings.takeProfitPercent !== cfgB.riskSettings.takeProfitPercent) paramDiffs.push({ field: 'Take Profit %', valueA: cfgA.riskSettings.takeProfitPercent, valueB: cfgB.riskSettings.takeProfitPercent });
  if (JSON.stringify(cfgA.assets) !== JSON.stringify(cfgB.assets)) paramDiffs.push({ field: 'Assets', valueA: cfgA.assets.join(', '), valueB: cfgB.assets.join(', ') });
  if (cfgA.operatorPolicy.autonomyMode !== cfgB.operatorPolicy.autonomyMode) paramDiffs.push({ field: 'Autonomy Mode', valueA: cfgA.operatorPolicy.autonomyMode, valueB: cfgB.operatorPolicy.autonomyMode });

  const improvements = metricDiffs.filter(m => m.improved).length;
  const regressions = metricDiffs.filter(m => !m.improved && m.change !== 0).length;

  let summary = '';
  if (improvements > regressions) {
    summary = `Run B improved ${improvements} metrics vs Run A. Key gains in ${metricDiffs.filter(m => m.improved).map(m => m.metric).join(', ')}.`;
  } else if (regressions > improvements) {
    summary = `Run B regressed on ${regressions} metrics vs Run A. Declines in ${metricDiffs.filter(m => !m.improved && m.change !== 0).map(m => m.metric).join(', ')}.`;
  } else {
    summary = 'Both runs performed similarly with mixed results across metrics.';
  }

  return { runA: runAId, runB: runBId, paramDiffs, metricDiffs, summary };
}

// ─── Generate Explainability ─────────────────────────────────────────────────

export function generateRunExplanation(run: ExperimentRun, baseline?: ExperimentRun): string {
  const lines: string[] = [];
  const r = run.result;

  if (r.totalReturn > 5) lines.push(`Strong positive return of ${r.totalReturn.toFixed(1)}%.`);
  else if (r.totalReturn < -5) lines.push(`Significant negative return of ${r.totalReturn.toFixed(1)}%.`);
  else lines.push(`Modest return of ${r.totalReturn.toFixed(1)}%.`);

  if (r.maxDrawdown > 15) lines.push(`High max drawdown of ${r.maxDrawdown.toFixed(1)}% indicates risk.`);
  else if (r.maxDrawdown < 5) lines.push(`Well-controlled drawdown at ${r.maxDrawdown.toFixed(1)}%.`);

  if (r.winRate > 55) lines.push(`Above-average win rate of ${r.winRate.toFixed(1)}%.`);
  else if (r.winRate < 40) lines.push(`Low win rate of ${r.winRate.toFixed(1)}% suggests weak signal quality.`);

  if (r.governanceInterventions > 5) lines.push(`Governance intervened ${r.governanceInterventions} times, indicating unstable conditions.`);

  if (r.failurePointsDetected > 3) lines.push(`${r.failurePointsDetected} failure points detected — review recommended.`);

  if (baseline) {
    const retDiff = r.totalReturn - baseline.result.totalReturn;
    if (retDiff > 2) lines.push(`Outperformed baseline by ${retDiff.toFixed(1)}%.`);
    else if (retDiff < -2) lines.push(`Underperformed baseline by ${Math.abs(retDiff).toFixed(1)}%.`);
  }

  return lines.join(' ');
}

// ─── Promotion Check ─────────────────────────────────────────────────────────

export function checkPromotionEligibility(run: ExperimentRun): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const r = run.result;

  if (r.maxDrawdown > 20) reasons.push('Max drawdown exceeds 20%');
  if (r.robustnessScore < 40) reasons.push('Robustness score below 40');
  if (r.winRate < 35) reasons.push('Win rate below 35%');
  if (r.profitFactor < 1) reasons.push('Profit factor below 1.0');
  if (r.failurePointsDetected > 5) reasons.push('Too many failure points');
  if (run.tags.includes('failed')) reasons.push('Run tagged as failed');

  return { eligible: reasons.length === 0, reasons };
}

// ─── Strategy Versions ───────────────────────────────────────────────────────

export function addStrategyVersion(
  store: ExperimentStore,
  version: Omit<StrategyVersion, 'id' | 'timestamp'>
): ExperimentStore {
  const newVersion: StrategyVersion = { ...version, id: uid(), timestamp: Date.now() };
  const updated: ExperimentStore = {
    ...store,
    versions: [newVersion, ...store.versions].slice(0, 100),
    auditLog: [createAuditEvent('version_created', newVersion.id, `Version "${version.name} v${version.version}" created`), ...store.auditLog].slice(0, 500),
  };
  saveExperimentStore(updated);
  return updated;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportExperiments(store: ExperimentStore): string {
  const lines: string[] = ['EXPERIMENT REPORT'];
  lines.push(`Total Runs: ${store.runs.length}`);
  lines.push(`Baseline: ${store.currentBaselineId || 'None'}`);
  lines.push('');
  lines.push('ID,Name,Type,Return%,MaxDD%,WinRate%,PF,Trades,Robustness,Tags');
  store.runs.forEach(r => {
    lines.push([
      r.id.slice(0, 8), `"${r.name}"`, r.type,
      r.result.totalReturn.toFixed(2), r.result.maxDrawdown.toFixed(2),
      r.result.winRate.toFixed(1), r.result.profitFactor.toFixed(2),
      r.result.tradeCount, r.result.robustnessScore.toFixed(0),
      `"${r.tags.join(', ')}"`,
    ].join(','));
  });
  return lines.join('\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createAuditEvent(type: AuditEventType, runId: string, description: string): AuditEvent {
  return { id: uid(), timestamp: Date.now(), type, runId, description, details: {} };
}

function updateBestRuns(current: ExperimentStore['bestRuns'], run: ExperimentRun): ExperimentStore['bestRuns'] {
  const best = { ...current };
  // We'd normally look up existing runs, but for simplicity we just check if empty
  const categories: Array<{ cat: BestRunCategory; check: () => boolean }> = [
    { cat: 'overall', check: () => run.result.totalReturn > 0 && run.result.robustnessScore > 50 },
    { cat: 'low_drawdown', check: () => run.result.maxDrawdown < 10 },
    { cat: 'robustness', check: () => run.result.robustnessScore > 70 },
    { cat: 'stress_test_survivor', check: () => run.type === 'stress_test' && run.result.totalReturn > 0 },
  ];
  if (run.assetsIncluded.length === 1 && run.assetsIncluded[0] === 'BTCUSDT') {
    categories.push({ cat: 'btc', check: () => run.result.totalReturn > 0 });
  }
  if (run.assetsIncluded.length === 1 && run.assetsIncluded[0] === 'XRPUSDT') {
    categories.push({ cat: 'xrp', check: () => run.result.totalReturn > 0 });
  }
  categories.forEach(({ cat, check }) => {
    if (!best[cat] && check()) best[cat] = run.id;
  });
  return best;
}

// ─── Create Demo Runs ────────────────────────────────────────────────────────

export function createDemoRuns(): ExperimentRun[] {
  const baseConfig: ConfigSnapshot = {
    assets: ['BTCUSDT', 'XRPUSDT'],
    strategies: ['SMA Crossover'],
    strategyParams: { sma: { fastSMA: 20, slowSMA: 50 } },
    filterThresholds: { minVolatility: 0.5 },
    riskSettings: { positionSizePercent: 2, stopLossPercent: 2, takeProfitPercent: 4, feePercent: 0.1, initialBalance: 10000 },
    allocationSettings: { BTCUSDT: 60, XRPUSDT: 40 },
    governanceSettings: { dailyLossLimit: 3, drawdownLimit: 15, consecutiveLossLimit: 5, flipTradeLimit: 4 },
    operatorPolicy: { autonomyMode: 'PAPER_EXECUTION', activePolicies: [], activeOverrides: [] },
    adaptationSettings: { learningRate: 0.1 },
    timeframe: '15m',
  };

  const now = Date.now();
  return [
    {
      id: 'demo-1', type: 'backtest', name: 'SMA 20/50 Baseline', startTime: now - 3600000, endTime: now - 3000000, duration: 600000,
      config: baseConfig, versionIds: { sma: 'v1' }, datasetOrScenario: '30-day historical', timeRangeTested: 'Jan 1 - Jan 30',
      assetsIncluded: ['BTCUSDT', 'XRPUSDT'], strategiesIncluded: ['SMA Crossover'], operatorMode: 'PAPER_EXECUTION',
      result: { totalReturn: 8.5, netPnl: 850, maxDrawdown: 6.2, winRate: 54, profitFactor: 1.65, tradeCount: 42, longTradeCount: 28, shortTradeCount: 14, blockedTradeCount: 3, governanceInterventions: 1, avgHealthScore: 78, robustnessScore: 65, failurePointsDetected: 1, summaryCommentary: 'Solid baseline with moderate drawdown.' },
      tags: ['baseline', 'stable'], notes: [], isBaseline: true,
    },
    {
      id: 'demo-2', type: 'backtest', name: 'SMA 10/30 Aggressive', startTime: now - 2400000, endTime: now - 1800000, duration: 600000,
      config: { ...baseConfig, strategyParams: { sma: { fastSMA: 10, slowSMA: 30 } } }, versionIds: { sma: 'v2' }, datasetOrScenario: '30-day historical', timeRangeTested: 'Jan 1 - Jan 30',
      assetsIncluded: ['BTCUSDT', 'XRPUSDT'], strategiesIncluded: ['SMA Crossover'], operatorMode: 'PAPER_EXECUTION',
      result: { totalReturn: 12.3, netPnl: 1230, maxDrawdown: 14.5, winRate: 48, profitFactor: 1.42, tradeCount: 78, longTradeCount: 45, shortTradeCount: 33, blockedTradeCount: 5, governanceInterventions: 4, avgHealthScore: 62, robustnessScore: 45, failurePointsDetected: 4, summaryCommentary: 'Higher return but unstable — too many flip trades and high drawdown.' },
      tags: ['candidate', 'aggressive'], notes: [], isBaseline: false,
    },
    {
      id: 'demo-3', type: 'stress_test', name: 'Crash Scenario Test', startTime: now - 1200000, endTime: now - 600000, duration: 600000,
      config: baseConfig, versionIds: { sma: 'v1' }, datasetOrScenario: 'Sudden Crash', timeRangeTested: 'Synthetic',
      assetsIncluded: ['BTCUSDT'], strategiesIncluded: ['SMA Crossover'], operatorMode: 'PAPER_EXECUTION',
      result: { totalReturn: -3.2, netPnl: -320, maxDrawdown: 18.7, winRate: 35, profitFactor: 0.72, tradeCount: 15, longTradeCount: 10, shortTradeCount: 5, blockedTradeCount: 8, governanceInterventions: 6, avgHealthScore: 42, robustnessScore: 30, failurePointsDetected: 7, summaryCommentary: 'Governance helped limit losses during crash but too many entries were taken before pause.' },
      tags: ['needs_review'], notes: [], isBaseline: false,
    },
  ];
}
