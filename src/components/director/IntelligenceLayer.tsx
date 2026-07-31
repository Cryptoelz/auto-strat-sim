import { Link } from 'react-router-dom';
import {
  History, Rss, BrainCircuit, Award, ExternalLink, CheckCircle2, Crown,
  Shield, Layers, Flag, TrendingUp, Radio,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/* ---------------- Executive timeline ---------------- */

const TIMELINE = [
  { date: '28 Jul 2026', title: 'Portfolio Health Improved', icon: TrendingUp, importance: 'Medium',
    summary: 'Composite health rose 86 → 88 as MS v2 / VCB correlation eased and drawdown fell to 2.8%.', href: '/observation-center', link: 'Observation Center' },
  { date: '24 Jul 2026', title: 'Coverage Gap Closed', icon: Layers, importance: 'High',
    summary: 'Low-Vol Coiler v2 approved at 64% capture, closing the 41% Low-Volatility coverage gap found by Discovery Lab v2.', href: '/low-vol-coiler-v2', link: 'Low-Vol Coiler v2' },
  { date: '21 Jul 2026', title: 'Architecture Mature', icon: Shield, importance: 'Critical',
    summary: 'Portfolio Architecture Review scored composite 89 — layers 1, 4 and 5 Mature; 2 and 3 Ready. No single points of failure.', href: '/portfolio-architecture-review', link: 'Architecture Review' },
  { date: '18 Jul 2026', title: 'Specialist Roster Complete', icon: Award, importance: 'High',
    summary: 'Specialist Approval Board certified all five specialists with 89% average regime coverage and readiness score 94.', href: '/specialist-approval-board', link: 'Approval Board' },
  { date: '12 Jul 2026', title: 'Forward Trial Started', icon: Flag, importance: 'High',
    summary: 'Champion Forward Trial opened — Confidence Weighted Allocation vs Dynamic Allocation v1, minimum 60 days / 50 trades.', href: '/champion-trial', link: 'Champion Trial' },
  { date: '09 Jul 2026', title: 'Promotion Gate Passed', icon: CheckCircle2, importance: 'Medium',
    summary: 'Stage 2 gate cleared on the Allocation Production Path — 6 of 9 governance gates now passing.', href: '/allocation-production-path', link: 'Production Path' },
  { date: '02 Jul 2026', title: 'Champion Changed', icon: Crown, importance: 'Critical',
    summary: 'Confidence Weighted Allocation took research champion status from Dynamic Allocation v1 after clearing all four Lab v2 gates.', href: '/allocation-lab-v2', link: 'Allocation Lab v2' },
];

function Timeline() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-trading-gold" /> Executive Timeline
        </CardTitle>
        <CardDescription className="text-xs">Major research milestones, newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 pl-6">
          <div className="absolute left-[9px] top-1 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-trading-gold/60 via-primary/30 to-transparent" />
          {TIMELINE.map((e, i) => (
            <div key={e.title} className="animate-fade-in relative" style={{ animationDelay: `${i * 45}ms` }}>
              <span className="absolute -left-6 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-trading-gold/50 bg-background">
                <e.icon className="h-2.5 w-2.5 text-trading-gold" />
              </span>
              <div className="rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:border-trading-gold/40">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold">{e.title}</p>
                  <Badge variant="outline" className={cn(
                    'text-[9px]',
                    e.importance === 'Critical' && 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss',
                    e.importance === 'High' && 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
                    e.importance === 'Medium' && 'border-primary/40 bg-primary/10 text-primary',
                  )}>{e.importance}</Badge>
                  <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">{e.date}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{e.summary}</p>
                <Link to={e.href} className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                  {e.link} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Intelligence feed ---------------- */

const FEED = [
  { t: '08:05', s: 'Forward Trial day 24 of 60 — 31 of 50 minimum trades recorded.', tone: 'info' },
  { t: '07:52', s: 'Portfolio confidence increased 74% → 78%.', tone: 'good' },
  { t: '07:40', s: 'Champion defended leadership for a 6th consecutive session.', tone: 'good' },
  { t: '07:18', s: 'No new guardrail breaches. Drawdown 2.8% against a 3.0% ceiling.', tone: 'good' },
  { t: '06:55', s: 'Bull-trend concentration ticked 41% → 42% — 19th day above tolerance.', tone: 'warn' },
  { t: '06:30', s: 'Architecture Health unchanged at Mature (composite 89).', tone: 'info' },
  { t: 'Yest.', s: 'Momentum Scalper v2 profit-factor warning resolved (1.52 → 1.61).', tone: 'good' },
  { t: 'Yest.', s: 'Capital efficiency improved 0.71 → 0.73; remains below the 0.75 target.', tone: 'warn' },
  { t: '2d', s: 'Specialist Approval Board completed — roster certified at readiness 94.', tone: 'info' },
  { t: '3d', s: 'Low-Vol Coiler v2 staged for activation; weight held at 0%.', tone: 'info' },
  { t: '4d', s: 'Scenario Simulator stress pass completed — no simulated guardrail failure.', tone: 'info' },
  { t: '5d', s: 'Research Dependency Map published — all five specialists traceable to source runs.', tone: 'info' },
];

function Feed() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rss className="h-4 w-4 text-trading-gold" /> Intelligence Feed
          <span className="ml-1 flex items-center gap-1 text-[10px] font-normal text-trading-profit">
            <Radio className="h-3 w-3 animate-pulse" /> live observation
          </span>
        </CardTitle>
        <CardDescription className="text-xs">Newest updates first.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {FEED.map((f, i) => (
            <div
              key={`${f.t}-${i}`}
              className="animate-fade-in flex items-start gap-3 rounded-lg border border-border/40 bg-card/40 p-2.5 transition-colors hover:border-trading-gold/40"
              style={{ animationDelay: `${i * 25}ms` }}
            >
              <span className={cn(
                'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                f.tone === 'good' && 'bg-trading-profit',
                f.tone === 'warn' && 'bg-trading-warning',
                f.tone === 'info' && 'bg-primary',
              )} />
              <p className="flex-1 text-[11px] leading-relaxed">{f.s}</p>
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{f.t}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- AI memory ---------------- */

const MEMORY = [
  { age: '18 days', s: 'Bull concentration has remained above 35% for 18 consecutive days.', tone: 'warn' },
  { age: '47 days', s: 'Trend Rider v1 remains the strongest single performer and Gold Belt holder (Elo 1742).', tone: 'good' },
  { age: '5 weeks', s: 'Capital efficiency has improved every week since Portfolio Version 5.', tone: 'good' },
  { age: '24 days', s: 'No governance breaches recorded during the current champion trial.', tone: 'good' },
  { age: '90 days', s: 'VCB v1 is the only specialist profitable in all five regimes across the validation window.', tone: 'good' },
  { age: '42% of sessions', s: 'Momentum Scalper v2 stays gated flat in chop — the behaviour that removed v1\'s -$1,052 bleed.', tone: 'info' },
  { age: 'Since v1.0', s: 'Every allocation change has originated from research, never from live performance chasing.', tone: 'info' },
  { age: '3 reviews', s: 'Low Volatility has been flagged as the weakest covered regime in three consecutive reviews.', tone: 'warn' },
];

function Memory() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BrainCircuit className="h-4 w-4 text-trading-gold" /> AI Memory
        </CardTitle>
        <CardDescription className="text-xs">Long-term institutional observations retained by the Director.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {MEMORY.map((m, i) => (
          <div
            key={m.s}
            className="animate-fade-in rounded-lg border-l-2 bg-card/40 p-3 pl-3 transition-colors hover:bg-card/70"
            style={{
              animationDelay: `${i * 30}ms`,
              borderLeftColor: m.tone === 'good' ? 'hsl(var(--trading-profit))'
                : m.tone === 'warn' ? 'hsl(var(--trading-warning))' : 'hsl(var(--primary))',
            }}
          >
            <p className="text-[11px] leading-relaxed">{m.s}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Retained · {m.age}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- Executive scorecard ---------------- */

const SCORES = [
  { label: 'Research Quality', value: 93, note: 'Every specialist carries validation, robustness and capture audits.' },
  { label: 'Architecture', value: 89, note: 'Five-layer stack reviewed Mature; redundancy score 78.' },
  { label: 'Governance', value: 95, note: 'Promotion locked behind time and trade minimums; zero breaches.' },
  { label: 'Explainability', value: 96, note: 'Plain-English reasoning attached to every decision and audit row.' },
  { label: 'Portfolio Health', value: 88, note: 'Composite health 88/100; one metric on watch (efficiency).' },
  { label: 'Risk Control', value: 84, note: 'Drawdown 2.8% inside the 3.0% ceiling; concentration above tolerance.' },
  { label: 'Coverage', value: 86, note: 'All five regimes covered; Low Volatility served only at 9%.' },
  { label: 'Simulation Readiness', value: 91, note: 'Scenario Simulator, What-If Lab and stress pack all operational.' },
];

function Scorecard() {
  const overall = Math.round(SCORES.reduce((s, x) => s + x.value, 0) / SCORES.length);
  const grade = overall >= 90 ? 'AAA' : overall >= 85 ? 'AA' : overall >= 78 ? 'A' : 'BBB';
  return (
    <Card className="animate-fade-in overflow-hidden border-trading-gold/40 bg-gradient-to-br from-card via-card to-trading-gold/5">
      <div className="h-1 w-full bg-gradient-to-r from-trading-gold via-primary to-trading-gold/20" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-trading-gold" /> Executive Scorecard
        </CardTitle>
        <CardDescription className="text-xs">Board-level rating of the research programme. Observation record only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {SCORES.map((s, i) => (
            <div key={s.label} className="animate-fade-in rounded-lg border border-border/50 bg-background/40 p-3" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{s.label}</p>
                <span className={cn(
                  'text-sm font-bold tabular-nums',
                  s.value >= 90 ? 'text-trading-profit' : s.value >= 80 ? 'text-trading-gold' : 'text-trading-warning',
                )}>{s.value}</span>
              </div>
              <Progress value={s.value} className="mt-2 h-1.5" />
              <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-trading-gold/40 bg-background/50 p-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Overall Executive Rating</p>
          <p className="mt-2 bg-gradient-to-r from-trading-gold via-foreground to-primary bg-clip-text text-4xl font-bold text-transparent">
            {grade} Research Grade
          </p>
          <p className="mt-1 text-sm font-semibold text-trading-gold">Institutional Ready · Observation Continues</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Composite score {overall}/100 across eight board dimensions.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="border-trading-profit/40 text-[10px] text-trading-profit">
              <CheckCircle2 className="mr-1 h-3 w-3" /> No governance breaches
            </Badge>
            <Badge variant="outline" className="border-trading-gold/40 text-[10px] text-trading-gold">Simulation only</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntelligenceLayer() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Timeline />
        <div className="space-y-6">
          <Feed />
          <Memory />
        </div>
      </div>
      <Scorecard />
    </div>
  );
}

export { Timeline, Feed, Memory, Scorecard };
