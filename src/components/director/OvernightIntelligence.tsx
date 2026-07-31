import { useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight, Minus, Sunrise, Lightbulb, ListOrdered,
  CheckCircle2, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/* ---------------- What changed since yesterday ---------------- */

type Dir = 'up' | 'down' | 'flat';

interface Change {
  group: 'Performance' | 'Confidence' | 'Health' | 'Allocation' | 'Risk' | 'Warnings';
  label: string;
  from: string;
  to: string;
  dir: Dir;
  good: boolean;
  note: string;
}

const CHANGES: Change[] = [
  { group: 'Performance', label: 'Simulated net PnL (rolling 30d)', from: '$4,046', to: '$4,178', dir: 'up', good: true, note: 'Trend Rider added $118 of the $132 daily gain during the bull leg.' },
  { group: 'Performance', label: 'Profit factor', from: '1.74', to: '1.77', dir: 'up', good: true, note: 'Two winning sessions with no offsetting stop clusters.' },
  { group: 'Confidence', label: 'Portfolio confidence', from: '74%', to: '78%', dir: 'up', good: true, note: 'Driven by four consecutive days of positive expectancy and stable drawdown.' },
  { group: 'Health', label: 'Composite health score', from: '86', to: '88', dir: 'up', good: true, note: 'Risk balance improved as correlation between MS v2 and VCB eased.' },
  { group: 'Health', label: 'Capital efficiency', from: '0.71', to: '0.73', dir: 'up', good: true, note: 'Still below the 0.75 target — remains on watch.' },
  { group: 'Allocation', label: 'Trend Rider weight (drift)', from: '39%', to: '40%', dir: 'up', good: false, note: 'Passive drift from performance, not a rebalance. No execution occurred.' },
  { group: 'Allocation', label: 'Mean Reversion weight (drift)', from: '16%', to: '15%', dir: 'down', good: false, note: 'Sideways probability fell in the current regime read.' },
  { group: 'Risk', label: 'Max simulated drawdown', from: '2.9%', to: '2.8%', dir: 'down', good: true, note: 'Comfortably inside the 3.0% guardrail.' },
  { group: 'Risk', label: 'Bull-trend concentration', from: '41%', to: '42%', dir: 'up', good: false, note: 'Nineteenth consecutive day above the 35% tolerance band.' },
  { group: 'Warnings', label: 'New warning', from: '—', to: 'Bull concentration persistence', dir: 'up', good: false, note: 'Raised after concentration held above 35% for 18+ days.' },
  { group: 'Warnings', label: 'Resolved warning', from: 'MS v2 PF drift', to: 'Cleared', dir: 'down', good: true, note: 'Momentum Scalper v2 profit factor recovered from 1.52 to 1.61.' },
];

function DirIcon({ dir, good }: { dir: Dir; good: boolean }) {
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  return <Icon className={cn('h-4 w-4', good ? 'text-trading-profit' : 'text-trading-loss')} />;
}

function WhatChanged() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sunrise className="h-4 w-4 text-trading-gold" /> What Changed Since Yesterday
        </CardTitle>
        <CardDescription className="text-xs">
          Automated overnight diff of the simulated book. Only material movements are shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {CHANGES.map((c, i) => (
          <div
            key={c.label}
            className="animate-fade-in rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:border-trading-gold/40"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <DirIcon dir={c.dir} good={c.good} />
                <div>
                  <p className="text-xs font-medium">{c.label}</p>
                  <p className="text-[10px] text-muted-foreground">{c.note}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs tabular-nums">
                <span className="text-muted-foreground">{c.from}</span>
                <span className="text-muted-foreground">→</span>
                <span className={cn('font-bold', c.good ? 'text-trading-profit' : 'text-trading-loss')}>{c.to}</span>
                <Badge variant="outline" className="text-[9px]">{c.group}</Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- Top five insights ---------------- */

const INSIGHTS = [
  {
    title: 'Trend Rider v1 generated 41% of total portfolio PnL',
    importance: 'Critical',
    evidence: '$4,820 standalone 90-day PnL at 100% notional; 40% sleeve contributes ~41% of book expectancy and 34% of move capture.',
    confidence: 91,
  },
  {
    title: 'Momentum Scalper v2 reduced portfolio drawdown by 0.3%',
    importance: 'High',
    evidence: 'Activation gate keeps MS v2 flat 42% of sessions, removing the -$1,052 chop bleed that defined v1. Book DD 3.1% → 2.8%.',
    confidence: 84,
  },
  {
    title: 'Low Volatility coverage remains underserved',
    importance: 'High',
    evidence: 'LVC v2 is approved (PF 1.74, capture 64%) but held at 0% weight. Low-Vol exposure in the recommended book sits at 9%.',
    confidence: 79,
  },
  {
    title: 'Architecture remains Mature across all five layers',
    importance: 'Medium',
    evidence: 'Portfolio Architecture Review composite 89; redundancy 78; no single points of failure in High or Low volatility.',
    confidence: 88,
  },
  {
    title: 'Portfolio confidence increased 4% week-over-week',
    importance: 'Medium',
    evidence: 'Confidence 74% → 78% on four consecutive positive-expectancy sessions with drawdown inside the 3.0% guardrail.',
    confidence: 76,
  },
];

function Insights() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-trading-gold" /> Top Five Executive Insights
        </CardTitle>
        <CardDescription className="text-xs">Generated from the current simulated book and prior research runs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {INSIGHTS.map((ins, i) => (
          <div
            key={ins.title}
            className="animate-fade-in rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:border-trading-gold/40 hover:bg-card/70"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-trading-gold/15 text-xs font-bold text-trading-gold">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{ins.title}</p>
                  <Badge variant="outline" className={cn(
                    'text-[9px]',
                    ins.importance === 'Critical' && 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss',
                    ins.importance === 'High' && 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
                    ins.importance === 'Medium' && 'border-primary/40 bg-primary/10 text-primary',
                  )}>{ins.importance}</Badge>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{ins.evidence}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={ins.confidence} className="h-1.5 flex-1" />
                  <span className="text-[10px] tabular-nums text-muted-foreground">Confidence {ins.confidence}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- AI priority list ---------------- */

const PRIORITIES = [
  {
    title: 'Reduce Bull Concentration',
    impact: 'High', confidence: 84,
    why: 'Bull-trend exposure is 42% of the book, above the 35% governance tolerance, and is the single blocking gate on the promotion ladder.',
    expected: 'Rebalancing ~7 points from TR into LVC/MR would lift diversification ~9 points and unlock the concentration gate.',
    evidence: 'Allocation Production Path — 6/9 gates passing; concentration is the sole structural failure. Risk Radar concentration axis reads High.',
  },
  {
    title: 'Continue Champion Trial',
    impact: 'Medium', confidence: 92,
    why: 'Confidence Weighted Allocation leads Dynamic Allocation v1 by 5.8% PnL, but only 31 of 50 required trades are complete.',
    expected: 'Completing days 24-60 produces a statistically usable promotion decision instead of an early, noisy one.',
    evidence: 'Champion Forward Trial — challenger wins 6/8 head-to-head metrics; lead stability score 82/100.',
  },
  {
    title: 'Monitor Capital Efficiency',
    impact: 'Medium', confidence: 77,
    why: 'Capital efficiency sits at 0.73 against a 0.75 target — the only Champion Health metric still in Warning.',
    expected: 'Efficiency recovery would clear the last health warning and raise composite health toward 91.',
    evidence: 'Observation Center — all champion metrics Healthy except efficiency. Idle-capital drag traced to gated MS v2 sessions.',
  },
  {
    title: 'Prepare Low Vol Activation',
    impact: 'Low', confidence: 73,
    why: 'LVC v2 is approved and staged at 0% weight; the roster carries no active Low-Volatility earner if ATR% compresses.',
    expected: 'A pre-agreed 10-15% LVC sleeve would close the 41% Low-Vol coverage gap without disturbing current earners.',
    evidence: 'Low-Vol Coiler v2 — capture 64%, PF 1.74, DD 2.1%. Discovery Lab v2 flagged Low Vol as the largest coverage gap.',
  },
];

function Priorities() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListOrdered className="h-4 w-4 text-trading-gold" /> AI Priority List
        </CardTitle>
        <CardDescription className="text-xs">Ranked opportunities. Advisory only — nothing here is executed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {PRIORITIES.map((p, i) => {
          const isOpen = open === i;
          return (
            <div key={p.title} className="overflow-hidden rounded-xl border border-border/50 bg-card/50">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-card/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">{i + 1}</div>
                  <p className="text-sm font-semibold">{p.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    'text-[9px]',
                    p.impact === 'High' && 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss',
                    p.impact === 'Medium' && 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
                    p.impact === 'Low' && 'border-primary/40 bg-primary/10 text-primary',
                  )}>Impact {p.impact}</Badge>
                  <span className="hidden text-[10px] tabular-nums text-muted-foreground sm:inline">{p.confidence}%</span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-300', isOpen && 'rotate-180')} />
                </div>
              </button>
              {isOpen && (
                <div className="animate-fade-in space-y-2 border-t border-border/50 bg-background/40 p-4 text-[11px] leading-relaxed">
                  <p><span className="font-semibold text-trading-gold">Why it matters — </span>{p.why}</p>
                  <p><span className="font-semibold text-trading-gold">Expected impact — </span>{p.expected}</p>
                  <p><span className="font-semibold text-trading-gold">Supporting evidence — </span>{p.evidence}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Progress value={p.confidence} className="h-1.5 flex-1" />
                    <span className="text-[10px] tabular-nums text-muted-foreground">Confidence {p.confidence}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function OvernightIntelligence() {
  return (
    <div className="space-y-6">
      <WhatChanged />
      <div className="grid gap-6 lg:grid-cols-2">
        <Insights />
        <Priorities />
      </div>
    </div>
  );
}

export { WhatChanged, Insights, Priorities };
