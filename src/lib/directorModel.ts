/**
 * Portfolio AI Director™ — shared simulation model.
 * Research / observation only. No execution, no live trading.
 */

export type SpecialistKey = 'tr' | 'ms' | 'vcb' | 'mr' | 'lvc';

export interface Specialist {
  key: SpecialistKey;
  name: string;
  short: string;
  regime: string;
  color: string;
  /** 90-day standalone research metrics */
  pnl: number;      // net PnL at 100% notional weight
  pf: number;
  dd: number;       // max drawdown %
  wr: number;       // win rate %
  capture: number;  // move capture %
  sharpe: number;
  efficiency: number; // capital efficiency 0-1
  default: number;    // recommended allocation %
  min: number;
  max: number;
  why: string;
  whyAllocation: string;
  protects: string;
  offsets: string;
  contribution: string;
  regimeExposure: Record<string, number>;
}

export const SPECIALISTS: Specialist[] = [
  {
    key: 'tr', name: 'Trend Rider v1', short: 'TR', regime: 'Bull / Bear Trend',
    color: 'hsl(var(--trading-profit))',
    pnl: 4820, pf: 1.94, dd: 3.6, wr: 58.4, capture: 63, sharpe: 1.72, efficiency: 0.81,
    default: 40, min: 0, max: 60,
    why: 'Highest Elo on the Specialist Championship board (1742) and current Gold Belt holder with 47 days of uninterrupted regime leadership. It is the only specialist with a positive expectancy in both directional regimes.',
    whyAllocation: 'Receives the largest sleeve because directional trend is the highest-frequency regime in the 90-day window (38% of sessions) and TR posts the best PF-per-unit-drawdown among all five candidates.',
    protects: 'Bull Trend and Bear Trend — the two regimes where mean-reversion logic bleeds.',
    offsets: 'Offsets the chop-drag of Mean Reversion v1 and the inactivity gaps of Momentum Scalper v2.',
    contribution: 'Expected ~41% of portfolio net PnL and ~34% of total move capture.',
    regimeExposure: { Bull: 46, Bear: 28, Sideways: 6, 'High Vol': 14, 'Low Vol': 6 },
  },
  {
    key: 'ms', name: 'Momentum Scalper v2', short: 'MS', regime: 'High Volatility',
    color: 'hsl(var(--trading-xrp))',
    pnl: 3128, pf: 1.56, dd: 3.1, wr: 54.1, capture: 71, sharpe: 1.34, efficiency: 0.74,
    default: 25, min: 0, max: 40,
    why: 'Specialist Approved after the Regime Activation Audit (Precision 81.6%, Recall 81.6%, Accuracy 84.4%). Its activation gate removed the -$1,052 chop bleed that disqualified v1.',
    whyAllocation: 'Sized at a quarter of book because the activation gate keeps it flat 42% of the time — a larger sleeve would idle capital without adding capture.',
    protects: 'High Volatility expansions and ATR-breakout sessions Router v2 structurally ignores.',
    offsets: 'Offsets Low-Vol Coiler v2, which is forced flat exactly when MS v2 is most active.',
    contribution: 'Expected ~24% of net PnL and the single largest share of move capture (71% capture rate).',
    regimeExposure: { Bull: 22, Bear: 14, Sideways: 0, 'High Vol': 62, 'Low Vol': 2 },
  },
  {
    key: 'vcb', name: 'VCB v1', short: 'VCB', regime: 'Compression → Expansion',
    color: 'hsl(var(--trading-fet))',
    pnl: 10070, pf: 1.64, dd: 3.4, wr: 56.8, capture: 67, sharpe: 1.48, efficiency: 0.78,
    default: 20, min: 0, max: 35,
    why: 'Only specialist profitable in all five regimes across the 90-day validation, with the lowest entry delay (1 candle) and the fewest missed moves (12) in the peer capture audit.',
    whyAllocation: 'A fifth of book: high standalone PF, but 49.8% of its PnL is concentrated in High Volatility, which already carries MS v2 exposure. The cap prevents double-counting that regime.',
    protects: 'The transition boundary — the handover window between Low Volatility coiling and High Volatility expansion.',
    offsets: 'Offsets timing risk in the Low-Vol → High-Vol handoff where both LVC and MS are momentarily blind.',
    contribution: 'Expected ~19% of net PnL and the strongest contribution to regime-transition capture.',
    regimeExposure: { Bull: 18, Bear: 12, Sideways: 10, 'High Vol': 44, 'Low Vol': 16 },
  },
  {
    key: 'mr', name: 'Mean Reversion v1', short: 'MR', regime: 'Sideways / Range',
    color: 'hsl(var(--trading-warning))',
    pnl: 2140, pf: 1.51, dd: 2.4, wr: 61.2, capture: 52, sharpe: 1.19, efficiency: 0.69,
    default: 15, min: 0, max: 30,
    why: 'Sideways and Low-Vol regime champion on the Championship board. It is the only member of the roster with positive expectancy while trend-following logic is structurally flat.',
    whyAllocation: 'Kept modest at 15% because Sideways probability has fallen in the current regime read; the sleeve exists as coverage insurance rather than as a primary return driver.',
    protects: 'Range-bound and rotational markets where breakout logic produces repeated false starts.',
    offsets: 'Directly offsets Trend Rider drawdown clusters, which historically occur inside chop.',
    contribution: 'Expected ~9% of net PnL but a disproportionate reduction in portfolio drawdown variance.',
    regimeExposure: { Bull: 6, Bear: 8, Sideways: 64, 'High Vol': 4, 'Low Vol': 18 },
  },
  {
    key: 'lvc', name: 'Low-Vol Coiler v2', short: 'LVC', regime: 'Low Volatility',
    color: 'hsl(var(--trading-xlm))',
    pnl: 1860, pf: 1.74, dd: 2.1, wr: 64.2, capture: 64, sharpe: 1.28, efficiency: 0.72,
    default: 0, min: 0, max: 20,
    why: 'Approved at v2 after aggregate capture lifted 60% → 64% and PF improved 1.66 → 1.74. It closes the 41% Low-Volatility coverage gap identified by Discovery Lab v2.',
    whyAllocation: 'Held at 0% in the recommended book: the current regime read is High-Vol leaning, and LVC is designed to be dormant there. It is staged for activation when ATR% falls below 0.35.',
    protects: 'Compressed, low-ATR conditions where every other specialist is either flat or over-trading.',
    offsets: 'Offsets the idle-capital drag created when MS v2 and VCB are gated off.',
    contribution: 'Expected ~7% of net PnL when the Low-Vol regime activates; 0% contribution in the current read.',
    regimeExposure: { Bull: 4, Bear: 4, Sideways: 18, 'High Vol': 2, 'Low Vol': 72 },
  },
];

