import { useMemo, useState } from 'react';
import { FlaskConical, Lock, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  SPECIALISTS, SpecialistKey, computeForecast, confidenceOf, fmtUsd, Forecast,
} from '@/lib/directorModel';
import { cn } from '@/lib/utils';

interface Scenario {
  id: string;
  name: string;
  description: string;
  /** per-specialist performance multiplier under the scenario */
  perf: Record<SpecialistKey, number>;
  /** recommended sleeve weights the Director would model under the scenario */
  weights: Record<SpecialistKey, number>;
  /** scenario-level stress applied to portfolio drawdown */
  ddStress: number;
  /** capture penalty / bonus in percentage points */
  captureShift: number;
  narrative: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'bull', name: 'Bull Market',
    description: 'Sustained higher highs, expanding participation, trend persistence above HTF averages.',
    perf: { tr: 1.28, ms: 1.10, vcb: 1.04, mr: 0.72, lvc: 0.80 },
    weights: { tr: 52, ms: 22, vcb: 16, mr: 10, lvc: 0 },
    ddStress: 0.94, captureShift: 4,
    narrative: 'Trend Rider takes the dominant sleeve; Mean Reversion is reduced to coverage insurance because range logic bleeds in persistent trend.',
  },
  {
    id: 'bear', name: 'Bear Market',
    description: 'Persistent downtrend, lower highs, elevated downside follow-through.',
    perf: { tr: 1.12, ms: 1.04, vcb: 1.00, mr: 0.78, lvc: 0.86 },
    weights: { tr: 44, ms: 24, vcb: 20, mr: 12, lvc: 0 },
    ddStress: 1.12, captureShift: 1,
    narrative: 'Short-capable Trend Rider still leads, but drawdown stress is raised: bear tape produces sharper counter-trend snaps against directional sleeves.',
  },
  {
    id: 'sideways', name: 'Sideways Market',
    description: 'Range-bound rotation, no HTF direction, repeated false breakouts.',
    perf: { tr: 0.64, ms: 0.72, vcb: 0.88, mr: 1.34, lvc: 1.18 },
    weights: { tr: 16, ms: 8, vcb: 18, mr: 40, lvc: 18 },
    ddStress: 0.88, captureShift: -8,
    narrative: 'Mean Reversion becomes the primary return driver. Directional sleeves are cut hard — chop is where Trend Rider historically clusters drawdown.',
  },
  {
    id: 'highvol', name: 'High Volatility',
    description: 'ATR expansion, wide ranges, fast directional impulses.',
    perf: { tr: 1.06, ms: 1.32, vcb: 1.26, mr: 0.70, lvc: 0.52 },
    weights: { tr: 30, ms: 34, vcb: 28, mr: 8, lvc: 0 },
    ddStress: 1.18, captureShift: 6,
    narrative: 'Momentum Scalper and VCB dominate, but their 58% behavioural overlap raises correlated drawdown — the Director caps the combined sleeve at 62%.',
  },
  {
    id: 'lowvol', name: 'Low Volatility',
    description: 'Compression, ATR% below 0.35, narrow ranges and coiling structure.',
    perf: { tr: 0.74, ms: 0.48, vcb: 1.02, mr: 1.16, lvc: 1.42 },
    weights: { tr: 14, ms: 0, vcb: 20, mr: 26, lvc: 40 },
    ddStress: 0.76, captureShift: -6,
    narrative: 'Low-Vol Coiler v2 activates and takes the largest sleeve. Momentum Scalper is gated fully off by its own activation rules.',
  },
  {
    id: 'btc-crash', name: 'Bitcoin Crash',
    description: 'Sudden 20%+ BTC drawdown with correlated altcoin liquidation.',
    perf: { tr: 0.82, ms: 1.14, vcb: 0.94, mr: 0.44, lvc: 0.36 },
    weights: { tr: 26, ms: 24, vcb: 22, mr: 6, lvc: 0 },
    ddStress: 1.62, captureShift: -4,
    narrative: 'Cross-asset correlation converges towards 1. Every sleeve is de-risked and the residual book is held mainly for downside capture, not for return.',
  },
  {
    id: 'btc-rally', name: 'Bitcoin Rally',
    description: 'Vertical BTC expansion pulling the full basket higher.',
    perf: { tr: 1.34, ms: 1.22, vcb: 1.16, mr: 0.58, lvc: 0.62 },
    weights: { tr: 48, ms: 26, vcb: 20, mr: 6, lvc: 0 },
    ddStress: 1.06, captureShift: 7,
    narrative: 'Directional and breakout sleeves are maximised. Mean Reversion is held at a floor only to preserve regime coverage if the rally stalls into range.',
  },
  {
    id: 'vol-spike', name: 'Volatility Spike',
    description: 'Abrupt ATR expansion from a compressed base — the classic VCB trigger.',
    perf: { tr: 0.92, ms: 1.28, vcb: 1.44, mr: 0.66, lvc: 0.70 },
    weights: { tr: 22, ms: 30, vcb: 34, mr: 8, lvc: 6 },
    ddStress: 1.34, captureShift: 5,
    narrative: 'VCB v1 is the designed beneficiary — lowest entry delay (1 candle) at the compression-to-expansion boundary makes it the scenario leader.',
  },
  {
    id: 'trend-failure', name: 'Trend Failure',
    description: 'Established trend breaks down into whipsaw; repeated crossover traps.',
    perf: { tr: 0.52, ms: 0.78, vcb: 0.86, mr: 1.22, lvc: 1.06 },
    weights: { tr: 12, ms: 12, vcb: 22, mr: 34, lvc: 20 },
    ddStress: 1.28, captureShift: -10,
    narrative: 'The scenario the Trend Rider sleeve is structurally exposed to. Capital rotates to reversion and transition specialists until trend quality recovers.',
  },
  {
    id: 'specialist-failure', name: 'Specialist Failure',
    description: 'Top specialist degrades — Trend Rider PF falls below 1.20 for 14 sessions.',
    perf: { tr: 0.34, ms: 1.02, vcb: 1.04, mr: 1.00, lvc: 0.98 },
    weights: { tr: 8, ms: 30, vcb: 28, mr: 20, lvc: 14 },
    ddStress: 1.14, captureShift: -7,
    narrative: 'Redundancy test. The roster absorbs the loss of its Gold Belt holder because no regime depends on a single specialist — the architecture SPOF check holds.',
  },
  {
    id: 'liquidity-shock', name: 'Liquidity Shock',
    description: 'Order-book thinning, spread widening, slippage and fee drag multiply.',
    perf: { tr: 0.78, ms: 0.58, vcb: 0.74, mr: 0.66, lvc: 0.84 },
    weights: { tr: 30, ms: 10, vcb: 20, mr: 18, lvc: 12 },
    ddStress: 1.44, captureShift: -12,
    narrative: 'High-frequency sleeves are penalised hardest — Momentum Scalper carries the most turnover and therefore the most slippage exposure.',
  },
];

