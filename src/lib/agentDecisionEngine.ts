import {
  Asset, MarketRegime, Trade, TradingState, AssetAnalytics, Signal,
} from '@/types/trading';
import {
  StrategyId, StrategySignal, MultiStrategyConfig,
} from '@/types/strategy';
import {
  AgentConfig, DEFAULT_AGENT_CONFIG, AgentAction, ConvictionScore,
  RecentPerformanceSnapshot, AgentDecision, AgentAuditEntry, AgentState,
} from '@/types/agent';
import { ASSET_INFO } from '@/config/trading';
import { getStrategyDefinition } from './strategyEngine';

// ─── Conviction Scoring ──────────────────────────────────────────────

function scoreSignalStrength(signal: StrategySignal): number {
  if (signal.type === 'HOLD') return 0;
  return Math.min(signal.confidence * 0.25, 25); // max 25
}

function scoreRegimeAlignment(signal: StrategySignal, regime: MarketRegime): number {
  if (signal.type === 'HOLD') return 0;
  if (signal.type === 'BUY' && regime === 'trending_bullish') return 20;
  if (signal.type === 'SELL' && regime === 'trending_bearish') return 20;
  if (regime === 'sideways') return 5;
  return 8; // misaligned but not blocked
}

function scoreVolatilityQuality(atrPercent: number | null): number {
  if (atrPercent == null) return 5;
  if (atrPercent >= 2.0) return 15;
  if (atrPercent >= 1.0) return 12;
  if (atrPercent >= 0.5) return 8;
  return 3; // too low
}

/**
 * Distance contribution — promoted from hard gate to conviction factor.
 *
 * Scoring table (per spec):
 *   < 0.05%        → +0   (no separation)
 *   0.05% – 0.15%  → +5   (early development)
 *   0.15% – 0.25%  → +10  (forming)
 *   ≥ 0.25%        → +15  (full separation)
 */
export function scoreDistanceContribution(distancePct: number | null): number {
  const dist = Math.abs(distancePct ?? 0);
  if (dist >= 0.25) return 15;
  if (dist >= 0.15) return 10;
  if (dist >= 0.05) return 5;
  return 0;
}

function scoreTrendQuality(analytics: AssetAnalytics): number {
  return scoreDistanceContribution(analytics.smaDistance ?? 0);
}

function scoreRecentPerf(snapshot: RecentPerformanceSnapshot | undefined): number {
  if (!snapshot || snapshot.tradeCount === 0) return 10; // neutral
  const base = snapshot.winRate * 0.15; // max 15
  const pnlBonus = snapshot.netPnl > 0 ? 3 : -3;
  return Math.max(0, Math.min(15, base + pnlBonus));
}

function scoreDrawdownPenalty(
  portfolioDrawdownPercent: number,
  maxAllowed: number,
): number {
  if (portfolioDrawdownPercent <= 0) return 0;
  const ratio = portfolioDrawdownPercent / Math.max(maxAllowed, 1);
  return -Math.min(ratio * 15, 15); // penalty up to -15
}

function scoreFilterStatus(analytics: AssetAnalytics): number {
  return analytics.filterBlocked ? 0 : 10;
}

export function calculateConviction(
  asset: Asset,
  strategySignal: StrategySignal,
  analytics: AssetAnalytics,
  recentPerf: RecentPerformanceSnapshot | undefined,
  portfolioDrawdown: number,
  maxDrawdownAllowed: number,
  state: TradingState,
  agentConfig: AgentConfig,
): ConvictionScore {
  const base: ConvictionScore = {
    asset,
    strategyId: strategySignal.strategyId,
    total: 0,
    signalStrength: 0,
    regimeAlignment: 0,
    volatilityQuality: 0,
    trendQuality: 0,
    recentPerformance: 0,
    drawdownPenalty: 0,
    filterStatus: 0,
    eligible: false,
    disqualifyReason: null,
  };

  // Hard disqualifiers
  if (strategySignal.type === 'HOLD') {
    return { ...base, disqualifyReason: 'No actionable signal' };
  }
  if (analytics.filterBlocked) {
    return { ...base, disqualifyReason: `Filter blocked: ${analytics.filterBlocked}` };
  }
  if (state.isPaused) {
    return { ...base, disqualifyReason: 'Risk pause active' };
  }
  if (recentPerf?.isUnderperforming && recentPerf.cooldownRemaining > 0 && agentConfig.confidenceDecayEnabled) {
    return { ...base, disqualifyReason: `Strategy on cooldown (${recentPerf.cooldownRemaining} candles remaining)` };
  }
  // Already has aligned position
  const pos = state.positions[asset];
  if (pos) {
    const isFlip = (strategySignal.type === 'BUY' && pos.direction === 'short') ||
                   (strategySignal.type === 'SELL' && pos.direction === 'long');
    if (!isFlip) {
      return { ...base, disqualifyReason: 'Position already aligned with signal' };
    }
  }

  const signalStrength = scoreSignalStrength(strategySignal);
  const regimeAlignment = scoreRegimeAlignment(strategySignal, analytics.marketRegime);
  const volatilityQuality = scoreVolatilityQuality(analytics.atrPercent);
  const trendQuality = scoreTrendQuality(analytics);
  const recentPerformance = scoreRecentPerf(recentPerf);
  const drawdownPenalty = scoreDrawdownPenalty(portfolioDrawdown, maxDrawdownAllowed);
  const filterStatus = scoreFilterStatus(analytics);

  const total = Math.max(0, Math.min(100,
    signalStrength + regimeAlignment + volatilityQuality +
    trendQuality + recentPerformance + drawdownPenalty + filterStatus,
  ));

  return {
    asset,
    strategyId: strategySignal.strategyId,
    total,
    signalStrength,
    regimeAlignment,
    volatilityQuality,
    trendQuality,
    recentPerformance,
    drawdownPenalty,
    filterStatus,
    eligible: total >= agentConfig.minConvictionScore,
    disqualifyReason: total < agentConfig.minConvictionScore
      ? `Conviction ${total.toFixed(0)} below threshold ${agentConfig.minConvictionScore}`
      : null,
  };
}

