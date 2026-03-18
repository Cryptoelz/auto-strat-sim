import { Asset, TradingState, AssetAnalytics } from '@/types/trading';
import { StrategyId } from '@/types/strategy';
import {
  GovernanceState, GovernanceConfig, GovernanceStatus, HealthScore,
  GovernanceTrigger, GovernanceTriggerType, GovernanceTransition,
  GovernanceRestrictions, RecoveryState, DEFAULT_GOVERNANCE_CONFIG,
} from '@/types/governance';

// ─── Health Score Calculator ────────────────────────────────────────

export function calculateHealthScore(
  state: TradingState,
  analytics: Record<Asset, AssetAnalytics>,
  enabledAssets: Asset[],
  portfolioDrawdown: number,
  recentFlipCount: number,
  reconnectErrors: number,
): HealthScore {
  const trades = state.trades;
  const recentTrades = trades.slice(-20);

  // PnL stability: how consistent recent results are
  let pnlStability = 80;
  if (recentTrades.length >= 5) {
    const pnls = recentTrades.map(t => t.pnl);
    const avg = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const variance = pnls.reduce((s, p) => s + (p - avg) ** 2, 0) / pnls.length;
    const cv = avg !== 0 ? Math.sqrt(variance) / Math.abs(avg) : 2;
    pnlStability = Math.max(0, Math.min(100, 100 - cv * 30));
  }

  // Drawdown level
  const drawdownLevel = Math.max(0, Math.min(100, 100 - portfolioDrawdown * 5));

  // Signal quality: how many assets have non-null, non-hold signals
  let signalQuality = 70;
  let validSignals = 0;
  for (const a of enabledAssets) {
    if (analytics[a]?.signal && analytics[a].signal!.type !== 'HOLD') validSignals++;
  }
  signalQuality = enabledAssets.length > 0 ? 50 + (validSignals / enabledAssets.length) * 50 : 50;

  // Trade quality: recent win rate
  let tradeQuality = 70;
  if (recentTrades.length >= 3) {
    const wins = recentTrades.filter(t => t.type === 'win').length;
    tradeQuality = (wins / recentTrades.length) * 100;
  }

  // Execution stability: penalize flips and consecutive losses
  const executionStability = Math.max(0, 100 - recentFlipCount * 15 - state.consecutiveLosses * 10);

  // Data quality: penalize reconnect errors
  const dataQuality = Math.max(0, 100 - reconnectErrors * 20);

  // Adaptation stability
  const adaptationStability = Math.max(0, 100 - Math.abs(state.dailyPnl) * 0.5);

  // Risk pressure
  const dailyLossPct = state.initialBalance > 0
    ? (Math.abs(Math.min(0, state.dailyPnl)) / state.initialBalance) * 100
    : 0;
  const riskPressure = Math.max(0, 100 - dailyLossPct * 10 - state.consecutiveLosses * 8);

  // Portfolio stress
  const openPositions = enabledAssets.filter(a => state.positions[a] !== null).length;
  const portfolioStress = Math.max(0, 100 - portfolioDrawdown * 3 - openPositions * 5);

  const weights = [0.12, 0.15, 0.10, 0.15, 0.12, 0.08, 0.06, 0.12, 0.10];
  const scores = [pnlStability, drawdownLevel, signalQuality, tradeQuality,
    executionStability, dataQuality, adaptationStability, riskPressure, portfolioStress];
  const overall = Math.round(scores.reduce((sum, s, i) => sum + s * weights[i], 0));

  return {
    overall, pnlStability, drawdownLevel, signalQuality, tradeQuality,
    executionStability, dataQuality, adaptationStability, riskPressure, portfolioStress,
  };
}

// ─── Trigger Detection ──────────────────────────────────────────────

