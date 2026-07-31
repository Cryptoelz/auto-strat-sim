import { useMemo } from 'react';
import { Users, Scale, ShieldAlert, CheckCircle2, Gavel, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SpecialistKey, computeForecast, fmtUsd } from '@/lib/directorModel';
import { cn } from '@/lib/utils';

interface DirectorView {
  name: string;
  style: string;
  accent: string;
  recommendation: string;
  stance: 'Offensive' | 'Defensive';
  evidence: string[];
  risks: string[];
  confidence: number;
}

export default function AiDebate({ weights }: { weights: Record<SpecialistKey, number> }) {
  const f = useMemo(() => computeForecast(weights), [weights]);

  const alpha: DirectorView = {
    name: 'Director Alpha',
    style: 'Return-seeking — optimises for capture and expectancy',
    accent: 'trading-profit',
    stance: 'Offensive',
    recommendation: 'Tilt further into the directional and breakout sleeves. Increase Trend Rider v1 by +5% and hold the Momentum Scalper v2 / VCB v1 pair at full weight while the regime read stays High-Vol, Bull-leaning.',
    evidence: [
      `Book expectancy is already positive at PF ${f.pf.toFixed(2)} and ${fmtUsd(f.pnl)} modelled 90-day net PnL — the edge is not marginal.`,
      'Trend Rider v1 holds the Gold Belt at 1742 Elo with 47 days and 6 defences; directional regimes account for 38% of the 90-day window.',
      'Momentum Scalper v2 posts the highest move capture on the roster (71%) and its activation gate lifted PF from 1.21 to 1.56.',
      `Current move capture of ${f.capture.toFixed(0)}% still leaves measurable unharvested opportunity versus the 75% ceiling observed in the Capture Audit.`,
    ],
    risks: [
      'Raises Bull-regime concentration further above the 35% governance threshold, which is already the single active promotion blocker.',
      `Momentum Scalper v2 and VCB v1 share a 58% behavioural overlap — correlated drawdown risk rises with a combined sleeve above 48%.`,
      'A trend-failure or liquidity-shock event would hit an offensively tilted book hardest (Scenario Simulator: PF collapse to sub-1.0).',
    ],
    confidence: Math.max(40, Math.min(92, Math.round(56 + f.capture * 0.28 + (f.pf - 1.5) * 40))),
  };

  const beta: DirectorView = {
    name: 'Director Beta',
    style: 'Capital-preservation — optimises for drawdown and durability',
    accent: 'trading-warning',
    stance: 'Defensive',
    recommendation: 'Hold the book unchanged and stage Low-Vol Coiler v2 for activation. Reduce the High-Volatility overlap by trimming the MS v2 / VCB v1 pair by 6% before any further directional increase.',
    evidence: [
      `Expected max drawdown is ${f.dd.toFixed(1)}% against a 3.0% governance ceiling — the margin is thin, not comfortable.`,
      `Weighted pairwise correlation sits at ${(f.correlation * 100).toFixed(0)}%; the Overlap Detector rejects any pair above 60% and MS/VCB is at 58%.`,
      'Forward Validation currently reports 86/100 health with two specialists on Warning status (MS v2 and MR v1 metric drift).',
      'The Champion Trial is only at day 23 of 60 with 31 of 50 trades — statistical significance has not been reached in either direction.',
    ],
    risks: [
      `Under-allocating to trend forfeits capture in the highest-frequency regime; diversification of ${f.diversification.toFixed(0)} is already adequate rather than deficient.`,
      'Holding Low-Vol Coiler v2 dormant leaves the thinnest coverage band unmonetised if compression arrives sooner than modelled.',
      'Excess caution extends the trial and delays the earliest promotion date beyond the 06 Sep 2026 estimate.',
    ],
    confidence: Math.max(40, Math.min(94, Math.round(94 - f.dd * 9 - f.correlation * 30))),
  };

  const gap = alpha.confidence - beta.confidence;
  const leader = gap > 4 ? alpha : gap < -4 ? beta : null;

  const referee = {
    verdict: leader
      ? `Weight of evidence favours ${leader.name}`
      : 'Split decision — no material edge between the two views',
    body: leader === alpha
      ? 'Alpha carries the argument on expectancy: the book is profitable across every modelled regime and the largest sleeve is held by the highest-rated specialist on the board. However Beta\'s concentration objection is not rebutted — Bull-regime exposure remains the one live governance blocker, and Alpha\'s proposal worsens it. The Referee therefore adopts Alpha\'s direction with Beta\'s constraint attached: no directional increase until concentration falls inside tolerance.'
      : leader === beta
      ? 'Beta carries the argument on durability. With drawdown close to the governance ceiling, two specialists on Warning status and the champion trial less than halfway through its minimum sample, the marginal capture Alpha is chasing does not compensate for the added correlated risk. The Referee adopts Beta\'s hold-and-stage position.'
      : 'Neither director establishes a decisive case. Alpha\'s expectancy evidence and Beta\'s drawdown evidence are both sound and point in opposite directions, which is itself the finding: the book is near its efficient frontier for the current regime read. The Referee recommends no change and continued observation until the trial sample matures.',
    recommendation: 'Continue observation. Hold the recommended book unchanged, keep Low-Vol Coiler v2 staged rather than allocated, and re-run this debate when either the 50-trade minimum is met or Bull concentration falls below 35%.',
    confidence: Math.round((alpha.confidence + beta.confidence) / 2),
  };

  const panel = (d: DirectorView) => (
    <Card className={cn('border-border/60 bg-card/60', d.stance === 'Offensive' ? 'border-trading-profit/25' : 'border-trading-warning/25')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className={cn('h-4 w-4', d.stance === 'Offensive' ? 'text-trading-profit' : 'text-trading-warning')} />
            {d.name}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">{d.stance}</Badge>
        </div>
        <CardDescription className="text-[11px]">{d.style}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommendation</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground/90">{d.recommendation}</p>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> Supporting evidence
          </p>
          <ul className="space-y-1">
            {d.evidence.map((e) => (
              <li key={e} className="flex gap-2 text-[11px] leading-relaxed text-foreground/80">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-trading-profit" />{e}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="h-3 w-3" /> Risks acknowledged
          </p>
          <ul className="space-y-1">
            {d.risks.map((r) => (
              <li key={r} className="flex gap-2 text-[11px] leading-relaxed text-foreground/80">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-trading-loss" />{r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Confidence</span><span className="tabular-nums text-foreground">{d.confidence}/100</span>
          </div>
          <Progress value={d.confidence} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="animate-fade-in border-trading-gold/25">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-trading-gold" /> AI Investment Debate
            </CardTitle>
            <CardDescription className="text-xs">
              Two independent AI investment managers argue the book; a referee reconciles them. Advisory output only.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> OBSERVATION ONLY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          {panel(alpha)}
          {panel(beta)}
        </div>

        <Card className="border-trading-gold/35 bg-gradient-to-br from-card to-trading-gold/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gavel className="h-4 w-4 text-trading-gold" /> AI Referee
            </CardTitle>
            <CardDescription className="text-[11px]">{referee.verdict}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs leading-relaxed text-foreground/85">{referee.body}</p>
            <div className="rounded-lg border border-trading-gold/30 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Final observation-only recommendation</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">{referee.recommendation}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/50 p-2">
                <p className="text-[10px] text-muted-foreground">Alpha confidence</p>
                <p className="text-sm font-bold tabular-nums text-trading-profit">{alpha.confidence}/100</p>
              </div>
              <div className="rounded-lg border border-border/50 p-2">
                <p className="text-[10px] text-muted-foreground">Beta confidence</p>
                <p className="text-sm font-bold tabular-nums text-trading-warning">{beta.confidence}/100</p>
              </div>
              <div className="rounded-lg border border-trading-gold/30 p-2">
                <p className="text-[10px] text-muted-foreground">Referee confidence</p>
                <p className="text-sm font-bold tabular-nums text-trading-gold">{referee.confidence}/100</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              The referee issues observations, not instructions. No allocation, strategy or governance state changes as a result of this debate.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
