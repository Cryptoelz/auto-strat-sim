export type LifecyclePhase =
  | 'INIT'
  | 'LOAD_CONFIGURATION'
  | 'RESTORE_STATE'
  | 'LOAD_MARKET_DATA'
  | 'UPDATE_INDICATORS'
  | 'EVALUATE_STRATEGIES'
  | 'RUN_AGENT_DECISIONS'
  | 'APPLY_GOVERNANCE'
  | 'APPLY_OPERATOR_POLICIES'
  | 'EXECUTE_SIMULATION_ACTIONS'
  | 'UPDATE_STATE'
  | 'UPDATE_ANALYTICS'
  | 'LOG_AND_REPORT'
  | 'VALIDATE_HEALTH'
  | 'COMPLETE_CYCLE';

export type SystemState =
  | 'STARTING'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'RESTRICTED'
  | 'ERROR'
  | 'RECOVERING'
  | 'STOPPED'
  | 'REVIEW_REQUIRED';

export type ExecutionMode =
  | 'backtesting'
  | 'optimization'
  | 'live_paper'
  | 'scenario_testing'
  | 'stress_testing'
  | 'readiness_review'
  | 'experiment_replay';

export type OrchestrationEventType =
  | 'candle_closed'
  | 'indicators_updated'
  | 'signal_generated'
  | 'trade_blocked'
  | 'trade_executed'
  | 'governance_state_changed'
  | 'policy_override_applied'
  | 'readiness_review_completed'
  | 'scenario_failed'
  | 'health_alert_triggered'
  | 'cycle_started'
  | 'cycle_completed'
  | 'phase_entered'
  | 'phase_completed'
  | 'fault_detected'
  | 'recovery_started'
  | 'state_transition'
  | 'module_timeout'
  | 'batch_item_completed'
  | 'batch_item_failed'
  | 'startup_completed'
  | 'shutdown_initiated';

export interface OrchestrationEvent {
  id: string;
  timestamp: number;
  type: OrchestrationEventType;
  source: string;
  payload?: Record<string, unknown>;
  explanation?: string;
}

export interface ModuleHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed' | 'inactive';
  lastRunMs: number;
  lastError?: string;
  cycleCount: number;
}

export interface CycleResult {
  cycleId: string;
  mode: ExecutionMode;
  startTime: number;
  endTime: number;
  durationMs: number;
  phasesCompleted: LifecyclePhase[];
  phasesFailed: LifecyclePhase[];
  eventsEmitted: number;
  faults: FaultRecord[];
  success: boolean;
  explanation: string;
}

export interface FaultRecord {
  id: string;
  timestamp: number;
  module: string;
  phase: LifecyclePhase;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  isolated: boolean;
  recovered: boolean;
  explanation: string;
}

export interface OrchestrationAuditEntry {
  id: string;
  timestamp: number;
  mode: ExecutionMode;
  phase?: LifecyclePhase;
  action: string;
  result: 'success' | 'warning' | 'failure';
  module?: string;
  stateTransition?: { from: SystemState; to: SystemState };
  explanation: string;
}