export function detectTriggers(
  state: TradingState,
  portfolioDrawdown: number,
  recentFlipCount: number,
  reconnectErrors: number,
  config: GovernanceConfig,
): GovernanceTrigger[] {
  const triggers: GovernanceTrigger[] = [];
  const now = Date.now();

  // Daily loss
  const dailyLossPct = state.initialBalance > 0
    ? (Math.abs(Math.min(0, state.dailyPnl)) / state.initialBalance) * 100
    : 0;
  if (dailyLossPct >= config.dailyLossGovernanceLimit) {
    triggers.push({
      type: 'daily_loss_limit', severity: dailyLossPct >= config.dailyLossGovernanceLimit * 1.5 ? 'critical' : 'high',
      value: dailyLossPct, threshold: config.dailyLossGovernanceLimit,
      message: `Daily loss ${dailyLossPct.toFixed(1)}% exceeds ${config.dailyLossGovernanceLimit}% limit`,
      timestamp: now,
    });
  }

  // Drawdown
  if (portfolioDrawdown >= config.drawdownGovernanceLimit) {
    triggers.push({
      type: 'portfolio_drawdown', severity: portfolioDrawdown >= config.drawdownGovernanceLimit * 1.5 ? 'critical' : 'high',
      value: portfolioDrawdown, threshold: config.drawdownGovernanceLimit,
      message: `Portfolio drawdown ${portfolioDrawdown.toFixed(1)}% exceeds ${config.drawdownGovernanceLimit}% limit`,
      timestamp: now,
    });
  }

  // Consecutive losses
  if (state.consecutiveLosses >= config.consecutiveLossGovernanceLimit) {
    triggers.push({
      type: 'consecutive_losses',
      severity: state.consecutiveLosses >= config.consecutiveLossGovernanceLimit + 2 ? 'critical' : 'high',
      value: state.consecutiveLosses, threshold: config.consecutiveLossGovernanceLimit,
      message: `${state.consecutiveLosses} consecutive losses (limit: ${config.consecutiveLossGovernanceLimit})`,
      timestamp: now,
    });
  }

  // Excessive flips
  if (recentFlipCount >= config.flipTradeGovernanceLimit) {
    triggers.push({
      type: 'excessive_flips', severity: 'medium',
      value: recentFlipCount, threshold: config.flipTradeGovernanceLimit,
      message: `${recentFlipCount} flip trades in recent window (limit: ${config.flipTradeGovernanceLimit})`,
      timestamp: now,
    });
  }

  // Reconnect errors
  if (reconnectErrors >= config.reconnectErrorLimit) {
    triggers.push({
      type: 'reconnect_errors', severity: 'high',
      value: reconnectErrors, threshold: config.reconnectErrorLimit,
      message: `${reconnectErrors} reconnect errors (limit: ${config.reconnectErrorLimit})`,
      timestamp: now,
    });
  }

  // Poor recent performance
  const recent = state.trades.slice(-10);
  if (recent.length >= 5) {
    const winRate = recent.filter(t => t.type === 'win').length / recent.length;
    if (winRate < 0.25) {
      triggers.push({
        type: 'poor_recent_performance', severity: 'medium',
        value: winRate * 100, threshold: 25,
        message: `Recent win rate ${(winRate * 100).toFixed(0)}% is critically low`,
        timestamp: now,
      });
    }
  }

  return triggers;
}

// ─── State Determination ────────────────────────────────────────────

function determineState(
  healthScore: number,
  triggers: GovernanceTrigger[],
  config: GovernanceConfig,
  currentState: GovernanceState,
): GovernanceState {
  const hasCritical = triggers.some(t => t.severity === 'critical');
  const hasHigh = triggers.some(t => t.severity === 'high');
  const { caution, restricted, paused, locked } = config.healthScoreThresholds;

  if (hasCritical || healthScore <= locked) return 'LOCKED';
  if ((hasHigh && triggers.length >= 2) || healthScore <= paused) return 'PAUSED';
  if (hasHigh || healthScore <= restricted) return 'RESTRICTED';
  if (triggers.length > 0 || healthScore <= caution) return 'CAUTION';
  return 'ACTIVE';
}

// ─── Restrictions Builder ───────────────────────────────────────────