// ─── Recent Performance Monitor ──────────────────────────────────────

export function computeRecentPerformance(
  trades: Trade[],
  asset: Asset,
  strategyId: StrategyId,
  windowSize: number,
  cooldownCandles: number,
): RecentPerformanceSnapshot {
  // Since trades don't carry strategyId, we use asset-level performance as proxy
  const assetTrades = trades.filter(t => t.asset === asset).slice(-windowSize);
  const wins = assetTrades.filter(t => t.type === 'win').length;
  const winRate = assetTrades.length > 0 ? (wins / assetTrades.length) * 100 : 50;
  const netPnl = assetTrades.reduce((s, t) => s + t.pnl, 0);
  const grossProfit = assetTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(assetTrades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  let peak = 0, maxDD = 0, running = 0;
  for (const t of assetTrades) {
    running += t.pnl;
    if (running > peak) peak = running;
    const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }

  const isUnderperforming = assetTrades.length >= 5 && (winRate < 35 || netPnl < 0);
  const cooldownRemaining = isUnderperforming ? cooldownCandles : 0;

  return {
    strategyId, asset, windowSize,
    tradeCount: assetTrades.length,
    winRate, netPnl, profitFactor,
    maxDrawdown: maxDD,
    isUnderperforming,
    cooldownRemaining,
  };
}

// ─── Capital Routing ─────────────────────────────────────────────────

function computeAllocationForConviction(
  conviction: number,
  config: AgentConfig,
  balance: number,
): { percent: number; amount: number } {
  if (!config.convictionPositionScalingEnabled) {
    return {
      percent: config.basePositionSizePercent,
      amount: balance * (config.basePositionSizePercent / 100),
    };
  }
  // Scale linearly: min conviction → base size, 100 conviction → max size
  const range = config.maxPositionSizePercent - config.basePositionSizePercent;
  const scale = Math.min(conviction / 100, 1);
  const percent = Math.min(
    config.basePositionSizePercent + range * scale,
    config.maxPositionSizePercent,
  );
  return { percent, amount: balance * (percent / 100) };
}

// ─── Explanation Engine ──────────────────────────────────────────────

function explainDecision(
  decision: AgentDecision,
  conviction: ConvictionScore,
  config: AgentConfig,
): string {
  const symbol = ASSET_INFO[decision.asset]?.symbol ?? decision.asset;
  const stratName = getStrategyDefinition(decision.strategyId).name;

  switch (decision.action) {
    case 'OPEN_LONG':
      return `Opening LONG on ${symbol} via ${stratName}. Conviction: ${conviction.total.toFixed(0)}/100 — signal strength (${conviction.signalStrength.toFixed(0)}), regime alignment (${conviction.regimeAlignment.toFixed(0)}), volatility (${conviction.volatilityQuality.toFixed(0)}). Allocation: ${decision.allocationPercent.toFixed(1)}%.`;
    case 'OPEN_SHORT':
      return `Opening SHORT on ${symbol} via ${stratName}. Conviction: ${conviction.total.toFixed(0)}/100 — signal strength (${conviction.signalStrength.toFixed(0)}), regime alignment (${conviction.regimeAlignment.toFixed(0)}), volatility (${conviction.volatilityQuality.toFixed(0)}). Allocation: ${decision.allocationPercent.toFixed(1)}%.`;
    case 'CLOSE_POSITION':
      return `Closing position on ${symbol} — signal reversed via ${stratName} with conviction ${conviction.total.toFixed(0)}/100.`;
    case 'HOLD_POSITION':
      return `Holding position on ${symbol} — no conflicting signal. Current conviction: ${conviction.total.toFixed(0)}/100.`;
    case 'DO_NOTHING':
      return conviction.disqualifyReason
        ? `No trade on ${symbol}: ${conviction.disqualifyReason}.`
        : `No trade on ${symbol} via ${stratName} — conviction ${conviction.total.toFixed(0)} is below threshold ${config.minConvictionScore}.`;
    default:
      return `Agent evaluated ${symbol} via ${stratName}.`;
  }
}

function determineVolatilityCondition(atrPercent: number | null): 'low' | 'moderate' | 'high' {
  if (atrPercent == null || atrPercent < 0.5) return 'low';
  if (atrPercent < 1.5) return 'moderate';
  return 'high';
}

function determineRiskState(
  portfolioDrawdown: number,
  isPaused: boolean,
): 'normal' | 'elevated' | 'critical' {
  if (isPaused) return 'critical';
  if (portfolioDrawdown >= 8) return 'critical';
  if (portfolioDrawdown >= 4) return 'elevated';
  return 'normal';
}

// ─── Main Agent Decision Cycle ───────────────────────────────────────

export function runAgentDecisionCycle(
  enabledAssets: Asset[],
  strategySignals: Record<Asset, StrategySignal[]>,
  analytics: Record<Asset, AssetAnalytics>,
  state: TradingState,
  portfolioDrawdown: number,
  maxDrawdownAllowed: number,
  agentConfig: AgentConfig,
): AgentState {
  const allConvictions: ConvictionScore[] = [];
  const allRecentPerf: RecentPerformanceSnapshot[] = [];
  const auditLog: AgentAuditEntry[] = [];

  // 1. Score every asset × strategy combination
  for (const asset of enabledAssets) {
    const signals = strategySignals[asset] ?? [];
    for (const sig of signals) {
      const recentPerf = computeRecentPerformance(
        state.trades, asset, sig.strategyId,
        agentConfig.recentPerformanceWindow,
        agentConfig.strategyCooldownCandles,
      );
      allRecentPerf.push(recentPerf);

      const conviction = calculateConviction(
        asset, sig, analytics[asset], recentPerf,
        portfolioDrawdown, maxDrawdownAllowed, state, agentConfig,
      );
      allConvictions.push(conviction);
    }
  }

  // 2. Rank eligible opportunities
  const eligible = allConvictions
    .filter(c => c.eligible && !c.disqualifyReason)
    .sort((a, b) => b.total - a.total);

  // 3. Determine how many slots available
  const currentPositions = Object.values(state.positions).filter(p => p !== null).length;
  const slotsAvailable = Math.max(0, agentConfig.maxSimultaneousPositions - currentPositions);

  // 4. Select top opportunities respecting limits
  const riskState = determineRiskState(portfolioDrawdown, state.isPaused);
  const decisions: AgentDecision[] = [];
  let slotsUsed = 0;

  for (const conv of eligible) {
    if (!agentConfig.allowMultiAssetAllocation && slotsUsed >= 1) break;
    if (slotsUsed >= slotsAvailable) {
      // Check if it's a flip (doesn't consume a new slot)
      const existingPos = state.positions[conv.asset];
      if (!existingPos) break;
    }

    const sig = (strategySignals[conv.asset] ?? []).find(s => s.strategyId === conv.strategyId);
    if (!sig) continue;

    const { percent, amount } = computeAllocationForConviction(
      conv.total, agentConfig, state.balance,
    );

    const existingPos = state.positions[conv.asset];
    let action: AgentAction = 'DO_NOTHING';
    if (sig.type === 'BUY') {
      if (existingPos?.direction === 'short') action = 'CLOSE_POSITION'; // will flip
      else if (!existingPos) action = 'OPEN_LONG';
      else action = 'HOLD_POSITION';
    } else if (sig.type === 'SELL') {
      if (existingPos?.direction === 'long') action = 'CLOSE_POSITION';
      else if (!existingPos) action = 'OPEN_SHORT';
      else action = 'HOLD_POSITION';
    }

    if (action === 'OPEN_LONG' || action === 'OPEN_SHORT') slotsUsed++;

    const decision: AgentDecision = {
      asset: conv.asset,
      strategyId: conv.strategyId,
      action,
      convictionScore: conv.total,
      allocationPercent: percent,
      allocationAmount: amount,
      explanation: '',
      timestamp: Date.now(),
    };
    decision.explanation = explainDecision(decision, conv, agentConfig);
    decisions.push(decision);

    // Audit
    auditLog.push({
      id: `${Date.now()}-${conv.asset}-${conv.strategyId}`,
      timestamp: Date.now(),
      asset: conv.asset,
      strategyId: conv.strategyId,
      signalType: sig.type,
      regime: analytics[conv.asset]?.marketRegime ?? 'sideways',
      volatilityCondition: determineVolatilityCondition(analytics[conv.asset]?.atrPercent),
      convictionScore: conv.total,
      recentPerfScore: conv.recentPerformance,
      riskState,
      selectedAction: action,
      allocationPercent: percent,
      explanation: decision.explanation,
    });
  }

  // 5. For non-eligible, generate DO_NOTHING audit entries
  const ineligible = allConvictions.filter(c => !c.eligible || c.disqualifyReason);
  for (const conv of ineligible) {
    const sig = (strategySignals[conv.asset] ?? []).find(s => s.strategyId === conv.strategyId);
    const doNothingDecision: AgentDecision = {
      asset: conv.asset,
      strategyId: conv.strategyId,
      action: 'DO_NOTHING',
      convictionScore: conv.total,
      allocationPercent: 0,
      allocationAmount: 0,
      explanation: '',
      timestamp: Date.now(),
    };
    doNothingDecision.explanation = explainDecision(doNothingDecision, conv, agentConfig);

    auditLog.push({
      id: `${Date.now()}-${conv.asset}-${conv.strategyId}-skip`,
      timestamp: Date.now(),
      asset: conv.asset,
      strategyId: conv.strategyId,
      signalType: sig?.type ?? 'HOLD',
      regime: analytics[conv.asset]?.marketRegime ?? 'sideways',
      volatilityCondition: determineVolatilityCondition(analytics[conv.asset]?.atrPercent),
      convictionScore: conv.total,
      recentPerfScore: conv.recentPerformance,
      riskState,
      selectedAction: 'DO_NOTHING',
      allocationPercent: 0,
      explanation: doNothingDecision.explanation,
    });
  }

  // 6. Determine no-trade reason
  let noTradeReason: string | null = null;
  if (decisions.length === 0) {
    if (state.isPaused) {
      noTradeReason = 'Risk pause is active — all trading halted.';
    } else if (riskState === 'critical') {
      noTradeReason = 'Portfolio drawdown is critical — sitting out.';
    } else if (eligible.length === 0 && ineligible.length > 0) {
      const topReasons = ineligible
        .filter(c => c.disqualifyReason)
        .slice(0, 3)
        .map(c => `${ASSET_INFO[c.asset]?.symbol}/${getStrategyDefinition(c.strategyId).name}: ${c.disqualifyReason}`);
      noTradeReason = `All conviction scores below threshold. ${topReasons.join('; ')}.`;
    } else {
      noTradeReason = 'No actionable signals across any asset or strategy.';
    }
  }

  return {
    decisions,
    auditLog,
    convictionScores: allConvictions,
    recentPerformance: allRecentPerf,
    topOpportunity: decisions[0] ?? null,
    noTradeReason,
    isActive: state.isRunning && !state.isPaused,
    riskState,
  };
}

// ─── Summary Explainability ──────────────────────────────────────────

export function explainAgentState(agentState: AgentState): string {
  const parts: string[] = [];

  if (!agentState.isActive) {
    parts.push('Agent is currently inactive.');
  }

  if (agentState.riskState === 'critical') {
    parts.push('Risk state is CRITICAL — the agent is not opening new positions.');
  } else if (agentState.riskState === 'elevated') {
    parts.push('Risk state is ELEVATED — position sizing is reduced.');
  }

  if (agentState.topOpportunity) {
    const top = agentState.topOpportunity;
    const symbol = ASSET_INFO[top.asset]?.symbol ?? top.asset;
    parts.push(`Top opportunity: ${symbol} via ${getStrategyDefinition(top.strategyId).name} (conviction: ${top.convictionScore.toFixed(0)}/100).`);
  }

  if (agentState.noTradeReason) {
    parts.push(agentState.noTradeReason);
  }

  const actionable = agentState.decisions.filter(d => d.action !== 'DO_NOTHING' && d.action !== 'HOLD_POSITION');
  if (actionable.length > 0) {
    parts.push(`${actionable.length} actionable decision(s) this cycle.`);
  }

  const underperformers = agentState.recentPerformance.filter(r => r.isUnderperforming);
  if (underperformers.length > 0) {
    const names = underperformers.map(u => `${ASSET_INFO[u.asset]?.symbol}/${getStrategyDefinition(u.strategyId).name}`);
    parts.push(`Underperforming: ${names.join(', ')} — confidence reduced.`);
  }

  return parts.join(' ');
}