interface ScenarioForecast extends Forecast {
  confidence: number;
  confidenceLabel: string;
}

function scenarioForecast(sc: Scenario | null, weights: Record<SpecialistKey, number>, refPnl?: number): ScenarioForecast {
  const base = computeForecast(weights);
  if (!sc) {
    const c = confidenceOf(base);
    return { ...base, confidence: c.score, confidenceLabel: c.label };
  }
  const total = SPECIALISTS.reduce((s, sp) => s + weights[sp.key], 0) || 1;
  const wf = (k: SpecialistKey) => weights[k] / total;
  const perfMult = SPECIALISTS.reduce((s, sp) => s + wf(sp.key) * sc.perf[sp.key], 0);

  const adjusted: Forecast = {
    ...base,
    // blended against the current book so a scenario cannot look richer purely from sleeve mix
    pnl: (refPnl === undefined ? base.pnl : (base.pnl + refPnl) / 2) * perfMult,
    pf: Math.max(0.4, 1 + (base.pf - 1) * perfMult),
    dd: base.dd * sc.ddStress,
    wr: Math.max(30, Math.min(78, base.wr * (0.82 + perfMult * 0.18))),
    capture: Math.max(20, Math.min(95, base.capture + sc.captureShift)),
    sharpe: base.sharpe * perfMult * (1 / sc.ddStress),
  };
  adjusted.riskBalance = Math.round(Math.max(0, Math.min(100,
    100 - (adjusted.dd / 5) * 40 - adjusted.correlation * 45 + (adjusted.diversification / 100) * 22)));
  adjusted.health = Math.max(0, Math.min(100, Math.round(
    adjusted.coverage * 0.2 + adjusted.diversification * 0.2 + (1 - adjusted.correlation) * 100 * 0.15 +
    adjusted.efficiency * 100 * 0.15 + adjusted.riskBalance * 0.2 + 89 * 0.1) + 14));
  const c = confidenceOf(adjusted);
  return { ...adjusted, confidence: c.score, confidenceLabel: c.label };
}