function buildRestrictions(
  govState: GovernanceState,
  triggers: GovernanceTrigger[],
  config: GovernanceConfig,
): GovernanceRestrictions {
  const base: GovernanceRestrictions = {
    positionSizeMultiplier: 1,
    convictionMultiplier: 1,
    blockedStrategies: [],
    blockedAssets: [],
    newEntriesAllowed: true,
    exitsAllowed: true,
    adaptationFrozen: false,
  };

  switch (govState) {
    case 'CAUTION':
      base.positionSizeMultiplier = 1 - config.governanceReduceSizePercent / 200; // half reduction
      base.convictionMultiplier = 1 + (config.governanceConvictionMultiplier - 1) / 2;
      break;
    case 'RESTRICTED':
      base.positionSizeMultiplier = 1 - config.governanceReduceSizePercent / 100;
      base.convictionMultiplier = config.governanceConvictionMultiplier;
      base.adaptationFrozen = true;
      break;
    case 'PAUSED':
      base.positionSizeMultiplier = 0;
      base.newEntriesAllowed = false;
      base.adaptationFrozen = true;
      break;
    case 'LOCKED':
      base.positionSizeMultiplier = 0;
      base.newEntriesAllowed = false;
      base.exitsAllowed = false;
      base.adaptationFrozen = true;
      break;
  }

  return base;
}

// ─── Recovery Check ─────────────────────────────────────────────────

function checkRecovery(
  govState: GovernanceState,
  healthScore: number,
  prevRecovery: RecoveryState | null,
  config: GovernanceConfig,
  candleIntervalMs: number,
): RecoveryState {
  const now = Date.now();
  const minPauseDuration = config.minimumPauseCandles * candleIntervalMs;

  if (govState === 'ACTIVE') {
    return {
      isRecovering: false, pauseStartTime: 0, minimumPauseDuration: minPauseDuration,
      healthAtPause: 0, currentHealth: healthScore, recoveryThreshold: config.recoveryHealthThreshold,
      conditionsMet: [], conditionsNeeded: [], progress: 100,
    };
  }

  const pauseStart = prevRecovery?.pauseStartTime || now;
  const elapsed = now - pauseStart;
  const conditionsMet: string[] = [];
  const conditionsNeeded: string[] = [];

  if (elapsed >= minPauseDuration) conditionsMet.push('Minimum pause duration completed');
  else conditionsNeeded.push(`Wait ${Math.ceil((minPauseDuration - elapsed) / 60000)}m more`);

  if (healthScore >= config.recoveryHealthThreshold) conditionsMet.push('Health score recovered');
  else conditionsNeeded.push(`Health ${healthScore} < ${config.recoveryHealthThreshold} threshold`);

  const progress = Math.min(100, Math.round(
    ((elapsed >= minPauseDuration ? 50 : (elapsed / minPauseDuration) * 50) +
    (healthScore >= config.recoveryHealthThreshold ? 50 : (healthScore / config.recoveryHealthThreshold) * 50))
  ));

  return {
    isRecovering: true, pauseStartTime: pauseStart, minimumPauseDuration: minPauseDuration,
    healthAtPause: prevRecovery?.healthAtPause || healthScore,
    currentHealth: healthScore, recoveryThreshold: config.recoveryHealthThreshold,
    conditionsMet, conditionsNeeded, progress,
  };
}

// ─── Explanation Generator ──────────────────────────────────────────

function generateExplanation(
  govState: GovernanceState,
  triggers: GovernanceTrigger[],
  healthScore: number,
): string {
  if (govState === 'ACTIVE' && triggers.length === 0) {
    return 'All systems nominal. Trading is fully active with no restrictions.';
  }

  const parts: string[] = [];
  parts.push(`Governance state: ${govState} (health: ${healthScore}/100).`);

  if (triggers.length > 0) {
    parts.push(`Active triggers: ${triggers.map(t => t.message).join('; ')}.`);
  }

  switch (govState) {
    case 'CAUTION':
      parts.push('Position sizes reduced and conviction threshold raised.');
      break;
    case 'RESTRICTED':
      parts.push('Only highest-conviction trades allowed. Adaptation frozen.');
      break;
    case 'PAUSED':
      parts.push('No new trades allowed. Existing positions may be managed.');
      break;
    case 'LOCKED':
      parts.push('All trading activity disabled. Manual review required.');
      break;
  }

  return parts.join(' ');
}

// ─── Main Governance Evaluator ──────────────────────────────────────

