import { useMemo, useState } from 'react';
import { GitBranch, ArrowRight, Lock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PortfolioVersion {
  version: string;
  date: string;
  title: string;
  changed: string;
  why: string;
  trigger: string;
  triggerPath: string;
  pnl: number;
  pf: number;
  dd: number;
  capture: number;
  health: number;
}

export const VERSIONS: PortfolioVersion[] = [
  {
    version: 'v0.1', date: '02 Mar 2026', title: 'Single-Router Book',
    changed: 'Portfolio consisted of Router v2 alone with static 70/30 allocation between SMA and mean-reversion logic.',
    why: 'Baseline configuration carried forward from the original research programme — no specialist layer existed yet.',
    trigger: 'Baseline Validation', triggerPath: '/baseline-validation',
    pnl: 2680, pf: 1.48, dd: 4.6, capture: 54, health: 61,
  },
  {
    version: 'v0.2', date: '19 Mar 2026', title: 'Router v2.1 Fork',
    changed: 'Forked Router v2 and reduced entry move thresholds by 10% (Long 0.45%, Short 0.54%, XRP 1.08%).',
    why: 'The Trade Frequency Opportunity Audit found 126 profitable sub-threshold moves being skipped; the −10% band was the only reduction that raised PnL without dropping PF below 1.5.',
    trigger: 'Trade Frequency Audit', triggerPath: '/trade-frequency',
    pnl: 2812, pf: 1.52, dd: 4.3, capture: 58, health: 66,
  },
  {
    version: 'v0.3', date: '07 Apr 2026', title: 'First Specialist Added',
    changed: 'Introduced Momentum Scalper v2 alongside Router v2.1 as a regime-gated satellite sleeve.',
    why: 'Momentum Scalper v1\'s Robustness Audit showed a genuine but regime-dependent edge; gating it to High-Vol / Bull / ATR expansion lifted 90-day PF from 1.21 to 1.56.',
    trigger: 'Momentum Scalper v2 Activation Audit', triggerPath: '/momentum-scalper-v2',
    pnl: 3340, pf: 1.61, dd: 3.9, capture: 62, health: 72,
  },
  {
    version: 'v0.4', date: '28 Apr 2026', title: 'Compression Specialist',
    changed: 'Added VCB v1 to cover the compression-to-expansion boundary and reduced Router weighting accordingly.',
    why: 'VCB v1 was the only candidate profitable in all five regimes with the lowest entry delay (1 candle) and fewest missed moves (12) in the peer capture audit.',
    trigger: 'VCB v1 Validation Suite', triggerPath: '/vcb-v1',
    pnl: 3980, pf: 1.68, dd: 3.7, capture: 65, health: 78,
  },
  {
    version: 'v1.0', date: '15 May 2026', title: 'Dynamic Allocation Portfolio',
    changed: 'Replaced the router-centric book entirely with four cooperating specialists under Dynamic Allocation.',
    why: 'Specialist Allocation Lab v1 showed Dynamic Allocation beating Router v2 by 39% net PnL at 2.03 PF with drawdown held under the 3% ceiling.',
    trigger: 'Specialist Allocation Lab v1', triggerPath: '/allocation-lab',
    pnl: 5142, pf: 2.03, dd: 2.8, capture: 68, health: 84,
  },
  {
    version: 'v1.1', date: '04 Jun 2026', title: 'Confidence-Weighted Allocation',
    changed: 'Allocation logic upgraded from regime-dynamic to confidence-weighted (regime confidence × specialist strength score).',
    why: 'Allocation Lab v2 showed Confidence Weighted clearing all four champion gates versus Dynamic v1, delivering $5,410 PnL at 2.11 PF.',
    trigger: 'Specialist Allocation Lab v2', triggerPath: '/allocation-lab-v2',
    pnl: 5410, pf: 2.11, dd: 2.6, capture: 71, health: 88,
  },
  {
    version: 'v1.2', date: '26 Jun 2026', title: 'Fifth Specialist — Low-Vol Coverage',
    changed: 'Added Low-Vol Coiler v2 to the roster as a staged (0%) sleeve with an ATR% < 0.35 activation trigger.',
    why: 'Discovery Lab v2 identified Low Volatility as the last structural coverage gap at 41%; LVC v2 lifted aggregate capture 60% → 64% at PF 1.74.',
    trigger: 'Low-Vol Coiler v2', triggerPath: '/low-vol-coiler-v2',
    pnl: 5486, pf: 2.09, dd: 2.5, capture: 73, health: 91,
  },
  {
    version: 'v1.3', date: '21 Jul 2026', title: 'Roster Complete — Observation Book',
    changed: 'Roster frozen at five specialists; architecture reviewed end-to-end and the book placed under forward observation.',
    why: 'The Specialist Approval Board rated the roster complete (readiness 94) and the Architecture Review returned Mature (composite 89) with no single points of failure.',
    trigger: 'Portfolio Architecture Review', triggerPath: '/portfolio-architecture-review',
    pnl: 5542, pf: 2.12, dd: 2.4, capture: 74, health: 93,
  },
];

const fmtUsd = (n: number) => `$${Math.round(n).toLocaleString()}`;

function DiffCell({ a, b, decimals = 2, suffix = '', invert = false }: { a: number; b: number; decimals?: number; suffix?: string; invert?: boolean }) {
  const d = b - a;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={cn('tabular-nums text-xs font-semibold',
      Math.abs(d) < 0.005 ? 'text-muted-foreground' : good ? 'text-trading-profit' : 'text-trading-loss')}>
      {d > 0 ? '+' : ''}{d.toFixed(decimals)}{suffix}
    </span>
  );
}

