import { Asset, Candle, MarketRegime } from '@/types/trading';

export type SpecialistId = 'trend' | 'momentum' | 'mean_reversion' | 'volatility' | 'breakout';

export type ProposalSignal = 'BUY' | 'SELL' | 'WAIT';

export interface Evidence {
  label: string;
  value: string;
  threshold: string;
  pass: boolean;
}

/** Read-only market snapshot. The ONLY shared dependency between specialists. */
export interface MarketContext {
  asset: Asset;
  candles: Candle[];
  price: number;
  timestamp: number;
}

export interface SpecialistProposal {
  specialistId: SpecialistId;
  specialistName: string;
  asset: Asset;
  regime: MarketRegime;
  signal: ProposalSignal;
  confidence: number;          // 0-100
  risk: number;                // 0-100
  expectedReward: number;      // R multiple
  expectedValue: number;       // confidence-weighted R
  suggestedSizePercent: number;
  suggestedStop: number;
  suggestedTarget: number;
  evidence: Evidence[];
  reasoning: string[];
  institutionScore: number;    // 0-100 self-assessed quality
  timestamp: number;
}

export interface SpecialistStats {
  proposals: number;
  actionable: number;
  waits: number;
  correctWaits: number;
  incorrectWaits: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpe: number;
  sortino: number;
  expectedValue: number;
  alpha: number;
  opportunityCost: number;
  researchScore: number;
  institutionRating: number;
  avgConfidence: number;
}

export interface Specialist {
  id: SpecialistId;
  meta: { name: string; mission: string; timeframe: string; colorToken: string };
  /** Pure and deterministic. Must not read or import any other specialist. */
  analyse(ctx: MarketContext): SpecialistProposal;
}

export const EMPTY_PROPOSAL = (
  id: SpecialistId,
  name: string,
  ctx: MarketContext,
  reason: string,
): SpecialistProposal => ({
  specialistId: id,
  specialistName: name,
  asset: ctx.asset,
  regime: 'sideways',
  signal: 'WAIT',
  confidence: 0,
  risk: 0,
  expectedReward: 0,
  expectedValue: 0,
  suggestedSizePercent: 0,
  suggestedStop: 0,
  suggestedTarget: 0,
  evidence: [],
  reasoning: [reason],
  institutionScore: 0,
  timestamp: ctx.timestamp,
});
