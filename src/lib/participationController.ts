import { Trade } from '@/types/trading';
import { StrategyId } from '@/types/strategy';

export type RiskMode = 'aggressive' | 'balanced' | 'defensive' | 'preservation';

export interface ParticipationInputs {
  rollingProfitFactor: number;       // e.g. 0.5 - 3.0
  regimeStability: number;           // 0-100
  volatilityQuality: number;         // 0-100
  signalRejectionRate: number;       // 0-1
  tradeQuality: number;              // 0-100
  drawdownPressure: number;          // 0-100
  convictionAverage: number;         // 0-100
  // Optional confidence / trend context (used by recovery + override logic)
  sampleSize?: number;               // # of recent trades informing PF
  trendStrength?: number;            // 0-100 (HTF directional strength)
  trendContinuationQuality?: number; // 0-100 (continuation quality rising?)
}

export interface StrategyRecommendation {
  strategyId: StrategyId;
  enabled: boolean;
  reason: string;
}

export interface ParticipationOutput {
  opportunityScore: number;
  participationMultiplier: number;   // 0.2 - 1.5
  positionSizeScale: number;         // 0.3 - 1.3
  riskMode: RiskMode;
  strategyRecommendations: StrategyRecommendation[];
  reasoning: string[];
  inputs: ParticipationInputs;
  regimeOverrideActive: boolean;
  neutralStartup: boolean;
  trendBiasActive: boolean;
  effectiveProfitFactor: number;
  timestamp: number;
}