export default function PortfolioEvolution() {
  const [left, setLeft] = useState(VERSIONS[0].version);
  const [right, setRight] = useState(VERSIONS[VERSIONS.length - 1].version);

  const a = useMemo(() => VERSIONS.find((v) => v.version === left)!, [left]);
  const b = useMemo(() => VERSIONS.find((v) => v.version === right)!, [right]);

  return (
    <Card className="animate-fade-in border-trading-gold/25">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4 text-trading-gold" /> Portfolio Evolution
            </CardTitle>
            <CardDescription className="text-xs">
              Full version history of the book — what changed, why it changed, and the research that triggered it.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> RESEARCH RECORD
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Timeline */}
        <div className="relative space-y-3 pl-6">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
          {VERSIONS.map((v, i) => {
            const prev = VERSIONS[i - 1];
            return (
              <div key={v.version} className="relative">
                <span className={cn('absolute -left-[22px] top-2 h-3 w-3 rounded-full ring-4 ring-background',
                  i === VERSIONS.length - 1 ? 'bg-trading-gold' : 'bg-primary')} />
                <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn('text-[10px]', i === VERSIONS.length - 1
                      ? 'bg-trading-gold/15 text-trading-gold hover:bg-trading-gold/20'
                      : 'bg-primary/10 text-primary hover:bg-primary/15')}>{v.version}</Badge>
                    <span className="text-sm font-semibold">{v.title}</span>
                    <span className="text-[11px] text-muted-foreground">{v.date}</span>
                    {i === VERSIONS.length - 1 && (
                      <Badge variant="outline" className="text-[10px]">Current</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/85">
                    <span className="text-muted-foreground">What changed — </span>{v.changed}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                    <span className="text-muted-foreground">Why — </span>{v.why}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <a href={v.triggerPath}
                      className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10">
                      <FileText className="h-3 w-3" /> {v.trigger}
                    </a>
                    <span className="text-[10px] text-muted-foreground">
                      PnL {fmtUsd(v.pnl)} · PF {v.pf.toFixed(2)} · DD {v.dd.toFixed(1)}% · Capture {v.capture}% · Health {v.health}
                    </span>
                    {prev && (
                      <span className="text-[10px] text-trading-profit">
                        Improvement: {(((v.pnl - prev.pnl) / prev.pnl) * 100).toFixed(1)}% PnL,
                        {' '}{(v.pf - prev.pf >= 0 ? '+' : '')}{(v.pf - prev.pf).toFixed(2)} PF,
                        {' '}{(v.dd - prev.dd).toFixed(1)}% DD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Version comparison */}
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compare any two versions
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Select value={left} onValueChange={setLeft}>
              <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERSIONS.map((v) => (
                  <SelectItem key={v.version} value={v.version} className="text-xs">{v.version} — {v.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Select value={right} onValueChange={setRight}>
              <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERSIONS.map((v) => (
                  <SelectItem key={v.version} value={v.version} className="text-xs">{v.version} — {v.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[520px] text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Metric</th>
                  <th className="p-2 text-right">{a.version}</th>
                  <th className="p-2 text-right">{b.version}</th>
                  <th className="p-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/40">
                  <td className="p-2">Net PnL (90d)</td>
                  <td className="p-2 text-right tabular-nums">{fmtUsd(a.pnl)}</td>
                  <td className="p-2 text-right tabular-nums">{fmtUsd(b.pnl)}</td>
                  <td className="p-2 text-right"><DiffCell a={a.pnl} b={b.pnl} decimals={0} /></td>
                </tr>
                <tr className="border-t border-border/40">
                  <td className="p-2">Profit Factor</td>
                  <td className="p-2 text-right tabular-nums">{a.pf.toFixed(2)}</td>
                  <td className="p-2 text-right tabular-nums">{b.pf.toFixed(2)}</td>
                  <td className="p-2 text-right"><DiffCell a={a.pf} b={b.pf} /></td>
                </tr>
                <tr className="border-t border-border/40">
                  <td className="p-2">Max Drawdown</td>
                  <td className="p-2 text-right tabular-nums">{a.dd.toFixed(1)}%</td>
                  <td className="p-2 text-right tabular-nums">{b.dd.toFixed(1)}%</td>
                  <td className="p-2 text-right"><DiffCell a={a.dd} b={b.dd} decimals={1} suffix="%" invert /></td>
                </tr>
                <tr className="border-t border-border/40">
                  <td className="p-2">Move Capture</td>
                  <td className="p-2 text-right tabular-nums">{a.capture}%</td>
                  <td className="p-2 text-right tabular-nums">{b.capture}%</td>
                  <td className="p-2 text-right"><DiffCell a={a.capture} b={b.capture} decimals={0} suffix="%" /></td>
                </tr>
                <tr className="border-t border-border/40">
                  <td className="p-2">Portfolio Health</td>
                  <td className="p-2 text-right tabular-nums">{a.health}/100</td>
                  <td className="p-2 text-right tabular-nums">{b.health}/100</td>
                  <td className="p-2 text-right"><DiffCell a={a.health} b={b.health} decimals={0} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Version history is a research record. Selecting versions here compares simulated results only — it does not roll the portfolio back or forward.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