export function evaluateGovernance(
  state: TradingState,
  analytics: Record<Asset, AssetAnalytics>,
  enabledAssets: Asset[],
  portfolioDrawdown: number,
  recentFlipCount: number,
  reconnectErrors: number,
  config: GovernanceConfig,
  prevStatus: GovernanceStatus | null,
  candleIntervalMs: number,
): GovernanceStatus {
  if (!config.enabled) {
    return createActiveStatus();
  }

  const healthScore = calculateHealthScore(
    state, analytics, enabledAssets, portfolioDrawdown, recentFlipCount, reconnectErrors,
  );

  const triggers = detectTriggers(state, portfolioDrawdown, recentFlipCount, reconnectErrors, config);
  const prevState = prevStatus?.currentState || 'ACTIVE';
  let newState = determineState(healthScore.overall, triggers, config, prevState);

  // Prevent rapid state flipping: don't upgrade more than one level per evaluation
  const stateOrder: GovernanceState[] = ['ACTIVE', 'CAUTION', 'RESTRICTED', 'PAUSED', 'LOCKED'];
  const prevIdx = stateOrder.indexOf(prevState);
  const newIdx = stateOrder.indexOf(newState);

  // Recovery check: only upgrade if recovery conditions met
  if (newIdx < prevIdx && prevIdx >= 2) {
    const recovery = checkRecovery(prevState, healthScore.overall, prevStatus?.recovery || null, config, candleIntervalMs);
    if (recovery.conditionsNeeded.length > 0) {
      newState = prevState; // stay in current state
    } else {
      // Allow one-step upgrade only
      newState = stateOrder[Math.max(0, prevIdx - 1)];
    }
  }

  const restrictions = buildRestrictions(newState, triggers, config);
  const recovery = checkRecovery(newState, healthScore.overall, prevStatus?.recovery || null, config, candleIntervalMs);

  // Build transitions
  const transitions = [...(prevStatus?.transitions || [])].slice(-50);
  if (newState !== prevState) {
    transitions.push({
      id: `gov-${Date.now()}`,
      timestamp: Date.now(),
      fromState: prevState,
      toState: newState,
      trigger: triggers[0]?.type || 'poor_recent_performance',
      healthScore: healthScore.overall,
      affectedStrategies: [],
      affectedAssets: enabledAssets,
      restrictions: Object.entries(restrictions)
        .filter(([_, v]) => v !== true && v !== 1 && !(Array.isArray(v) && v.length === 0))
        .map(([k, v]) => `${k}: ${v}`),
      explanation: generateExplanation(newState, triggers, healthScore.overall),
    });
  }

  const manualReviewRequired = newState === 'LOCKED' || triggers.filter(t => t.severity === 'critical').length >= 2;
  const manualReviewReasons = manualReviewRequired
    ? triggers.filter(t => t.severity === 'critical').map(t => t.message)
    : [];

  return {
    currentState: newState,
    healthScore,
    activeTriggers: triggers,
    restrictions,
    recovery,
    transitions,
    manualReviewRequired,
    manualReviewReasons,
    explanation: generateExplanation(newState, triggers, healthScore.overall),
  };
}

function createActiveStatus(): GovernanceStatus {
  return {
    currentState: 'ACTIVE',
    healthScore: {
      overall: 100, pnlStability: 100, drawdownLevel: 100, signalQuality: 100,
      tradeQuality: 100, executionStability: 100, dataQuality: 100,
      adaptationStability: 100, riskPressure: 100, portfolioStress: 100,
    },
    activeTriggers: [],
    restrictions: {
      positionSizeMultiplier: 1, convictionMultiplier: 1, blockedStrategies: [],
      blockedAssets: [], newEntriesAllowed: true, exitsAllowed: true, adaptationFrozen: false,
    },
    recovery: {
      isRecovering: false, pauseStartTime: 0, minimumPauseDuration: 0,
      healthAtPause: 0, currentHealth: 100, recoveryThreshold: 60,
      conditionsMet: [], conditionsNeeded: [], progress: 100,
    },
    transitions: [],
    manualReviewRequired: false,
    manualReviewReasons: [],
    explanation: 'Governance disabled. Trading unrestricted.',
  };
}

// ─── Utility: Count recent flips ────────────────────────────────────

export function countRecentFlips(state: TradingState, windowCandles: number, candleIntervalMs: number): number {
  const cutoff = Date.now() - windowCandles * candleIntervalMs;
  return state.trades.filter(
    t => t.exitTime >= cutoff && (t.exitReason === 'flip_to_long' || t.exitReason === 'flip_to_short'),
  ).length;
}
