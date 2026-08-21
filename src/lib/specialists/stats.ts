import { SpecialistId, SpecialistStats, SpecialistProposal } from './types';

const STORAGE_KEY = 'atlas_specialist_stats_v1';
const LEDGER_KEY = 'atlas_specialist_ledger_v1';
const LEDGER_LIMIT = 400;

export const SPECIALIST_IDS: SpecialistId[] = ['trend', 'momentum', 'mean_reversion', 'volatility', 'breakout'];

const emptyStats = (): SpecialistStats => ({
  proposals: 0,
  actionable: 0,
  waits: 0,
  correctWaits: 0,
  incorrectWaits: 0,
  winRate: 0,
  profitFactor: 0,
  maxDrawdown: 0,
  sharpe: 0,
  sortino: 0,
  expectedValue: 0,
  alpha: 0,
  opportunityCost: 0,
  researchScore: 60,
  institutionRating: 50,
  avgConfidence: 0,
});

export type StatsMap = Record<SpecialistId, SpecialistStats>;

export const emptyStatsMap = (): StatsMap =>
  SPECIALIST_IDS.reduce((acc, id) => {
    acc[id] = emptyStats();
    return acc;
  }, {} as StatsMap);

export function loadStats(): StatsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStatsMap();
    return { ...emptyStatsMap(), ...JSON.parse(raw) };
  } catch {
    return emptyStatsMap();
  }
}

export function saveStats(stats: StatsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* storage full — shadow mode tolerates loss */
  }
}

export interface LedgerEntry {
  timestamp: number;
  asset: string;
  proposals: SpecialistProposal[];
  championId: SpecialistId | null;
  decision: 'PROPOSE' | 'NO_ACTION';
}

export function loadLedger(): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendLedger(entry: LedgerEntry): LedgerEntry[] {
  const next = [entry, ...loadLedger()].slice(0, LEDGER_LIMIT);
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

/**
 * Derives per-specialist statistics from the observed proposal ledger.
 * Shadow mode: each specialist's record is built from its OWN entries only.
 */
export function deriveStats(ledger: LedgerEntry[]): StatsMap {
  const map = emptyStatsMap();

  SPECIALIST_IDS.forEach((id) => {
    const mine = ledger.flatMap((e) => e.proposals.filter((p) => p.specialistId === id));
    if (mine.length === 0) return;

    const actionable = mine.filter((p) => p.signal !== 'WAIT');
    const waits = mine.filter((p) => p.signal === 'WAIT');
    const evs = mine.map((p) => p.expectedValue);
    const meanEv = evs.reduce((a, b) => a + b, 0) / evs.length;
    const sd = Math.sqrt(evs.reduce((a, b) => a + (b - meanEv) ** 2, 0) / evs.length) || 1;
    const downside = evs.filter((v) => v < meanEv);
    const dsd = Math.sqrt(downside.reduce((a, b) => a + (b - meanEv) ** 2, 0) / (downside.length || 1)) || 1;
    const wins = actionable.filter((p) => p.expectedValue > 0);
    const losses = actionable.filter((p) => p.expectedValue <= 0);
    const grossWin = wins.reduce((a, p) => a + p.expectedValue, 0);
    const grossLoss = Math.abs(losses.reduce((a, p) => a + p.expectedValue, 0)) || 1;
    const avgConfidence = mine.reduce((a, p) => a + p.confidence, 0) / mine.length;
    const evidenceQuality =
      mine.reduce((a, p) => a + (p.evidence.length ? p.evidence.filter((e) => e.pass).length / p.evidence.length : 0), 0) /
      mine.length;

    // A wait is "correct" when the specialist's own evidence stayed weak.
    const correctWaits = waits.filter((p) => p.institutionScore < 50).length;

    const stats: SpecialistStats = {
      proposals: mine.length,
      actionable: actionable.length,
      waits: waits.length,
      correctWaits,
      incorrectWaits: waits.length - correctWaits,
      winRate: actionable.length ? Number(((wins.length / actionable.length) * 100).toFixed(1)) : 0,
      profitFactor: Number((grossWin / grossLoss).toFixed(2)),
      maxDrawdown: Number((Math.abs(Math.min(0, ...evs)) * 2).toFixed(2)),
      sharpe: Number((meanEv / sd).toFixed(2)),
      sortino: Number((meanEv / dsd).toFixed(2)),
      expectedValue: Number(meanEv.toFixed(2)),
      alpha: Number((meanEv * 10).toFixed(2)),
      opportunityCost: Number((waits.filter((p) => p.institutionScore >= 50).length * 0.25).toFixed(2)),
      researchScore: Math.round(evidenceQuality * 100),
      institutionRating: Math.round(Math.min(100, avgConfidence * 0.5 + evidenceQuality * 50)),
      avgConfidence: Number(avgConfidence.toFixed(1)),
    };
    map[id] = stats;
  });

  return map;
}
