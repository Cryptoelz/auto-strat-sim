import { Asset } from '@/types/trading';

// ─── Run Types ───────────────────────────────────────────────────────────────

export type RunType =
  | 'backtest'
  | 'optimization'
  | 'paper_trading'
  | 'scenario_test'
  | 'stress_test'
  | 'strategy_comparison'
  | 'governance_experiment'
  | 'adaptation_experiment';

export type ExperimentTag =
  | 'baseline'
  | 'candidate'
  | 'stable'
  | 'experimental'
  | 'failed'
  | 'regression'
  | 'promising'
  | 'needs_review'
  | 'conservative'
  | 'aggressive';

export const EXPERIMENT_TAG_COLORS: Record<ExperimentTag, string> = {
  baseline: 'bg-blue-500/20 text-blue-400',
  candidate: 'bg-purple-500/20 text-purple-400',
  stable: 'bg-green-500/20 text-green-400',
  experimental: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  regression: 'bg-red-500/20 text-red-400',
  promising: 'bg-emerald-500/20 text-emerald-400',
  needs_review: 'bg-orange-500/20 text-orange-400',
  conservative: 'bg-cyan-500/20 text-cyan-400',
  aggressive: 'bg-rose-500/20 text-rose-400',
};

// ─── Configuration Snapshot ──────────────────────────────────────────────────

export interface ConfigSnapshot {
  assets: Asset[];
  strategies: string[];
  strategyParams: Record<string, Record<string, number>>;
  filterThresholds: Record<string, number>;
  riskSettings: {
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    feePercent: number;
    initialBalance: number;
  };
  allocationSettings: Record<string, number>;
  governanceSettings: {
    dailyLossLimit: number;
    drawdownLimit: number;
    consecutiveLossLimit: number;
    flipTradeLimit: number;
  };
  operatorPolicy: {
    autonomyMode: string;
    activePolicies: string[];
    activeOverrides: string[];
  };
  adaptationSettings: Record<string, number>;
  scenarioSettings?: Record<string, number>;
  timeframe: string;
  dateRange?: { start: string; end: string };
}

// ─── Strategy Version ────────────────────────────────────────────────────────

export interface StrategyVersion {
  id: string;
  name: string;
  version: number;
  timestamp: number;
  description: string;
  changeSummary: string;
  source: string;
  compatNotes?: string;
}

// ─── Run Result ──────────────────────────────────────────────────────────────

export interface RunResult {
  totalReturn: number;
  netPnl: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  tradeCount: number;
  longTradeCount: number;
  shortTradeCount: number;
  blockedTradeCount: number;
  governanceInterventions: number;
  avgHealthScore: number;
  robustnessScore: number;
  failurePointsDetected: number;
  summaryCommentary: string;
}

// ─── Experiment Run ──────────────────────────────────────────────────────────

export interface ExperimentRun {
  id: string;
  type: RunType;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  config: ConfigSnapshot;
  versionIds: Record<string, string>;
  datasetOrScenario: string;
  timeRangeTested: string;
  assetsIncluded: Asset[];
  strategiesIncluded: string[];
  operatorMode: string;
  result: RunResult;
  tags: ExperimentTag[];
  notes: ExperimentNote[];
  isBaseline: boolean;
}

// ─── Experiment Note ─────────────────────────────────────────────────────────

export interface ExperimentNote {
  id: string;
  timestamp: number;
  purpose: string;
  expectedOutcome: string;
  actualOutcome: string;
  observedProblems: string;
  nextActions: string;
  verdict: 'promote' | 'reject' | 'retest' | 'pending';
}

// ─── Best Run Registry ───────────────────────────────────────────────────────

export type BestRunCategory =
  | 'overall'
  | 'low_drawdown'
  | 'robustness'
  | 'btc'
  | 'xrp'
  | 'portfolio'
  | 'trending_market'
  | 'bearish_market'
  | 'stress_test_survivor';

export type BestRunRegistry = Partial<Record<BestRunCategory, string>>;

// ─── Run Comparison ──────────────────────────────────────────────────────────

export interface RunComparison {
  runA: string;
  runB: string;
  paramDiffs: Array<{ field: string; valueA: string | number; valueB: string | number }>;
  metricDiffs: Array<{
    metric: string;
    valueA: number;
    valueB: number;
    change: number;
    improved: boolean;
  }>;
  summary: string;
}

// ─── Audit Event ─────────────────────────────────────────────────────────────

export type AuditEventType =
  | 'run_created'
  | 'run_completed'
  | 'run_failed'
  | 'version_created'
  | 'version_promoted'
  | 'baseline_replaced'
  | 'config_cloned'
  | 'comparison_requested'
  | 'note_updated'
  | 'tag_updated';

export interface AuditEvent {
  id: string;
  timestamp: number;
  type: AuditEventType;
  runId?: string;
  description: string;
  details: Record<string, string | number>;
}

// ─── Experiment Store ────────────────────────────────────────────────────────

export interface ExperimentStore {
  runs: ExperimentRun[];
  versions: StrategyVersion[];
  bestRuns: BestRunRegistry;
  auditLog: AuditEvent[];
  currentBaselineId: string | null;
}

export const DEFAULT_EXPERIMENT_STORE: ExperimentStore = {
  runs: [],
  versions: [],
  bestRuns: {},
  auditLog: [],
  currentBaselineId: null,
};
