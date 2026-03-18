// Operator policy engine — simulation only

import {
  OperatorState,
  PolicyRule,
  ManualOverride,
  ApprovalRequest,
  OperatorAuditEntry,
  OperatorConfig,
  AutonomyMode,
  PolicyTemplate,
  POLICY_TEMPLATES,
  DEFAULT_OVERRIDES,
  DEFAULT_POLICIES,
} from '@/types/operator';
import { Asset, TradingState } from '@/types/trading';

// ─── Policy evaluation ──────────────────────────────────────────────────────

export interface PolicyCheckResult {
  allowed: boolean;
  blockedBy: string | null;
  explanation: string;
  source: 'policy' | 'override' | 'governance' | 'autonomy' | null;
}

export function checkTradeAllowed(
  opState: OperatorState,
  asset: Asset,
  direction: 'long' | 'short',
  strategy: string,
  activePositionCount: number,
  currentDrawdownPercent: number,
): PolicyCheckResult {
  // Agent disabled
  if (!opState.agentEnabled) {
    return { allowed: false, blockedBy: 'agent_disabled', explanation: 'Agent is disabled by operator.', source: 'override' };
  }

  // Autonomy mode restrictions
  if (opState.autonomyMode === 'OBSERVE_ONLY') {
    return { allowed: false, blockedBy: 'observe_only', explanation: 'Autonomy mode is OBSERVE_ONLY — no trades allowed.', source: 'autonomy' };
  }
  if (opState.autonomyMode === 'SIGNALS_ONLY') {
    return { allowed: false, blockedBy: 'signals_only', explanation: 'Autonomy mode is SIGNALS_ONLY — signals generated but no execution.', source: 'autonomy' };
  }

  // Manual overrides
  for (const ov of opState.overrides) {
    if (!ov.active) continue;
    if (ov.type === 'pause_all') {
      return { allowed: false, blockedBy: ov.label, explanation: 'All trading paused by operator override.', source: 'override' };
    }
    if (ov.type === 'no_new_entries') {
      return { allowed: false, blockedBy: ov.label, explanation: 'No new entries allowed by operator override.', source: 'override' };
    }
    if (ov.type === 'exits_only') {
      return { allowed: false, blockedBy: ov.label, explanation: 'Exits only mode — new entries blocked by operator.', source: 'override' };
    }
  }

  // Policy rules
  for (const pol of opState.policies) {
    if (!pol.enabled) continue;

    if (pol.type === 'asset_enabled' && pol.params.asset === asset && !pol.enabled) {
      // This won't trigger because enabled is true if we got here, but we handle disabled assets below
    }

    if (pol.type === 'no_shorts' && direction === 'short') {
      return { allowed: false, blockedBy: pol.label, explanation: `SHORT entry blocked because short selling is disabled by operator policy.`, source: 'policy' };
    }

    if (pol.type === 'max_positions' && activePositionCount >= (pol.params.max ?? 1)) {
      return { allowed: false, blockedBy: pol.label, explanation: `Max ${pol.params.max ?? 1} active position(s) allowed by policy.`, source: 'policy' };
    }

    if (pol.type === 'drawdown_block' && currentDrawdownPercent >= (pol.params.maxDrawdownPercent ?? 10)) {
      return { allowed: false, blockedBy: pol.label, explanation: `Trade blocked — drawdown ${currentDrawdownPercent.toFixed(1)}% exceeds policy limit of ${pol.params.maxDrawdownPercent}%.`, source: 'policy' };
    }
  }

  // Check asset disabled via policy
  const assetPolicy = opState.policies.find(p => p.type === 'asset_enabled' && p.params.asset === asset);
  if (assetPolicy && !assetPolicy.enabled) {
    return { allowed: false, blockedBy: assetPolicy.label, explanation: `${asset} trade blocked because asset is disabled by operator policy.`, source: 'policy' };
  }

  // Check strategy disabled
  const stratPolicy = opState.policies.find(p => p.type === 'strategy_enabled' && p.params.strategy === strategy);
  if (stratPolicy && !stratPolicy.enabled) {
    return { allowed: false, blockedBy: stratPolicy.label, explanation: `${strategy} strategy blocked by operator policy.`, source: 'policy' };
  }

  return { allowed: true, blockedBy: null, explanation: 'Trade allowed within policy boundaries.', source: null };
}

