import { Trade } from '@/types/trading';
import { StrategyId } from '@/types/strategy';

export type RiskMode = 'aggressive' | 'balanced' | 'defensive' | 'preservation';

export interface ParticipationInputs {
  rollingProfitFactor: number;       // e.g. 0.5 - 3.0
  regimeStability: number;           // 0-100 (how consistent recent regime is)
  volatilityQuality: number;         // 0-100 (ATR in healthy band)
  signalRejectionRate: number;       // 0-1 (proportion of blocked signals)
  tradeQuality: number;              // 0-100 (avg conviction-weighted win quality)
  drawdownPressure: number;          // 0-100 (100 = at max DD limit)
  convictionAverage: number;         // 0-100
}

export interface StrategyRecommendation {
  strategyId: StrategyId;
  enabled: boolean;
  reason: string;
}

export interface ParticipationOutput {
  opportunityScore: number;          // 0-100
  participationMultiplier: number;   // 0.2 - 1.5
  positionSizeScale: number;         // 0.3 - 1.3
  riskMode: RiskMode;
  strategyRecommendations: StrategyRecommendation[];
  reasoning: string[];
  inputs: ParticipationInputs;
  timestamp: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Compute an overall market opportunity score [0-100] from quality inputs.
 * Weights favor edge (profit factor) and regime stability while penalizing
 * drawdown pressure and excessive signal rejection.
 */
export function computeOpportunityScore(inp: ParticipationInputs): number {
  const pfNorm = clamp((inp.rollingProfitFactor - 0.5) / 1.5, 0, 1) * 100;   // 0.5→0, 2.0→100
  const rejectQuality = (1 - clamp(inp.signalRejectionRate, 0, 1)) * 100;
  const ddQuality = 100 - clamp(inp.drawdownPressure, 0, 100);

  const score =
    pfNorm * 0.28 +
    inp.regimeStability * 0.18 +
    inp.volatilityQuality * 0.14 +
    rejectQuality * 0.10 +
    inp.tradeQuality * 0.12 +
    ddQuality * 0.12 +
    inp.convictionAverage * 0.06;

  return Math.round(clamp(score, 0, 100));
}

function deriveRiskMode(score: number, inp: ParticipationInputs): RiskMode {
  if (inp.drawdownPressure >= 80 || inp.rollingProfitFactor < 0.7) return 'preservation';
  if (score < 35) return 'defensive';
  if (score >= 72 && inp.regimeStability >= 60 && inp.rollingProfitFactor >= 1.2) return 'aggressive';
  return 'balanced';
}

function recommendStrategies(
  score: number,
  inp: ParticipationInputs,
  mode: RiskMode,
): StrategyRecommendation[] {
  const trending = inp.regimeStability >= 55 && inp.volatilityQuality >= 45;
  const sideways = inp.regimeStability < 40;

  const out: StrategyRecommendation[] = [];

  out.push({
    strategyId: 'sma_cross' as StrategyId,
    enabled: mode !== 'preservation' && trending,
    reason: trending
      ? 'Trending regime detected — trend-following enabled.'
      : 'Regime not trending — trend strategy paused.',
  });

  out.push({
    strategyId: 'mean_reversion' as StrategyId,
    enabled: mode !== 'preservation' && (sideways || mode === 'defensive'),
    reason: sideways
      ? 'Sideways regime — mean-reversion preferred.'
      : 'Trend dominant — mean-reversion deprioritized.',
  });

  out.push({
    strategyId: 'sniper' as StrategyId,
    enabled: mode === 'aggressive' && trending && inp.convictionAverage >= 60,
    reason:
      mode === 'aggressive' && trending
        ? 'High-conviction trend conditions — sniper armed.'
        : 'Conditions not strong enough for sniper.',
  });

  out.push({
    strategyId: 'sniper_v2' as StrategyId,
    enabled: trending && inp.volatilityQuality >= 55 && inp.rollingProfitFactor >= 1.0,
    reason:
      trending && inp.volatilityQuality >= 55
        ? 'Strong directional expansion — sniper v2 candidate.'
        : 'Volatility/edge insufficient for sniper v2.',
  });

  return out;
}

export function computeParticipation(inp: ParticipationInputs): ParticipationOutput {
  const opportunityScore = computeOpportunityScore(inp);
  const riskMode = deriveRiskMode(opportunityScore, inp);

  // Participation multiplier: how many candidate signals we let through.
  let participationMultiplier =
    riskMode === 'preservation' ? 0.25 :
    riskMode === 'defensive'    ? 0.55 :
    riskMode === 'aggressive'   ? 1.30 :
                                  0.90;
  // Nudge by opportunity score.
  participationMultiplier *= 0.7 + (opportunityScore / 100) * 0.6;
  participationMultiplier = Number(clamp(participationMultiplier, 0.2, 1.5).toFixed(2));

  // Position size scaling.
  let positionSizeScale =
    riskMode === 'preservation' ? 0.30 :
    riskMode === 'defensive'    ? 0.65 :
    riskMode === 'aggressive'   ? 1.20 :
                                  1.00;
  if (inp.drawdownPressure > 60) positionSizeScale *= 0.8;
  positionSizeScale = Number(clamp(positionSizeScale, 0.3, 1.3).toFixed(2));

  const reasoning: string[] = [];
  reasoning.push(`Opportunity score ${opportunityScore}/100 — risk mode ${riskMode}.`);
  if (inp.rollingProfitFactor < 1) reasoning.push(`Rolling profit factor ${inp.rollingProfitFactor.toFixed(2)} below breakeven — tightening selectivity.`);
  if (inp.regimeStability < 40) reasoning.push('Regime unstable — trend strategies deprioritized.');
  if (inp.regimeStability >= 60) reasoning.push('Regime stable — directional strategies favored.');
  if (inp.volatilityQuality < 35) reasoning.push('Volatility outside healthy band — participation reduced.');
  if (inp.drawdownPressure >= 70) reasoning.push('High drawdown pressure — defensive sizing engaged.');
  if (inp.signalRejectionRate > 0.7) reasoning.push('Most signals being rejected — market quality low.');
  if (inp.convictionAverage >= 70) reasoning.push('Conviction averages high — quality entries available.');

  const strategyRecommendations = recommendStrategies(opportunityScore, inp, riskMode);

  return {
    opportunityScore,
    participationMultiplier,
    positionSizeScale,
    riskMode,
    strategyRecommendations,
    reasoning,
    inputs: inp,
    timestamp: Date.now(),
  };
}

/**
 * Derive inputs from recent trades + analytics-style metrics.
 * Useful when wiring into live state.
 */
export function deriveInputsFromTrades(
  trades: Trade[],
  opts: {
    drawdownPercent: number;
    drawdownLimitPercent: number;
    signalsConsidered: number;
    signalsBlocked: number;
    avgConviction?: number;
    regimeStability?: number;
    volatilityQuality?: number;
  },
): ParticipationInputs {
  const recent = trades.slice(-30);
  const wins = recent.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const losses = Math.abs(recent.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const pf = losses > 0 ? wins / losses : wins > 0 ? 2.5 : 1.0;

  const winRate = recent.length ? recent.filter(t => t.pnl > 0).length / recent.length : 0.5;
  const avgConv = opts.avgConviction ?? (recent.reduce((s, t) => s + (t.convictionScore ?? 50), 0) / Math.max(1, recent.length));
  const tradeQuality = clamp(winRate * 60 + (avgConv / 100) * 40, 0, 100);

  const rejectRate = opts.signalsConsidered > 0
    ? clamp(opts.signalsBlocked / opts.signalsConsidered, 0, 1)
    : 0.5;

  const ddPressure = clamp((opts.drawdownPercent / Math.max(0.01, opts.drawdownLimitPercent)) * 100, 0, 100);

  return {
    rollingProfitFactor: Number(pf.toFixed(2)),
    regimeStability: opts.regimeStability ?? 50,
    volatilityQuality: opts.volatilityQuality ?? 50,
    signalRejectionRate: Number(rejectRate.toFixed(2)),
    tradeQuality: Math.round(tradeQuality),
    drawdownPressure: Math.round(ddPressure),
    convictionAverage: Math.round(avgConv),
  };
}
