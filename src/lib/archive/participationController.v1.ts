/**
 * ARCHIVED — Market Participation Controller v1
 * ---------------------------------------------
 * Superseded by v2 (Confidence Recovery) on 2026-05-12.
 *
 * Retained for historical comparison, A/B replays, and audit transparency.
 * Do NOT import from the live runtime — the active controller is
 * `src/lib/participationController.ts` (v2).
 *
 * v1 limitations that motivated v2:
 *  - Defensive latch on small trade samples (PF treated as real).
 *  - No regime override → strong trends gated by stale weak PF.
 *  - Hard-switch transitions between modes (no recovery curve).
 *  - No trend continuation bias.
 */
import { Trade } from '@/types/trading';
import { StrategyId } from '@/types/strategy';

export type RiskModeV1 = 'aggressive' | 'balanced' | 'defensive' | 'preservation';

export interface ParticipationInputsV1 {
  rollingProfitFactor: number;
  regimeStability: number;
  volatilityQuality: number;
  signalRejectionRate: number;
  tradeQuality: number;
  drawdownPressure: number;
  convictionAverage: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function computeOpportunityScoreV1(inp: ParticipationInputsV1): number {
  const pfNorm = clamp((inp.rollingProfitFactor - 0.5) / 1.5, 0, 1) * 100;
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

export function computeParticipationV1(inp: ParticipationInputsV1) {
  const score = computeOpportunityScoreV1(inp);
  let mode: RiskModeV1;
  if (inp.drawdownPressure >= 80 || inp.rollingProfitFactor < 0.7) mode = 'preservation';
  else if (score < 35) mode = 'defensive';
  else if (score >= 72 && inp.regimeStability >= 60 && inp.rollingProfitFactor >= 1.2) mode = 'aggressive';
  else mode = 'balanced';

  let mult = { preservation: 0.25, defensive: 0.55, balanced: 0.90, aggressive: 1.30 }[mode];
  mult *= 0.7 + (score / 100) * 0.6;
  mult = Number(clamp(mult, 0.2, 1.5).toFixed(2));

  let size = { preservation: 0.30, defensive: 0.65, balanced: 1.00, aggressive: 1.20 }[mode];
  if (inp.drawdownPressure > 60) size *= 0.8;
  size = Number(clamp(size, 0.3, 1.3).toFixed(2));

  return { opportunityScore: score, riskMode: mode, participationMultiplier: mult, positionSizeScale: size, version: 'v1' as const };
}

// Re-export marker so build tools keep this file.
export const MPC_V1_ARCHIVED_AT = '2026-05-12';
export type { Trade, StrategyId };