// ─── Override modifiers ──────────────────────────────────────────────────────

export function getPositionSizeMultiplier(opState: OperatorState): number {
  const reduceSizeOv = opState.overrides.find(o => o.type === 'reduce_size');
  return reduceSizeOv?.active ? 0.5 : 1.0;
}

export function getConvictionMultiplier(opState: OperatorState): number {
  const tightenOv = opState.overrides.find(o => o.type === 'tighten_conviction');
  return tightenOv?.active ? 1.5 : 1.0;
}

export function isAdaptationFrozen(opState: OperatorState): boolean {
  return opState.overrides.find(o => o.type === 'freeze_adaptation')?.active ?? false;
}

// ─── Autonomy labels ────────────────────────────────────────────────────────

export const AUTONOMY_LABELS: Record<AutonomyMode, { label: string; description: string; color: string }> = {
  OBSERVE_ONLY: { label: 'Observe Only', description: 'Analytics only, no trades', color: 'text-muted-foreground' },
  SIGNALS_ONLY: { label: 'Signals Only', description: 'Signals generated, no execution', color: 'text-blue-500' },
  PAPER_EXECUTION: { label: 'Paper Execution', description: 'Automatic simulated trades', color: 'text-primary' },
  SUPERVISED_AGENT: { label: 'Supervised', description: 'Trades require approval', color: 'text-yellow-500' },
  FULL_SIMULATION_AUTONOMY: { label: 'Full Autonomy', description: 'Full sim within governance rules', color: 'text-trading-profit' },
};

// ─── Audit logging helper ───────────────────────────────────────────────────

export function createAuditEntry(
  action: string,
  priorState: string,
  newState: string,
  reason: string,
  extra?: Partial<OperatorAuditEntry>,
): OperatorAuditEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    action,
    priorState,
    newState,
    reason,
    restrictions: [],
    ...extra,
  };
}

// ─── Template application ───────────────────────────────────────────────────

export function applyTemplate(
  template: PolicyTemplate,
  currentState: OperatorState,
): OperatorState {
  const basePolicies = DEFAULT_POLICIES.map(p => ({ ...p }));
  // Apply template policy overrides
  for (const tp of template.policies) {
    const existing = basePolicies.find(bp => bp.id === tp.id);
    if (existing) {
      existing.enabled = tp.enabled;
      existing.params = { ...existing.params, ...tp.params };
      existing.label = tp.label;
      existing.description = tp.description;
    } else {
      basePolicies.push({ ...tp });
    }
  }

  const baseOverrides = DEFAULT_OVERRIDES.map(o => ({ ...o }));
  for (const [key, value] of Object.entries(template.overrides)) {
    const ov = baseOverrides.find(o => o.id === key);
    if (ov && value) {
      ov.active = true;
      ov.appliedAt = Date.now();
      ov.reason = `Applied by template: ${template.name}`;
    }
  }

  return {
    ...currentState,
    autonomyMode: template.autonomyMode,
    policies: basePolicies,
    overrides: baseOverrides,
    activeTemplate: template.id,
    auditLog: [
      createAuditEntry(
        'template_applied',
        currentState.activeTemplate ?? 'custom',
        template.id,
        `Policy template "${template.name}" applied`,
      ),
      ...currentState.auditLog,
    ].slice(0, 200),
  };
}

// ─── Approval helpers ───────────────────────────────────────────────────────

export function requiresApproval(
  opState: OperatorState,
  config: { approvalRequiredActions: string[] },
  action: string,
): boolean {
  if (opState.autonomyMode !== 'SUPERVISED_AGENT') return false;
  return config.approvalRequiredActions.includes(action);
}

export function createApprovalRequest(
  action: string,
  reason: string,
  confidence: number,
  riskContext: string,
  extra?: { asset?: string; strategy?: string },
): ApprovalRequest {
  return {
    id: `appr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    action,
    reason,
    confidence,
    riskContext,
    status: 'pending',
    ...extra,
  };
}
