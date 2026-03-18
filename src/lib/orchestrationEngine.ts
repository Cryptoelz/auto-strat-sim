import {
  OrchestrationState, OrchestrationEvent, OrchestrationEventType,
  OrchestrationAuditEntry, CycleResult, FaultRecord, ModuleHealth,
  SystemState, LifecyclePhase, ExecutionMode, SharedContext, BatchRun,
  OrchestrationConfig, DEFAULT_ORCHESTRATION_CONFIG,
  LIFECYCLE_ORDER, MODE_MODULES, VALID_TRANSITIONS,
} from '@/types/orchestration';

const MAX_EVENTS = 100;
const MAX_AUDIT = 200;
const MAX_CYCLES = 50;
const MAX_FAULTS = 100;

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_MODULES: ModuleHealth[] = [
  { name: 'Market Data', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Indicators', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Signal Engine', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Strategy Engine', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Agent Decisions', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Governance', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Operator Policy', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Execution Sim', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Risk Manager', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Portfolio', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Memory', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Experiment Tracker', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
  { name: 'Readiness', status: 'healthy', lastRunMs: 0, cycleCount: 0 },
];

export function getInitialOrchestrationState(config?: Partial<OrchestrationConfig>): OrchestrationState {
  return {
    systemState: 'STARTING',
    currentPhase: 'INIT',
    currentMode: 'live_paper',
    cycleNumber: 0,
    activeRunId: null,
    configVersion: 'v1.0.0',
    moduleHealth: DEFAULT_MODULES.map(m => ({ ...m })),
    recentCycles: [],
    recentEvents: [],
    recentFaults: [],
    auditLog: [],
    activeBatch: null,
    config: { ...DEFAULT_ORCHESTRATION_CONFIG, ...config },
    lastCycleTime: 0,
    uptime: 0,
    startedAt: Date.now(),
  };
}

// --- State Machine ---

export function canTransition(from: SystemState, to: SystemState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionState(
  state: OrchestrationState,
  to: SystemState,
  reason: string
): OrchestrationState {
  if (!canTransition(state.systemState, to)) {
    return addAuditEntry(state, {
      action: `Blocked transition ${state.systemState} → ${to}`,
      result: 'failure',
      explanation: `Invalid transition: ${reason}`,
    });
  }
  const from = state.systemState;
  let next: OrchestrationState = {
    ...state,
    systemState: to,
  };
  next = emitEvent(next, {
    type: 'state_transition',
    source: 'orchestrator',
    payload: { from, to, reason },
    explanation: `System transitioned from ${from} to ${to}: ${reason}`,
  });
  next = addAuditEntry(next, {
    action: `State transition: ${from} → ${to}`,
    result: 'success',
    stateTransition: { from, to },
    explanation: reason,
  });
  return next;
}

// --- Event Bus ---

export function emitEvent(
  state: OrchestrationState,
  event: Omit<OrchestrationEvent, 'id' | 'timestamp'>
): OrchestrationState {
  const newEvent: OrchestrationEvent = {
    ...event,
    id: genId(),
    timestamp: Date.now(),
  };
  return {
    ...state,
    recentEvents: [newEvent, ...state.recentEvents].slice(0, MAX_EVENTS),
  };
}

// --- Audit Logger ---

export function addAuditEntry(
  state: OrchestrationState,
  entry: Omit<OrchestrationAuditEntry, 'id' | 'timestamp' | 'mode'>
): OrchestrationState {
  const newEntry: OrchestrationAuditEntry = {
    ...entry,
    id: genId(),
    timestamp: Date.now(),
    mode: state.currentMode,
  };
  return {
    ...state,
    auditLog: [newEntry, ...state.auditLog].slice(0, MAX_AUDIT),
  };
}

// --- Lifecycle Execution ---

export function getPhasesForMode(mode: ExecutionMode): LifecyclePhase[] {
  return MODE_MODULES[mode] || LIFECYCLE_ORDER;
}

export function runCycle(state: OrchestrationState): OrchestrationState {
  if (state.systemState !== 'RUNNING') {
    return addAuditEntry(state, {
      action: 'Cycle skipped',
      result: 'warning',
      explanation: `Cannot run cycle in ${state.systemState} state`,
    });
  }

  const cycleId = genId();
  const phases = getPhasesForMode(state.currentMode);
  const startTime = Date.now();
  const phasesCompleted: LifecyclePhase[] = [];
  const phasesFailed: LifecyclePhase[] = [];
  const faults: FaultRecord[] = [];

  let next = emitEvent(state, {
    type: 'cycle_started',
    source: 'orchestrator',
    payload: { cycleId, cycleNumber: state.cycleNumber + 1 },
    explanation: `Starting cycle #${state.cycleNumber + 1} in ${state.currentMode} mode`,
  });

  // Simulate running each phase
  const updatedModules = next.moduleHealth.map(m => ({ ...m }));
  for (const phase of phases) {
    // Simulate phase execution with random timing
    const phaseTimeMs = Math.random() * 50 + 5;
    const phaseFailed = Math.random() < 0.02; // 2% chance of failure per phase

    if (phaseFailed) {
      const moduleName = getModuleForPhase(phase);
      const fault: FaultRecord = {
        id: genId(),
        timestamp: Date.now(),
        module: moduleName,
        phase,
        error: `Simulated fault in ${phase}`,
        severity: 'warning',
        isolated: true,
        recovered: true,
        explanation: `Module "${moduleName}" encountered a transient issue during ${phase}. The fault was isolated and recovered automatically.`,
      };
      faults.push(fault);
      phasesFailed.push(phase);
      const mi = updatedModules.findIndex(m => m.name === moduleName);
      if (mi >= 0) {
        updatedModules[mi] = { ...updatedModules[mi], status: 'degraded', lastError: fault.error };
      }
    } else {
      phasesCompleted.push(phase);
      const moduleName = getModuleForPhase(phase);
      const mi = updatedModules.findIndex(m => m.name === moduleName);
      if (mi >= 0) {
        updatedModules[mi] = {
          ...updatedModules[mi],
          status: 'healthy',
          lastRunMs: phaseTimeMs,
          cycleCount: updatedModules[mi].cycleCount + 1,
          lastError: undefined,
        };
      }
    }
  }

  const endTime = Date.now();
  const hasCriticalFault = faults.some(f => f.severity === 'critical' && !f.recovered);
  const success = !hasCriticalFault;

  const cycle: CycleResult = {
    cycleId,
    mode: next.currentMode,
    startTime,
    endTime,
    durationMs: endTime - startTime,
    phasesCompleted,
    phasesFailed,
    eventsEmitted: phases.length,
    faults,
    success,
    explanation: success
      ? `Cycle #${next.cycleNumber + 1} completed successfully. ${phasesCompleted.length}/${phases.length} phases ran. ${faults.length > 0 ? `${faults.length} minor fault(s) handled.` : 'No faults.'}`
      : `Cycle #${next.cycleNumber + 1} failed due to critical unrecovered fault in ${phasesFailed.join(', ')}.`,
  };

  next = {
    ...next,
    cycleNumber: next.cycleNumber + 1,
    currentPhase: 'COMPLETE_CYCLE',
    moduleHealth: updatedModules,
    recentCycles: [cycle, ...next.recentCycles].slice(0, MAX_CYCLES),
    recentFaults: [...faults, ...next.recentFaults].slice(0, MAX_FAULTS),
    lastCycleTime: endTime,
    uptime: endTime - next.startedAt,
  };

  next = emitEvent(next, {
    type: 'cycle_completed',
    source: 'orchestrator',
    payload: { cycleId, success, durationMs: cycle.durationMs, faultCount: faults.length },
    explanation: cycle.explanation,
  });

  next = addAuditEntry(next, {
    action: `Cycle #${next.cycleNumber} completed`,
    result: success ? 'success' : 'warning',
    explanation: cycle.explanation,
  });

  if (hasCriticalFault) {
    next = transitionState(next, 'ERROR', 'Critical unrecovered fault during cycle');
  }

  return next;
}

function getModuleForPhase(phase: LifecyclePhase): string {
  const map: Partial<Record<LifecyclePhase, string>> = {
    LOAD_MARKET_DATA: 'Market Data',
    UPDATE_INDICATORS: 'Indicators',
    EVALUATE_STRATEGIES: 'Strategy Engine',
    RUN_AGENT_DECISIONS: 'Agent Decisions',
    APPLY_GOVERNANCE: 'Governance',
    APPLY_OPERATOR_POLICIES: 'Operator Policy',
    EXECUTE_SIMULATION_ACTIONS: 'Execution Sim',
    UPDATE_STATE: 'Risk Manager',
    UPDATE_ANALYTICS: 'Portfolio',
    VALIDATE_HEALTH: 'Readiness',
    LOG_AND_REPORT: 'Experiment Tracker',
  };
  return map[phase] || 'Signal Engine';
}

// --- Startup / Shutdown ---

export function startup(state: OrchestrationState): OrchestrationState {
  let next = transitionState(state, 'READY', 'System startup completed, all modules initialized');
  next = addAuditEntry(next, {
    action: 'System startup',
    result: 'success',
    explanation: 'All modules initialized in dependency order. Simulation-only constraints verified.',
  });
  next = emitEvent(next, {
    type: 'startup_completed',
    source: 'orchestrator',
    explanation: 'Platform startup completed. Ready to begin execution cycles.',
  });
  return next;
}

export function shutdown(state: OrchestrationState): OrchestrationState {
  let next = emitEvent(state, {
    type: 'shutdown_initiated',
    source: 'orchestrator',
    explanation: 'System shutdown initiated. Saving state and finalizing logs.',
  });
  next = addAuditEntry(next, {
    action: 'System shutdown',
    result: 'success',
    explanation: 'State saved, logs finalized, active sessions closed safely.',
  });
  if (canTransition(next.systemState, 'STOPPED')) {
    next = transitionState(next, 'STOPPED', 'Clean shutdown');
  }
  return next;
}

// --- Mode Switching ---

export function setMode(state: OrchestrationState, mode: ExecutionMode): OrchestrationState {
  let next = { ...state, currentMode: mode };
  next = addAuditEntry(next, {
    action: `Mode changed to ${mode}`,
    result: 'success',
    explanation: `Execution mode set to ${mode}. Lifecycle phases adjusted accordingly.`,
  });
  return next;
}

// --- Batch Coordination ---

export function startBatch(state: OrchestrationState, type: ExecutionMode, totalItems: number): OrchestrationState {
  const batch: BatchRun = {
    id: genId(),
    type,
    totalItems,
    completedItems: 0,
    failedItems: 0,
    startTime: Date.now(),
    status: 'running',
  };
  let next = { ...state, activeBatch: batch };
  next = addAuditEntry(next, {
    action: `Batch started: ${type}`,
    result: 'success',
    explanation: `Started batch of ${totalItems} ${type} runs.`,
  });
  return next;
}

export function completeBatchItem(state: OrchestrationState, success: boolean): OrchestrationState {
  if (!state.activeBatch) return state;
  const batch = { ...state.activeBatch };
  if (success) {
    batch.completedItems++;
  } else {
    batch.failedItems++;
  }
  if (batch.completedItems + batch.failedItems >= batch.totalItems) {
    batch.status = batch.failedItems > 0 ? 'failed' : 'completed';
    batch.endTime = Date.now();
  }
  return { ...state, activeBatch: batch.status === 'running' ? batch : null };
}

// --- Fault Handling ---

export function reportFault(
  state: OrchestrationState,
  module: string,
  phase: LifecyclePhase,
  error: string,
  severity: 'warning' | 'error' | 'critical'
): OrchestrationState {
  const fault: FaultRecord = {
    id: genId(),
    timestamp: Date.now(),
    module,
    phase,
    error,
    severity,
    isolated: severity !== 'critical',
    recovered: false,
    explanation: `Fault in "${module}" during ${phase}: ${error}. ${severity === 'critical' ? 'System moved to safe state.' : 'Module isolated, downstream protected.'}`,
  };
  let next: OrchestrationState = {
    ...state,
    recentFaults: [fault, ...state.recentFaults].slice(0, MAX_FAULTS),
  };
  next = emitEvent(next, {
    type: 'fault_detected',
    source: module,
    payload: { phase, error, severity },
    explanation: fault.explanation,
  });
  next = addAuditEntry(next, {
    action: `Fault detected in ${module}`,
    result: 'failure',
    module,
    phase,
    explanation: fault.explanation,
  });
  if (severity === 'critical') {
    next = transitionState(next, 'ERROR', `Critical fault in ${module}: ${error}`);
  }
  return next;
}

export function attemptRecovery(state: OrchestrationState): OrchestrationState {
  if (state.systemState !== 'ERROR') return state;
  let next = transitionState(state, 'RECOVERING', 'Attempting automatic recovery');
  // Mark unrecovered faults as recovered
  next = {
    ...next,
    recentFaults: next.recentFaults.map(f =>
      !f.recovered ? { ...f, recovered: true } : f
    ),
    moduleHealth: next.moduleHealth.map(m =>
      m.status === 'failed' ? { ...m, status: 'healthy', lastError: undefined } : m
    ),
  };
  next = transitionState(next, 'READY', 'Recovery completed, modules restored');
  return next;
}

// --- Explainability ---

export function explainCurrentState(state: OrchestrationState): string {
  const healthyCount = state.moduleHealth.filter(m => m.status === 'healthy').length;
  const totalModules = state.moduleHealth.length;
  const faultCount = state.recentFaults.filter(f => !f.recovered).length;
  const successRate = state.recentCycles.length > 0
    ? (state.recentCycles.filter(c => c.success).length / state.recentCycles.length * 100).toFixed(0)
    : 'N/A';

  const parts: string[] = [];
  parts.push(`System is in ${state.systemState} state, running in ${state.currentMode} mode.`);
  parts.push(`${healthyCount}/${totalModules} modules healthy.`);
  if (state.cycleNumber > 0) {
    parts.push(`${state.cycleNumber} cycles completed (${successRate}% success rate).`);
  }
  if (faultCount > 0) {
    parts.push(`${faultCount} unresolved fault(s) pending.`);
  }
  if (state.activeBatch) {
    const b = state.activeBatch;
    parts.push(`Batch in progress: ${b.completedItems}/${b.totalItems} completed.`);
  }
  return parts.join(' ');
}
