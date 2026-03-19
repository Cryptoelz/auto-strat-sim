import { ExperimentRun, RunResult, ConfigSnapshot } from '@/types/experiment';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TestPhase = 'backtest' | 'out_of_sample' | 'scenario_test';

export interface PhaseResult {
  phase: TestPhase;
  label: string;
  status: 'passed' | 'failed' | 'warning';
  metrics: RunResult;
  explanation: string;
  duration: string;
}

export interface ResearchCycleResult {
  id: string;
  timestamp: number;
  baselineRunId: string;
  candidateRunId: string;
  phases: PhaseResult[];
  overallPassed: boolean;
  summary: string;
  sideBySide: SideBySideMetric[];
}

export interface SideBySideMetric {
  label: string;
  baselineValue: number;
  candidateValue: number;
  change: number;
  changePercent: number;
  improved: boolean;
  unit: string;
}

// ─── Simulate Test Phases ────────────────────────────────────────────────────

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

function deriveMetrics(source: RunResult, volatility: number): RunResult {
  return {
    totalReturn: jitter(source.totalReturn, source.totalReturn * volatility),
    netPnl: jitter(source.netPnl, Math.abs(source.netPnl) * volatility),
    maxDrawdown: Math.max(0.5, jitter(source.maxDrawdown, source.maxDrawdown * volatility)),
    winRate: Math.min(100, Math.max(5, jitter(source.winRate, 12 * volatility))),
    profitFactor: Math.max(0.1, jitter(source.profitFactor, 0.5 * volatility)),
    tradeCount: Math.max(5, Math.round(jitter(source.tradeCount, source.tradeCount * 0.3))),
    longTradeCount: Math.max(2, Math.round(source.longTradeCount * jitter(1, 0.2))),
    shortTradeCount: Math.max(1, Math.round(source.shortTradeCount * jitter(1, 0.3))),
    blockedTradeCount: Math.max(0, Math.round(jitter(source.blockedTradeCount, 3))),
    governanceInterventions: Math.max(0, Math.round(jitter(source.governanceInterventions, 2))),
    avgHealthScore: Math.min(100, Math.max(10, jitter(source.avgHealthScore, 15))),
    robustnessScore: Math.min(100, Math.max(5, jitter(source.robustnessScore, 20 * volatility))),
    failurePointsDetected: Math.max(0, Math.round(jitter(source.failurePointsDetected, 3))),
    summaryCommentary: '',
  };
}

function simulatePhase(
  phase: TestPhase,
  candidateResult: RunResult,
): PhaseResult {
  const labels: Record<TestPhase, string> = {
    backtest: 'In-Sample Backtest',
    out_of_sample: 'Out-of-Sample Validation',
    scenario_test: 'Scenario Stress Test',
  };
  const volatilities: Record<TestPhase, number> = {
    backtest: 0.1,
    out_of_sample: 0.35,
    scenario_test: 0.5,
  };
  const durations: Record<TestPhase, string> = {
    backtest: '30-day historical',
    out_of_sample: '15-day holdout',
    scenario_test: '12 synthetic scenarios',
  };

  const metrics = deriveMetrics(candidateResult, volatilities[phase]);

  // Determine status
  let status: PhaseResult['status'] = 'passed';
  const issues: string[] = [];

  if (metrics.totalReturn < -5) { status = 'failed'; issues.push(`negative return (${metrics.totalReturn.toFixed(1)}%)`); }
  if (metrics.maxDrawdown > 20) { status = status === 'failed' ? 'failed' : 'warning'; issues.push(`high drawdown (${metrics.maxDrawdown.toFixed(1)}%)`); }
  if (metrics.profitFactor < 0.8) { status = 'failed'; issues.push(`weak profit factor (${metrics.profitFactor.toFixed(2)})`); }
  if (metrics.robustnessScore < 30) { status = status === 'failed' ? 'failed' : 'warning'; issues.push(`low robustness (${metrics.robustnessScore.toFixed(0)})`); }

  const explanation = issues.length > 0
    ? `${labels[phase]}: ${issues.join(', ')}.`
    : `${labels[phase]} passed — ${metrics.totalReturn.toFixed(1)}% return, ${metrics.maxDrawdown.toFixed(1)}% DD, PF ${metrics.profitFactor.toFixed(2)}.`;

  metrics.summaryCommentary = explanation;

  return { phase, label: labels[phase], status, metrics, explanation, duration: durations[phase] };
}

