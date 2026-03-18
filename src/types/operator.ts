// Operator control & policy types — simulation only

export type AutonomyMode =
  | 'OBSERVE_ONLY'
  | 'SIGNALS_ONLY'
  | 'PAPER_EXECUTION'
  | 'SUPERVISED_AGENT'
  | 'FULL_SIMULATION_AUTONOMY';

export type PolicyRuleType =
  | 'asset_enabled'
  | 'strategy_enabled'
  | 'no_shorts'
  | 'max_positions'
  | 'time_restriction'
  | 'drawdown_block'
  | 'adaptation_mode_lock'
  | 'allocation_cap'
  | 'strategy_switch_limit';

export interface PolicyRule {
  id: string;
  type: PolicyRuleType;
  enabled: boolean;
  label: string;
  description: string;
  params: Record<string, any>;
}

export interface ManualOverride {
  id: string;
  type: string;
  label: string;
  active: boolean;
  appliedAt: number | null;
  expiresAt: number | null;
  reason: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface ApprovalRequest {
  id: string;
  timestamp: number;
  action: string;
  asset?: string;
  strategy?: string;
  reason: string;
  confidence: number;
  riskContext: string;
  status: ApprovalStatus;
  resolvedAt?: number;
}

export interface OperatorAuditEntry {
  id: string;
  timestamp: number;
  action: string;
  priorState: string;
  newState: string;
  policyAffected?: string;
  assetsAffected?: string[];
  strategiesAffected?: string[];
  reason: string;
  restrictions: string[];
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  autonomyMode: AutonomyMode;
  policies: PolicyRule[];
  overrides: Partial<Record<string, boolean>>;
}

export interface OperatorState {
  agentEnabled: boolean;
  autonomyMode: AutonomyMode;
  overrides: ManualOverride[];
  policies: PolicyRule[];
  approvals: ApprovalRequest[];
  auditLog: OperatorAuditEntry[];
  activeTemplate: string | null;
}

export interface OperatorConfig {
  defaultAutonomyMode: AutonomyMode;
  approvalRequiredActions: string[];
  maxManualOverrideDurationMs: number;
  supervisedReviewTimeoutMs: number;
}

export const DEFAULT_OPERATOR_CONFIG: OperatorConfig = {
  defaultAutonomyMode: 'PAPER_EXECUTION',
  approvalRequiredActions: ['open_position', 'switch_strategy', 'increase_allocation', 'reactivate_after_pause'],
  maxManualOverrideDurationMs: 24 * 60 * 60 * 1000,
  supervisedReviewTimeoutMs: 5 * 60 * 1000,
};

// Default overrides
export const DEFAULT_OVERRIDES: ManualOverride[] = [
  { id: 'pause_all', type: 'pause_all', label: 'Pause All Trading', active: false, appliedAt: null, expiresAt: null, reason: '' },
  { id: 'no_new_entries', type: 'no_new_entries', label: 'No New Entries', active: false, appliedAt: null, expiresAt: null, reason: '' },
  { id: 'exits_only', type: 'exits_only', label: 'Exits Only Mode', active: false, appliedAt: null, expiresAt: null, reason: '' },
  { id: 'reduce_size', type: 'reduce_size', label: 'Reduce Max Position Size (50%)', active: false, appliedAt: null, expiresAt: null, reason: '' },
  { id: 'tighten_conviction', type: 'tighten_conviction', label: 'Tighten Conviction Threshold', active: false, appliedAt: null, expiresAt: null, reason: '' },
  { id: 'freeze_adaptation', type: 'freeze_adaptation', label: 'Freeze Adaptation', active: false, appliedAt: null, expiresAt: null, reason: '' },
  { id: 'reset_memory', type: 'reset_memory', label: 'Reset Agent Memory', active: false, appliedAt: null, expiresAt: null, reason: '' },
];

export const DEFAULT_POLICIES: PolicyRule[] = [
  { id: 'pol_btc', type: 'asset_enabled', enabled: true, label: 'BTCUSDT Enabled', description: 'Allow trading BTCUSDT', params: { asset: 'BTCUSDT' } },
  { id: 'pol_xrp', type: 'asset_enabled', enabled: true, label: 'XRPUSDT Enabled', description: 'Allow trading XRPUSDT', params: { asset: 'XRPUSDT' } },
  { id: 'pol_fet', type: 'asset_enabled', enabled: true, label: 'FETUSDT Enabled', description: 'Allow trading FETUSDT', params: { asset: 'FETUSDT' } },
  { id: 'pol_xlm', type: 'asset_enabled', enabled: true, label: 'XLMUSDT Enabled', description: 'Allow trading XLMUSDT', params: { asset: 'XLMUSDT' } },
  { id: 'pol_sma', type: 'strategy_enabled', enabled: true, label: 'SMA Strategy', description: 'Allow SMA crossover strategy', params: { strategy: 'SMA' } },
  { id: 'pol_ema', type: 'strategy_enabled', enabled: true, label: 'EMA Strategy', description: 'Allow EMA crossover strategy', params: { strategy: 'EMA' } },
  { id: 'pol_rsi', type: 'strategy_enabled', enabled: true, label: 'RSI-Trend Strategy', description: 'Allow RSI-trend strategy', params: { strategy: 'RSI_TREND' } },
  { id: 'pol_noshort', type: 'no_shorts', enabled: false, label: 'No Short Selling', description: 'Block all short positions', params: {} },
  { id: 'pol_maxpos', type: 'max_positions', enabled: false, label: 'Max 1 Position', description: 'Only one active position at a time', params: { max: 1 } },
  { id: 'pol_ddblock', type: 'drawdown_block', enabled: false, label: 'Drawdown Trade Block', description: 'Block new trades when drawdown exceeds 10%', params: { maxDrawdownPercent: 10 } },
];

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'conservative',
    name: 'Conservative Simulation',
    description: 'Low risk, no shorts, max 1 position, drawdown block at 5%',
    autonomyMode: 'PAPER_EXECUTION',
    policies: [
      { id: 'pol_noshort', type: 'no_shorts', enabled: true, label: 'No Short Selling', description: 'Block all short positions', params: {} },
      { id: 'pol_maxpos', type: 'max_positions', enabled: true, label: 'Max 1 Position', description: 'Only one active position', params: { max: 1 } },
      { id: 'pol_ddblock', type: 'drawdown_block', enabled: true, label: 'Drawdown Block at 5%', description: 'Block trades when DD > 5%', params: { maxDrawdownPercent: 5 } },
    ],
    overrides: { reduce_size: true },
  },
  {
    id: 'balanced',
    name: 'Balanced Simulation',
    description: 'Standard trading with drawdown protection at 10%',
    autonomyMode: 'PAPER_EXECUTION',
    policies: [
      { id: 'pol_ddblock', type: 'drawdown_block', enabled: true, label: 'Drawdown Block at 10%', description: 'Block trades when DD > 10%', params: { maxDrawdownPercent: 10 } },
    ],
    overrides: {},
  },
  {
    id: 'aggressive',
    name: 'Aggressive Simulation',
    description: 'Full autonomy, all strategies, all assets',
    autonomyMode: 'FULL_SIMULATION_AUTONOMY',
    policies: [],
    overrides: {},
  },
  {
    id: 'btc_only',
    name: 'BTC Only',
    description: 'Only BTCUSDT enabled, others disabled',
    autonomyMode: 'PAPER_EXECUTION',
    policies: [
      { id: 'pol_xrp', type: 'asset_enabled', enabled: false, label: 'XRPUSDT Disabled', description: 'Disable XRPUSDT', params: { asset: 'XRPUSDT' } },
      { id: 'pol_fet', type: 'asset_enabled', enabled: false, label: 'FETUSDT Disabled', description: 'Disable FETUSDT', params: { asset: 'FETUSDT' } },
      { id: 'pol_xlm', type: 'asset_enabled', enabled: false, label: 'XLMUSDT Disabled', description: 'Disable XLMUSDT', params: { asset: 'XLMUSDT' } },
    ],
    overrides: {},
  },
  {
    id: 'supervised',
    name: 'Supervised Testing',
    description: 'Requires approval for positions and strategy changes',
    autonomyMode: 'SUPERVISED_AGENT',
    policies: [],
    overrides: {},
  },
  {
    id: 'observe',
    name: 'Observe Only',
    description: 'Analytics only, no simulated trades',
    autonomyMode: 'OBSERVE_ONLY',
    policies: [],
    overrides: {},
  },
];

export const DEFAULT_OPERATOR_STATE: OperatorState = {
  agentEnabled: true,
  autonomyMode: 'PAPER_EXECUTION',
  overrides: DEFAULT_OVERRIDES.map(o => ({ ...o })),
  policies: DEFAULT_POLICIES.map(p => ({ ...p })),
  approvals: [],
  auditLog: [],
  activeTemplate: null,
};