export const REGIMES = ['Bull', 'Bear', 'Sideways', 'High Vol', 'Low Vol'] as const;

/** Correlation penalty matrix — higher = more overlapping behaviour */
const OVERLAP: Record<string, number> = {
  'tr-ms': 0.34, 'tr-vcb': 0.28, 'tr-mr': 0.06, 'tr-lvc': 0.09,
  'ms-vcb': 0.58, 'ms-mr': 0.05, 'ms-lvc': 0.04,
  'vcb-mr': 0.19, 'vcb-lvc': 0.31, 'mr-lvc': 0.44,
};

export function overlapOf(a: SpecialistKey, b: SpecialistKey) {
  return OVERLAP[`${a}-${b}`] ?? OVERLAP[`${b}-${a}`] ?? 0.2;
}

export interface Forecast {
  pnl: number; pf: number; dd: number; wr: number; capture: number;
  efficiency: number; diversification: number; sharpe: number;
  regimeExposure: { regime: string; value: number }[];
  coverage: number; correlation: number; riskBalance: number;
  health: number; totalWeight: number;
}

export function computeForecast(weights: Record<SpecialistKey, number>): Forecast {
  const total = SPECIALISTS.reduce((s, sp) => s + weights[sp.key], 0);
  const w = (sp: Specialist) => (total > 0 ? weights[sp.key] / total : 0);

  const pnlBase = SPECIALISTS.reduce((s, sp) => s + w(sp) * sp.pnl, 0);
  const pf = SPECIALISTS.reduce((s, sp) => s + w(sp) * sp.pf, 0);
  const wr = SPECIALISTS.reduce((s, sp) => s + w(sp) * sp.wr, 0);
  const capture = SPECIALISTS.reduce((s, sp) => s + w(sp) * sp.capture, 0);
  const efficiency = SPECIALISTS.reduce((s, sp) => s + w(sp) * sp.efficiency, 0);
  const sharpeBase = SPECIALISTS.reduce((s, sp) => s + w(sp) * sp.sharpe, 0);

  let corrNum = 0, corrDen = 0;
  for (let i = 0; i < SPECIALISTS.length; i++) {
    for (let j = i + 1; j < SPECIALISTS.length; j++) {
      const a = SPECIALISTS[i], b = SPECIALISTS[j];
      const pairW = w(a) * w(b);
      corrNum += pairW * overlapOf(a.key, b.key);
      corrDen += pairW;
    }
  }
  const correlation = corrDen > 0 ? corrNum / corrDen : 0;

  const hhi = SPECIALISTS.reduce((s, sp) => s + w(sp) ** 2, 0);
  const active = SPECIALISTS.filter((sp) => w(sp) > 0.001).length || 1;
  const evenness = active > 1 ? (1 / hhi - 1) / (SPECIALISTS.length - 1) : 0;
  const diversification = Math.max(0, Math.min(100, evenness * 100 * (1 - correlation * 0.45)));

  const regimeExposure = REGIMES.map((r) => ({
    regime: r,
    value: Math.round(SPECIALISTS.reduce((s, sp) => s + w(sp) * (sp.regimeExposure[r] ?? 0), 0)),
  }));
  const covered = regimeExposure.filter((r) => r.value >= 10).length;
  const minExp = Math.min(...regimeExposure.map((r) => r.value));
  const coverage = Math.round((covered / REGIMES.length) * 80 + Math.min(minExp, 20));

  const ddBase = SPECIALISTS.reduce((s, sp) => s + w(sp) * sp.dd, 0);
  const dd = ddBase * (1 - (diversification / 100) * 0.32) * (1 + correlation * 0.22);

  const pnl = pnlBase * (1 + (diversification / 100) * 0.06 - correlation * 0.05);
  const sharpe = sharpeBase * (1 + (diversification / 100) * 0.18 - correlation * 0.15);

  const riskBalance = Math.round(
    Math.max(0, Math.min(100, 100 - (dd / 5) * 40 - correlation * 45 + (diversification / 100) * 22)),
  );

  const health = Math.round(
    coverage * 0.2 + diversification * 0.2 + (1 - correlation) * 100 * 0.15 +
    efficiency * 100 * 0.15 + riskBalance * 0.2 + 89 * 0.1,
  ) + 14;

  return {
    pnl, pf, dd, wr, capture, efficiency, diversification, sharpe,
    regimeExposure, coverage, correlation, riskBalance,
    health: Math.max(0, Math.min(100, health)), totalWeight: total,
  };
}

export function confidenceOf(f: Forecast) {
  const score = Math.round(
    f.health * 0.4 + Math.min(100, (f.pf / 2.2) * 100) * 0.25 +
    f.diversification * 0.2 + Math.max(0, 100 - f.dd * 22) * 0.15,
  );
  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: clamped,
    label: clamped >= 82 ? 'Very High' : clamped >= 68 ? 'High' : clamped >= 50 ? 'Medium' : 'Low',
  };
}

export const fmtUsd = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

export const DEFAULT_WEIGHTS = SPECIALISTS.reduce((acc, sp) => {
  acc[sp.key] = sp.default; return acc;
}, {} as Record<SpecialistKey, number>);