// ─── Side-by-Side Builder ────────────────────────────────────────────────────

function buildSideBySide(baseline: RunResult, candidate: RunResult): SideBySideMetric[] {
  const rows: Array<{ key: keyof RunResult; label: string; unit: string; higherBetter: boolean }> = [
    { key: 'totalReturn', label: 'Total Return', unit: '%', higherBetter: true },
    { key: 'netPnl', label: 'Net P&L', unit: '$', higherBetter: true },
    { key: 'maxDrawdown', label: 'Max Drawdown', unit: '%', higherBetter: false },
    { key: 'winRate', label: 'Win Rate', unit: '%', higherBetter: true },
    { key: 'profitFactor', label: 'Profit Factor', unit: 'x', higherBetter: true },
    { key: 'tradeCount', label: 'Trade Count', unit: '', higherBetter: true },
    { key: 'robustnessScore', label: 'Robustness', unit: '/100', higherBetter: true },
    { key: 'governanceInterventions', label: 'Gov. Interventions', unit: '', higherBetter: false },
  ];

  return rows.map(({ key, label, unit, higherBetter }) => {
    const bv = baseline[key] as number;
    const cv = candidate[key] as number;
    const change = cv - bv;
    const changePercent = bv !== 0 ? (change / Math.abs(bv)) * 100 : 0;
    return {
      label, baselineValue: bv, candidateValue: cv, change, changePercent,
      improved: higherBetter ? change > 0 : change < 0,
      unit,
    };
  });
}

// ─── Run Full Research Cycle ─────────────────────────────────────────────────

export function runResearchCycle(
  baseline: ExperimentRun,
  candidate: ExperimentRun,
): ResearchCycleResult {
  const phases: PhaseResult[] = [
    simulatePhase('backtest', candidate.result),
    simulatePhase('out_of_sample', candidate.result),
    simulatePhase('scenario_test', candidate.result),
  ];

  const failed = phases.filter(p => p.status === 'failed').length;
  const warnings = phases.filter(p => p.status === 'warning').length;
  const overallPassed = failed === 0;

  let summary: string;
  if (failed === 0 && warnings === 0) {
    summary = `All 3 test phases passed. Candidate "${candidate.name}" is eligible for promotion evaluation.`;
  } else if (failed === 0) {
    summary = `Candidate "${candidate.name}" passed all phases with ${warnings} warning(s). Proceed with caution.`;
  } else {
    summary = `Candidate "${candidate.name}" failed ${failed} phase(s). Not recommended for promotion.`;
  }

  return {
    id: `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    baselineRunId: baseline.id,
    candidateRunId: candidate.id,
    phases,
    overallPassed,
    summary,
    sideBySide: buildSideBySide(baseline.result, candidate.result),
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const CYCLE_STORAGE_KEY = 'research-cycle-history';

export interface ResearchCycleHistory {
  cycles: Array<{
    id: string;
    timestamp: number;
    baselineName: string;
    candidateName: string;
    phasesPassed: number;
    phasesTotal: number;
    overallPassed: boolean;
    verdict: 'promoted' | 'rejected' | 'pending';
    summary: string;
  }>;
}

export function loadCycleHistory(): ResearchCycleHistory {
  try {
    const raw = localStorage.getItem(CYCLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { cycles: [] };
  } catch { return { cycles: [] }; }
}

export function saveCycleEntry(
  result: ResearchCycleResult,
  baselineName: string,
  candidateName: string,
  verdict: 'promoted' | 'rejected' | 'pending',
) {
  const history = loadCycleHistory();
  history.cycles.unshift({
    id: result.id,
    timestamp: result.timestamp,
    baselineName, candidateName,
    phasesPassed: result.phases.filter(p => p.status !== 'failed').length,
    phasesTotal: result.phases.length,
    overallPassed: result.overallPassed,
    verdict, summary: result.summary,
  });
  history.cycles = history.cycles.slice(0, 50);
  localStorage.setItem(CYCLE_STORAGE_KEY, JSON.stringify(history));
}