function Delta({ value, suffix = '', invert = false, decimals = 2 }: { value: number; suffix?: string; invert?: boolean; decimals?: number }) {
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 0.005;
  const Icon = flat ? Minus : good ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums text-xs font-semibold',
      flat ? 'text-muted-foreground' : good ? 'text-trading-profit' : 'text-trading-loss')}>
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : ''}{value.toFixed(decimals)}{suffix}
    </span>
  );
}

export default function ScenarioSimulator({ currentWeights }: { currentWeights: Record<SpecialistKey, number> }) {
  const [active, setActive] = useState<string | null>(null);
  const scenario = SCENARIOS.find((s) => s.id === active) ?? null;

  const current = useMemo(() => scenarioForecast(null, currentWeights), [currentWeights]);
  const simulated = useMemo(
    () => scenarioForecast(scenario, scenario ? scenario.weights : currentWeights, current.pnl),
    [scenario, currentWeights, current.pnl],
  );

  const rows = [
    { label: 'Expected Net PnL (90d)', a: current.pnl, b: simulated.pnl, fmt: fmtUsd, d: 0, suffix: '' },
    { label: 'Profit Factor', a: current.pf, b: simulated.pf, fmt: (n: number) => n.toFixed(2), d: 2, suffix: '' },
    { label: 'Max Drawdown', a: current.dd, b: simulated.dd, fmt: (n: number) => `${n.toFixed(1)}%`, d: 1, suffix: '%', invert: true },
    { label: 'Win Rate', a: current.wr, b: simulated.wr, fmt: (n: number) => `${n.toFixed(1)}%`, d: 1, suffix: '%' },
    { label: 'Move Capture', a: current.capture, b: simulated.capture, fmt: (n: number) => `${n.toFixed(0)}%`, d: 0, suffix: '%' },
    { label: 'Portfolio Health', a: current.health, b: simulated.health, fmt: (n: number) => `${n.toFixed(0)}/100`, d: 0, suffix: '' },
    { label: 'Diversification', a: current.diversification, b: simulated.diversification, fmt: (n: number) => n.toFixed(0), d: 0, suffix: '' },
    { label: 'Confidence', a: current.confidence, b: simulated.confidence, fmt: (n: number) => `${n.toFixed(0)}/100`, d: 0, suffix: '' },
    { label: 'Sharpe-like Score', a: current.sharpe, b: simulated.sharpe, fmt: (n: number) => n.toFixed(2), d: 2, suffix: '' },
  ];

  return (
    <Card className="animate-fade-in border-trading-gold/25">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-trading-gold" /> Scenario Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Stress the recommended book against eleven market events. Recalculates instantly — never changes production.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> OBSERVATION ONLY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={active === s.id ? 'default' : 'outline'}
              className={cn('h-7 text-[11px]', active === s.id && 'bg-trading-gold text-background hover:bg-trading-gold/90')}
              onClick={() => setActive(active === s.id ? null : s.id)}
            >
              {s.name}
            </Button>
          ))}
        </div>

        {!scenario && (
          <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
            Select a scenario to simulate. The comparison below will show the current recommended book against the
            Director's modelled response to that event.
          </div>
        )}

        {scenario && (
          <>
            <div className="rounded-xl border border-trading-gold/25 bg-background/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Scenario</p>
              <p className="mt-0.5 text-lg font-bold text-trading-gold">{scenario.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{scenario.description}</p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/80">{scenario.narrative}</p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recommended Allocation Under Scenario
              </p>
              <div className="space-y-2">
                {SPECIALISTS.map((sp) => {
                  const cur = currentWeights[sp.key];
                  const next = scenario.weights[sp.key];
                  const diff = next - cur;
                  return (
                    <div key={sp.key} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-xs">{sp.name}</span>
                      <div className="flex-1">
                        <Progress value={next} className="h-2" />
                      </div>
                      <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {cur}% <ArrowRight className="inline h-3 w-3" /> <b className="text-foreground">{next}%</b>
                      </span>
                      <span className={cn('w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums',
                        diff === 0 ? 'text-muted-foreground' : diff > 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                        {diff > 0 ? '+' : ''}{diff}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[560px] text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Metric</th>
                    <th className="p-2 text-right">Current Portfolio</th>
                    <th className="p-2 text-right">Scenario Portfolio</th>
                    <th className="p-2 text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} className="border-t border-border/40">
                      <td className="p-2">{r.label}</td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">{r.fmt(r.a)}</td>
                      <td className="p-2 text-right font-semibold tabular-nums">{r.fmt(r.b)}</td>
                      <td className="p-2 text-right">
                        <Delta value={r.b - r.a} suffix={r.suffix} decimals={r.d} invert={r.invert} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Simulation only. Scenario allocations are modelled research output — they are not applied to any live or paper book,
              and no governance stage is advanced by running a scenario.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
