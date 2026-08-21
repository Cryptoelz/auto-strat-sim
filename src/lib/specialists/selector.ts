import { SpecialistProposal, SpecialistId, SpecialistStats } from './types';

export interface ChampionScore {
  specialistId: SpecialistId;
  specialistName: string;
  total: number;
  components: {
    historicalPerformance: number;
    confidence: number;
    regimeFit: number;
    risk: number;
    expectedValue: number;
    governance: number;
    researchQuality: number;
    evidence: number;
  };
  rationale: string;
}

export interface ChampionResult {
  champion: SpecialistProposal | null;
  runnerUp: SpecialistProposal | null;
  scores: ChampionScore[];
  decision: 'PROPOSE' | 'NO_ACTION';
  explanation: string;
}

const WEIGHTS = {
  historicalPerformance: 0.2,
  confidence: 0.2,
  regimeFit: 0.12,
  risk: 0.12,
  expectedValue: 0.16,
  governance: 0.08,
  researchQuality: 0.06,
  evidence: 0.06,
};

/**
 * Scores every proposal against institutional criteria.
 * No specialist automatically wins — a WAIT can beat an actionable proposal.
 */
export function selectChampion(
  proposals: SpecialistProposal[],
  stats: Record<SpecialistId, SpecialistStats>,
  governanceHealth = 100,
): ChampionResult {
  const scores: ChampionScore[] = proposals.map((p) => {
    const s = stats[p.specialistId];
    const historicalPerformance = Math.min(100, (s?.profitFactor ?? 1) * 40 + (s?.winRate ?? 0) * 0.4);
    const confidence = p.confidence;
    const regimeFit = p.regime === 'sideways' && (p.specialistId === 'mean_reversion' || p.specialistId === 'volatility')
      ? 90
      : p.regime !== 'sideways' && (p.specialistId === 'trend' || p.specialistId === 'momentum' || p.specialistId === 'breakout')
        ? 90
        : 45;
    const risk = 100 - p.risk;
    const expectedValue = Math.max(0, Math.min(100, (p.expectedValue + 1) * 40));
    const governance = governanceHealth;
    const researchQuality = s?.researchScore ?? 60;
    const evidence = p.evidence.length ? (p.evidence.filter((e) => e.pass).length / p.evidence.length) * 100 : 0;

    const components = { historicalPerformance, confidence, regimeFit, risk, expectedValue, governance, researchQuality, evidence };
    const total = Object.entries(WEIGHTS).reduce(
      (acc, [k, w]) => acc + (components as Record<string, number>)[k] * w,
      0,
    );

    return {
      specialistId: p.specialistId,
      specialistName: p.specialistName,
      total: Number(total.toFixed(1)),
      components,
      rationale: `${p.signal} at ${p.confidence}% confidence, ${evidence.toFixed(0)}% evidence passed, EV ${p.expectedValue.toFixed(2)}R.`,
    };
  });

  const ranked = [...scores].sort((a, b) => b.total - a.total);
  const byId = (id?: SpecialistId) => proposals.find((p) => p.specialistId === id) ?? null;
  const champion = byId(ranked[0]?.specialistId);
  const runnerUp = byId(ranked[1]?.specialistId);

  const actionable = champion && champion.signal !== 'WAIT' && (ranked[0]?.total ?? 0) >= 55;

  return {
    champion,
    runnerUp,
    scores: ranked,
    decision: actionable ? 'PROPOSE' : 'NO_ACTION',
    explanation: !champion
      ? 'No proposals available.'
      : actionable
        ? `${champion.specialistName} wins with ${ranked[0].total} institution points and proposes ${champion.signal}. Proposal advances to Risk → Portfolio → Allocation → Governance.`
        : `${champion.specialistName} leads with ${ranked[0].total} points but the institution takes no action — the strongest proposal is a WAIT or scores below the 55-point action bar.`,
  };
}