export interface ParticipationContext {
  /** Previous multiplier — enables smooth confidence-recovery curve. */
  previousMultiplier?: number;
  /** Min sample size before PF is trusted (defaults to 8). */
  minTrustedSamples?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Compute an overall market opportunity score [0-100]. */
export function computeOpportunityScore(inp: ParticipationInputs, effectivePF?: number): number {
  const pf = effectivePF ?? inp.rollingProfitFactor;
  const pfNorm = clamp((pf - 0.5) / 1.5, 0, 1) * 100;
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

function regimeOverrideQualifies(inp: ParticipationInputs): boolean {
  return inp.regimeStability >= 70 && inp.volatilityQuality >= 70 && inp.tradeQuality >= 60;
}

function trendBiasQualifies(inp: ParticipationInputs): boolean {
  const ts = inp.trendStrength ?? 0;
  const tc = inp.trendContinuationQuality ?? 0;
  return ts >= 65 && tc >= 60;
}

function deriveRiskMode(
  score: number,
  inp: ParticipationInputs,
  effectivePF: number,
  regimeOverride: boolean,
): RiskMode {
  // Preservation still wins on real risk events.
  if (inp.drawdownPressure >= 80) return 'preservation';
  // PF-driven preservation is suppressed by regime override.
  if (!regimeOverride && effectivePF < 0.7) return 'preservation';
  if (regimeOverride) {
    // Allow aggressive/balanced regardless of PF weakness.
    if (score >= 70 && inp.convictionAverage >= 55) return 'aggressive';
    return 'balanced';
  }
  if (score < 35) return 'defensive';
  if (score >= 72 && inp.regimeStability >= 60 && effectivePF >= 1.2) return 'aggressive';
  return 'balanced';
}

function recommendStrategies(
  score: number,
  inp: ParticipationInputs,
  mode: RiskMode,
): StrategyRecommendation[] {
  const trending = inp.regimeStability >= 55 && inp.volatilityQuality >= 45;
  const sideways = inp.regimeStability < 40;

  return [
    {
      strategyId: 'sma_cross' as StrategyId,
      enabled: mode !== 'preservation' && trending,
      reason: trending ? 'Trending regime detected — trend-following enabled.' : 'Regime not trending — trend strategy paused.',
    },
    {
      strategyId: 'mean_reversion' as StrategyId,
      enabled: mode !== 'preservation' && (sideways || mode === 'defensive'),
      reason: sideways ? 'Sideways regime — mean-reversion preferred.' : 'Trend dominant — mean-reversion deprioritized.',
    },
    {
      strategyId: 'sniper' as StrategyId,
      enabled: mode === 'aggressive' && trending && inp.convictionAverage >= 60,
      reason: mode === 'aggressive' && trending ? 'High-conviction trend conditions — sniper armed.' : 'Conditions not strong enough for sniper.',
    },
    {
      strategyId: 'sniper_v2' as StrategyId,
      enabled: trending && inp.volatilityQuality >= 55 && (inp.rollingProfitFactor >= 1.0 || regimeOverrideQualifies(inp)),
      reason: trending && inp.volatilityQuality >= 55 ? 'Strong directional expansion — sniper v2 candidate.' : 'Volatility/edge insufficient for sniper v2.',
    },
  ];
}

export function computeParticipation(
  inp: ParticipationInputs,
  ctx: ParticipationContext = {},
): ParticipationOutput {
  const minTrusted = ctx.minTrustedSamples ?? 8;
  const reasoning: string[] = [];

  // ---- 2. Neutral startup: small sample → PF treated as neutral 1.0.
  const sample = inp.sampleSize ?? 0;
  const neutralStartup = sample > 0 && sample < minTrusted;
  let effectivePF = inp.rollingProfitFactor;
  if (neutralStartup) {
    // Blend toward 1.0 proportionally to how thin the sample is.
    const w = sample / minTrusted; // 0..1
    effectivePF = inp.rollingProfitFactor * w + 1.0 * (1 - w);
    reasoning.push(`Thin sample (${sample}/${minTrusted}) — treating PF as neutral ${effectivePF.toFixed(2)}.`);
  }

  // ---- 4. Trend opportunity bias: lift PF weight when trend is strong & rising.
  const trendBiasActive = trendBiasQualifies(inp);
  if (trendBiasActive && effectivePF < 1.0) {
    const lift = 0.35 + 0.25 * ((inp.trendContinuationQuality ?? 60) - 60) / 40; // 0.35..0.6
    effectivePF = Math.min(1.2, effectivePF + clamp(lift, 0.25, 0.6));
    reasoning.push(`Strong trend continuation — reducing weight of weak PF history (effective PF ${effectivePF.toFixed(2)}).`);
  }

  // ---- 1. Regime override.
  const regimeOverride = regimeOverrideQualifies(inp);
  if (regimeOverride) reasoning.push('Regime override active — high stability/volatility/quality enforces healthy participation.');

  const opportunityScore = computeOpportunityScore(inp, effectivePF);
  const riskMode = deriveRiskMode(opportunityScore, inp, effectivePF, regimeOverride);

  // Base participation by mode.
  let participationMultiplier =
    riskMode === 'preservation' ? 0.25 :
    riskMode === 'defensive'    ? 0.55 :
    riskMode === 'aggressive'   ? 1.30 :
                                  0.90;
  // Nudge by opportunity score.
  participationMultiplier *= 0.7 + (opportunityScore / 100) * 0.6;

  // ---- 1. Enforce minimum participation floor when regime override active.
  if (regimeOverride) {
    participationMultiplier = Math.max(participationMultiplier, 0.85);
  }

  // ---- 4. Trend bias also lifts the floor when continuation is strong.
  if (trendBiasActive) {
    participationMultiplier = Math.max(participationMultiplier, 0.75);
  }

  // ---- 3. Confidence recovery curve: gentle EMA-style transition, faster up than down.
  if (typeof ctx.previousMultiplier === 'number' && Number.isFinite(ctx.previousMultiplier)) {
    const prev = ctx.previousMultiplier;
    const target = participationMultiplier;
    // Faster recovery (target > prev), slower retreat — prevents hard switches.
    const alpha = target > prev ? 0.45 : 0.25;
    participationMultiplier = prev + (target - prev) * alpha;
    if (Math.abs(target - prev) > 0.1) {
      reasoning.push(`Confidence recovery curve smoothing (${prev.toFixed(2)} → ${participationMultiplier.toFixed(2)}, target ${target.toFixed(2)}).`);
    }
  }

  participationMultiplier = Number(clamp(participationMultiplier, 0.2, 1.5).toFixed(2));

  // Position sizing.
  let positionSizeScale =
    riskMode === 'preservation' ? 0.30 :
    riskMode === 'defensive'    ? 0.65 :
    riskMode === 'aggressive'   ? 1.20 :
                                  1.00;
  if (inp.drawdownPressure > 60) positionSizeScale *= 0.8;
  if (regimeOverride) positionSizeScale = Math.max(positionSizeScale, 0.85);
  positionSizeScale = Number(clamp(positionSizeScale, 0.3, 1.3).toFixed(2));

  reasoning.unshift(`Opportunity score ${opportunityScore}/100 — risk mode ${riskMode}.`);
  if (!neutralStartup && inp.rollingProfitFactor < 1) reasoning.push(`Rolling profit factor ${inp.rollingProfitFactor.toFixed(2)} below breakeven — tightening selectivity.`);
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
    regimeOverrideActive: regimeOverride,
    neutralStartup,
    trendBiasActive,
    effectiveProfitFactor: Number(effectivePF.toFixed(2)),
    timestamp: Date.now(),
  };
}

/** Derive inputs from recent trades + analytics-style metrics. */
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
    trendStrength?: number;
    trendContinuationQuality?: number;
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
    sampleSize: recent.length,
    trendStrength: opts.trendStrength,
    trendContinuationQuality: opts.trendContinuationQuality,
  };
}