export interface BatchRun {
  id: string;
  type: ExecutionMode;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface OrchestrationConfig {
  cycleIntervalMs: number;
  batchParallelismLimit: number;
  retryLimit: number;
  recoveryAttemptLimit: number;
  moduleTimeoutMs: number;
  logVerbosity: 'minimal' | 'normal' | 'verbose';
  summarySchedule: 'per_cycle' | 'per_session' | 'end_of_day';
  autoRecoveryEnabled: boolean;
  healthCheckInterval: number;
}

export const DEFAULT_ORCHESTRATION_CONFIG: OrchestrationConfig = {
  cycleIntervalMs: 60000,
  batchParallelismLimit: 1,
  retryLimit: 3,
  recoveryAttemptLimit: 2,
  moduleTimeoutMs: 30000,
  logVerbosity: 'normal',
  summarySchedule: 'per_cycle',
  autoRecoveryEnabled: true,
  healthCheckInterval: 5,
};

export interface SharedContext {
  mode: ExecutionMode;
  activeAssets: string[];
  activeStrategies: string[];
  configVersion: string;
  governanceState: string;
  autonomyMode: string;
  activeRunId: string | null;
  readinessState: string;
  currentPhase: LifecyclePhase;
  systemState: SystemState;
  cycleNumber: number;
}

export interface OrchestrationState {
  systemState: SystemState;
  currentPhase: LifecyclePhase;
  currentMode: ExecutionMode;
  cycleNumber: number;
  activeRunId: string | null;
  configVersion: string;
  moduleHealth: ModuleHealth[];
  recentCycles: CycleResult[];
  recentEvents: OrchestrationEvent[];
  recentFaults: FaultRecord[];
  auditLog: OrchestrationAuditEntry[];
  activeBatch: BatchRun | null;
  config: OrchestrationConfig;
  lastCycleTime: number;
  uptime: number;
  startedAt: number;
}

export const LIFECYCLE_ORDER: LifecyclePhase[] = [
  'INIT',
  'LOAD_CONFIGURATION',
  'RESTORE_STATE',
  'LOAD_MARKET_DATA',
  'UPDATE_INDICATORS',
  'EVALUATE_STRATEGIES',
  'RUN_AGENT_DECISIONS',
  'APPLY_GOVERNANCE',
  'APPLY_OPERATOR_POLICIES',
  'EXECUTE_SIMULATION_ACTIONS',
  'UPDATE_STATE',
  'UPDATE_ANALYTICS',
  'LOG_AND_REPORT',
  'VALIDATE_HEALTH',
  'COMPLETE_CYCLE',
];

export const MODE_MODULES: Record<ExecutionMode, LifecyclePhase[]> = {
  backtesting: LIFECYCLE_ORDER,
  optimization: LIFECYCLE_ORDER,
  live_paper: LIFECYCLE_ORDER,
  scenario_testing: ['INIT', 'LOAD_CONFIGURATION', 'LOAD_MARKET_DATA', 'UPDATE_INDICATORS', 'EVALUATE_STRATEGIES', 'RUN_AGENT_DECISIONS', 'APPLY_GOVERNANCE', 'UPDATE_STATE', 'UPDATE_ANALYTICS', 'LOG_AND_REPORT', 'COMPLETE_CYCLE'],
  stress_testing: ['INIT', 'LOAD_CONFIGURATION', 'LOAD_MARKET_DATA', 'UPDATE_INDICATORS', 'EVALUATE_STRATEGIES', 'RUN_AGENT_DECISIONS', 'APPLY_GOVERNANCE', 'UPDATE_STATE', 'UPDATE_ANALYTICS', 'VALIDATE_HEALTH', 'COMPLETE_CYCLE'],
  readiness_review: ['INIT', 'LOAD_CONFIGURATION', 'RESTORE_STATE', 'UPDATE_ANALYTICS', 'VALIDATE_HEALTH', 'LOG_AND_REPORT', 'COMPLETE_CYCLE'],
  experiment_replay: LIFECYCLE_ORDER,
};

export const VALID_TRANSITIONS: Record<SystemState, SystemState[]> = {
  STARTING: ['READY', 'ERROR'],
  READY: ['RUNNING', 'STOPPED'],
  RUNNING: ['PAUSED', 'RESTRICTED', 'ERROR', 'STOPPED', 'REVIEW_REQUIRED'],
  PAUSED: ['RUNNING', 'STOPPED', 'RESTRICTED'],
  RESTRICTED: ['RUNNING', 'PAUSED', 'STOPPED', 'ERROR', 'REVIEW_REQUIRED'],
  ERROR: ['RECOVERING', 'STOPPED'],
  RECOVERING: ['READY', 'ERROR', 'STOPPED'],
  STOPPED: ['STARTING'],
  REVIEW_REQUIRED: ['RUNNING', 'RESTRICTED', 'STOPPED'],
};

export const SYSTEM_STATE_LABELS: Record<SystemState, string> = {
  STARTING: 'Starting',
  READY: 'Ready',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  RESTRICTED: 'Restricted',
  ERROR: 'Error',
  RECOVERING: 'Recovering',
  STOPPED: 'Stopped',
  REVIEW_REQUIRED: 'Review Required',
};

export const PHASE_LABELS: Record<LifecyclePhase, string> = {
  INIT: 'Initialize',
  LOAD_CONFIGURATION: 'Load Config',
  RESTORE_STATE: 'Restore State',
  LOAD_MARKET_DATA: 'Load Market Data',
  UPDATE_INDICATORS: 'Update Indicators',
  EVALUATE_STRATEGIES: 'Evaluate Strategies',
  RUN_AGENT_DECISIONS: 'Agent Decisions',
  APPLY_GOVERNANCE: 'Apply Governance',
  APPLY_OPERATOR_POLICIES: 'Apply Policies',
  EXECUTE_SIMULATION_ACTIONS: 'Execute Actions',
  UPDATE_STATE: 'Update State',
  UPDATE_ANALYTICS: 'Update Analytics',
  LOG_AND_REPORT: 'Log & Report',
  VALIDATE_HEALTH: 'Validate Health',
  COMPLETE_CYCLE: 'Complete Cycle',
};
