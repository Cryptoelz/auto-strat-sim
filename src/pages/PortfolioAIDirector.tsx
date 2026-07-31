import { useMemo, useState } from 'react';
import {
  Brain, Sparkles, Activity, Shield, Gauge, Radar as RadarIcon, FlaskConical,
  Crown, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lock, Plus, Trash2, RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

import ScenarioSimulator from '@/components/director/ScenarioSimulator';
import AiDebate from '@/components/director/AiDebate';
import PortfolioEvolution from '@/components/director/PortfolioEvolution';
import ResearchDependencyMap from '@/components/director/ResearchDependencyMap';
import ExecutiveBrief from '@/components/director/ExecutiveBrief';
import { OvernightIntelligence } from '@/components/director/OvernightIntelligence';
import IntelligenceLayer from '@/components/director/IntelligenceLayer';
import {
  SPECIALISTS, REGIMES, SpecialistKey, Specialist, Forecast, computeForecast, overlapOf, fmtUsd,
} from '@/lib/directorModel';


/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function MetricTile({
  label, value, sub, tone = 'neutral', icon: Icon,
}: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' | 'gold' | 'neutral'; icon?: React.ElementType }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3 backdrop-blur transition-colors hover:border-trading-gold/40">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <p className={cn(
        'mt-1 text-xl font-bold tabular-nums',
        tone === 'good' && 'text-trading-profit',
        tone === 'bad' && 'text-trading-loss',
        tone === 'gold' && 'text-trading-gold',
      )}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RiskPill({ level }: { level: 'Low' | 'Medium' | 'High' | 'Critical' }) {
  return (
    <Badge variant="outline" className={cn(
      'text-[10px]',
      level === 'Low' && 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit',
      level === 'Medium' && 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
      level === 'High' && 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss',
      level === 'Critical' && 'border-trading-loss bg-trading-loss/20 text-trading-loss',
    )}>{level}</Badge>
  );
}

/* ------------------------------------------------------------------ */
/* History data                                                        */
/* ------------------------------------------------------------------ */

function buildHistory(days: number) {
  const out: Record<string, number | string>[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = (days - i) / days;
    const d = new Date(Date.now() - i * 86400000);
    const raw = {
      TR: 32 + 10 * t + Math.sin(i / 5) * 3,
      MS: 28 - 4 * t + Math.cos(i / 7) * 3,
      VCB: 18 + 3 * t + Math.sin(i / 4) * 2,
      MR: 22 - 8 * t + Math.cos(i / 6) * 2,
      LVC: Math.max(0, 8 - 8 * t + Math.sin(i / 9) * 2),
    };
    const sum = Object.values(raw).reduce((a, b) => a + b, 0);
    out.push({
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      TR: Math.round((raw.TR / sum) * 100),
      MS: Math.round((raw.MS / sum) * 100),
      VCB: Math.round((raw.VCB / sum) * 100),
      MR: Math.round((raw.MR / sum) * 100),
      LVC: Math.round((raw.LVC / sum) * 100),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const DEFAULT_WEIGHTS = SPECIALISTS.reduce((acc, sp) => {
  acc[sp.key] = sp.default; return acc;
}, {} as Record<SpecialistKey, number>);

interface WhatIfPortfolio {
  id: string;
  name: string;
  weights: Record<SpecialistKey, number>;
}

export default function PortfolioAIDirector() {
  const [weights, setWeights] = useState<Record<SpecialistKey, number>>({ ...DEFAULT_WEIGHTS });
  const [historyRange, setHistoryRange] = useState<'7' | '30' | '90' | 'trial'>('30');
  const [portfolios, setPortfolios] = useState<WhatIfPortfolio[]>([
    { id: 'A', name: 'Portfolio A — Recommended', weights: { ...DEFAULT_WEIGHTS } },
    { id: 'B', name: 'Portfolio B — Trend Heavy', weights: { tr: 55, ms: 20, vcb: 15, mr: 10, lvc: 0 } },
    { id: 'C', name: 'Portfolio C — Balanced Five', weights: { tr: 25, ms: 20, vcb: 20, mr: 20, lvc: 15 } },
  ]);

  const forecast = useMemo(() => computeForecast(weights), [weights]);
  const baseline = useMemo(() => computeForecast(DEFAULT_WEIGHTS), []);
  const history = useMemo(
    () => buildHistory(historyRange === 'trial' ? 120 : Number(historyRange)),
    [historyRange],
  );

  const totalWeight = forecast.totalWeight;
  const drifted = Math.abs(totalWeight - 100) > 0.5;

  const confidence = useMemo(() => {
    const score = Math.round(
      forecast.health * 0.4 + Math.min(100, (forecast.pf / 2.2) * 100) * 0.25 +
      forecast.diversification * 0.2 + Math.max(0, 100 - forecast.dd * 22) * 0.15,
    );
    const label = score >= 82 ? 'Very High' : score >= 68 ? 'High' : score >= 50 ? 'Medium' : 'Low';
    return { score: Math.max(0, Math.min(100, score)), label };
  }, [forecast]);

  const riskRadar = useMemo(() => {
    const conc = Math.max(...SPECIALISTS.map((sp) => (totalWeight > 0 ? weights[sp.key] / totalWeight : 0))) * 100;
    const lvl = (v: number): 'Low' | 'Medium' | 'High' | 'Critical' =>
      v < 30 ? 'Low' : v < 55 ? 'Medium' : v < 78 ? 'High' : 'Critical';
    const rows = [
      { category: 'Regime Risk', value: Math.round(100 - forecast.coverage), note: `Coverage ${forecast.coverage}/100 across five regimes` },
      { category: 'Concentration', value: Math.round(Math.max(0, (conc - 25) * 2)), note: `Largest sleeve ${conc.toFixed(0)}% of book` },
      { category: 'Correlation', value: Math.round(forecast.correlation * 130), note: `Weighted pairwise overlap ${(forecast.correlation * 100).toFixed(0)}%` },
      { category: 'Drawdown', value: Math.round(Math.max(0, ((forecast.dd - 1.6) / 2.6) * 100)), note: `Expected max DD ${forecast.dd.toFixed(1)}%` },
      { category: 'Volatility', value: Math.round(Math.max(0, 90 - forecast.sharpe * 45)), note: `Sharpe-like score ${forecast.sharpe.toFixed(2)}` },
      { category: 'Capital Efficiency', value: Math.round((1 - forecast.efficiency) * 130), note: `Efficiency ${(forecast.efficiency * 100).toFixed(0)}%` },
      { category: 'Promotion Risk', value: 46, note: 'Time gates incomplete — day 23 of 60, 31 of 50 trades' },
    ];
    return rows.map((r) => ({ ...r, value: Math.max(4, Math.min(100, r.value)), level: lvl(Math.min(100, r.value)) }));
  }, [forecast, weights, totalWeight]);

  const coach = useMemo(() => {
    const recs: {
      action: string; delta: string; reason: string; evidence: string;
      benefit: string; risk: string; confidence: number; tone: 'good' | 'warn';
    }[] = [];
    const pct = (k: SpecialistKey) => (totalWeight > 0 ? (weights[k] / totalWeight) * 100 : 0);

    if (pct('tr') < 45) recs.push({
      action: 'Increase Trend Rider v1', delta: '+5%',
      reason: 'Bull Trend probability has increased to 46% in the current regime read.',
      evidence: 'TR v1 holds the Gold Belt at 1742 Elo with 47 days and 6 successful defences; Bull sessions account for 38% of the 90-day window.',
      benefit: 'Higher directional capture, estimated +$210 net PnL over 30 days.',
      risk: 'Minimal — TR drawdown clusters are offset by the Mean Reversion sleeve.',
      confidence: 78, tone: 'good',
    });
    if (pct('mr') > 12) recs.push({
      action: 'Reduce Mean Reversion v1', delta: '-4%',
      reason: 'Sideways probability has fallen to 14% from a 90-day average of 22%.',
      evidence: 'MR v1 posts PF 1.51 aggregate but sub-1.0 outside range conditions; regime detector confidence in Sideways dropped for 5 consecutive sessions.',
      benefit: 'Lower portfolio drag; expected +0.04 PF and improved capital efficiency.',
      risk: 'Low — retains 11% coverage insurance if the range regime returns.',
      confidence: 71, tone: 'good',
    });
    if (pct('ms') + pct('vcb') > 48) recs.push({
      action: 'Trim High-Vol overlap (MS v2 / VCB v1)', delta: '-6%',
      reason: 'Momentum Scalper v2 and VCB v1 share a 58% behavioural overlap in High Volatility.',
      evidence: 'Overlap Detector flags any pair above 60% for rejection; combined sleeve currently exceeds the 48% double-count threshold.',
      benefit: 'Reduces correlated drawdown; expected DD improvement of 0.3-0.5%.',
      risk: 'Medium — trimming too far reduces High-Vol capture below the 65% target.',
      confidence: 64, tone: 'warn',
    });
    if (pct('lvc') < 8) recs.push({
      action: 'Stage Low-Vol Coiler v2', delta: '+0% now, +10% on trigger',
      reason: 'Low Volatility remains the thinnest coverage band at 41% before LVC activation.',
      evidence: 'LVC v2 clears its gates (PF 1.74, capture 64%, DD 2.1%) but the current ATR% read is above its 0.35 ceiling.',
      benefit: 'Closes the last structural coverage gap when compression returns.',
      risk: 'Minimal — dormant allocation contributes no drag while gated off.',
      confidence: 82, tone: 'good',
    });
    if (forecast.dd > 3.2) recs.push({
      action: 'Rebalance toward low-DD sleeves', delta: 'shift 5% to MR / LVC',
      reason: `Expected drawdown of ${forecast.dd.toFixed(1)}% is above the 3.0% observation ceiling.`,
      evidence: 'Forward Validation success criteria require DD < 3% sustained for 60 consecutive days; current run is day 12 of 60.',
      benefit: 'Restores the drawdown gate and protects the success-day streak.',
      risk: 'Medium — reduces expected net PnL by an estimated 4-6%.',
      confidence: 69, tone: 'warn',
    });
    return recs;
  }, [weights, totalWeight, forecast]);

  const decision = forecast.health >= 88 && forecast.dd < 3.2
    ? 'CONTINUE OBSERVATION — ALLOCATION OPTIMAL'
    : forecast.health >= 75
      ? 'CONTINUE OBSERVATION — MINOR REBALANCE SUGGESTED'
      : 'CONTINUE OBSERVATION — ALLOCATION SUB-OPTIMAL';

  const compare = portfolios.map((p) => ({ ...p, f: computeForecast(p.weights) }));
  const winner = compare.reduce((best, p) =>
    (p.f.sharpe * 0.4 + p.f.pf * 0.3 + (p.f.diversification / 100) * 0.3) >
    (best.f.sharpe * 0.4 + best.f.pf * 0.3 + (best.f.diversification / 100) * 0.3) ? p : best,
  compare[0]);

  const addPortfolio = () => {
    const id = String.fromCharCode(65 + portfolios.length);
    setPortfolios((p) => [...p, { id, name: `Portfolio ${id} — Custom`, weights: { ...weights } }]);
  };

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="animate-fade-in flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-trading-gold/30 to-primary/20 ring-1 ring-trading-gold/40">
              <Brain className="h-5 w-5 text-trading-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-2xl">
                Portfolio AI Director<span className="align-super text-[10px] text-trading-gold">™</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Central intelligence hub — research, allocation, architecture and governance in one boardroom view.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> OBSERVATION ONLY
          </Badge>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">RESEARCH ONLY</Badge>
          <Badge variant="outline" className="text-[10px]">SIMULATION</Badge>
        </div>
      </div>

      {/* SECTION 0 — AI EXECUTIVE BRIEF */}
      <ExecutiveBrief
        regime="High Volatility"
        regimeConfidence={78}
        health={forecast.health}
        champion="Dynamic Allocation v1"
        largestRisk="Bull Trend concentration (42%)"
        opportunity="Low Volatility specialist staged"
        action="Continue Observation"
        actionNote="No production changes recommended. Promotion remains locked behind trial time and trade minimums."
      />

      {/* SECTION 0b — OVERNIGHT INTELLIGENCE */}
      <OvernightIntelligence />

      {/* v3.5 SECTION 1 — THE EXECUTIVE BOARDROOM */}
      <ExecutiveBoardroom m={boardroom} />

      {/* v3.5 SECTION 2 — EXECUTIVE BRIEFING */}
      <ExecutiveBriefing m={boardroom} />





      {/* SECTION 1 — EXECUTIVE SUMMARY */}
      <Card className="animate-fade-in overflow-hidden border-trading-gold/30 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="h-1 w-full bg-gradient-to-r from-trading-gold via-primary to-trading-gold/20" />
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-trading-gold" /> Executive Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Board-level read of the recommended specialist book. Nothing on this page executes.
              </CardDescription>
            </div>
            <Badge className="bg-trading-gold/15 text-trading-gold hover:bg-trading-gold/20">{decision}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-trading-gold/25 bg-background/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Market Regime</p>
              <p className="mt-1 text-2xl font-bold text-trading-gold">High Volatility</p>
              <p className="text-xs text-muted-foreground">Bull-leaning, ATR expanding</p>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Regime Confidence</span><span className="font-semibold text-foreground">78%</span>
                </div>
                <Progress value={78} className="mt-1 h-1.5" />
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended Specialist Allocation</p>
              <div className="mt-2 space-y-1.5">
                {SPECIALISTS.map((sp) => (
                  <div key={sp.key} className="flex items-center gap-2">
                    <span className="w-10 text-[10px] font-semibold text-muted-foreground">{sp.short}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${sp.default}%`, background: sp.color }} />
                    </div>
                    <span className="w-8 text-right text-[10px] tabular-nums">{sp.default}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Portfolio Confidence</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-primary">{confidence.score}</p>
              <p className="text-xs font-medium text-trading-gold">{confidence.label}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Composite of health, profit factor, diversification and drawdown headroom.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Expected Net PnL" value={fmtUsd(baseline.pnl)} sub="90-day simulated" tone="good" icon={TrendingUp} />
            <MetricTile label="Expected Profit Factor" value={baseline.pf.toFixed(2)} sub="Target > 1.90" tone="gold" icon={Activity} />
            <MetricTile label="Expected Drawdown" value={`${baseline.dd.toFixed(1)}%`} sub="Ceiling 3.0%" tone={baseline.dd < 3 ? 'good' : 'bad'} icon={TrendingDown} />
            <MetricTile label="Expected Capture" value={`${baseline.capture.toFixed(0)}%`} sub="Peer best 71%" tone="gold" icon={Gauge} />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 — AI PORTFOLIO REASONING */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> AI Portfolio Reasoning
          </CardTitle>
          <CardDescription className="text-xs">
            Every allocation carries a written justification. No black-box recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SPECIALISTS.map((sp) => (
            <div key={sp.key} className="rounded-lg border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: sp.color }} />
                  <p className="text-sm font-semibold">{sp.name}</p>
                  <Badge variant="outline" className="text-[10px]">{sp.regime}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>PF <b className="text-foreground">{sp.pf.toFixed(2)}</b></span>
                  <span>DD <b className="text-foreground">{sp.dd}%</b></span>
                  <span>Capture <b className="text-foreground">{sp.capture}%</b></span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{sp.default}%</Badge>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why it was selected</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{sp.why}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why this allocation</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{sp.whyAllocation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Regime it protects</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{sp.protects}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk it offsets</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{sp.offsets}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expected contribution</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-trading-gold">{sp.contribution}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-trading-gold">Why the portfolio is constructed this way</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/85">
              The book is built regime-first, not return-first. Each of the five regimes identified by the architecture review
              is assigned a primary specialist with proven standalone edge in that regime, and a secondary specialist that
              remains partially active across the boundary — this removes single points of failure without duplicating behaviour.
              Sleeve sizes are then scaled by regime frequency in the 90-day window and de-rated wherever behavioural overlap
              exceeds 30%, which is why Momentum Scalper v2 and VCB v1 are jointly capped despite both clearing their gates.
              Trend Rider v1 carries the largest weight because directional trend is both the most frequent regime and the one
              with the highest PF-per-unit-drawdown. Mean Reversion v1 is deliberately undersized relative to its coverage role —
              it exists to dampen Trend Rider drawdown clusters rather than to generate return. Low-Vol Coiler v2 sits at zero in
              the current read and is staged for activation only when ATR% falls below its 0.35 ceiling, keeping idle capital drag
              at zero. The result targets maximum regime coverage per unit of correlated risk, not maximum headline PnL.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECTIONS 3 + 4 — STUDIO + FORECAST */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="animate-fade-in lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-4 w-4 text-primary" /> Interactive Allocation Studio
                </CardTitle>
                <CardDescription className="text-xs">Move any slider — the forecast recalculates instantly. Simulation only.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}>
                <RotateCcw className="mr-1 h-3 w-3" /> Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {SPECIALISTS.map((sp) => (
              <div key={sp.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: sp.color }} />
                    <span className="text-sm font-medium">{sp.name}</span>
                    <span className="text-[10px] text-muted-foreground">{sp.min}–{sp.max}%</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-trading-gold">{weights[sp.key]}%</span>
                </div>
                <Slider
                  value={[weights[sp.key]]}
                  min={sp.min}
                  max={sp.max}
                  step={1}
                  onValueChange={([v]) => setWeights((w) => ({ ...w, [sp.key]: v }))}
                />
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3">
              <span className="text-xs text-muted-foreground">Total allocated</span>
              <span className={cn('text-sm font-bold tabular-nums', drifted ? 'text-trading-warning' : 'text-trading-profit')}>
                {totalWeight}% {drifted && <span className="text-[10px] font-normal">(normalised for forecasting)</span>}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <MetricTile label="Capital Efficiency" value={`${(forecast.efficiency * 100).toFixed(0)}%`} tone="gold" />
              <MetricTile label="Diversification" value={`${forecast.diversification.toFixed(0)}/100`} tone="gold" />
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Regime Exposure</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecast.regimeExposure}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="regime" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" fill="hsl(var(--trading-gold))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-trading-gold" /> Live Forecast Engine
            </CardTitle>
            <CardDescription className="text-xs">Recomputed on every slider move.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <MetricTile label="Expected Net PnL" value={fmtUsd(forecast.pnl)} tone={forecast.pnl >= 0 ? 'good' : 'bad'} />
              <MetricTile label="Expected PF" value={forecast.pf.toFixed(2)} tone="gold" />
              <MetricTile label="Expected DD" value={`${forecast.dd.toFixed(1)}%`} tone={forecast.dd < 3 ? 'good' : 'bad'} />
              <MetricTile label="Expected Win Rate" value={`${forecast.wr.toFixed(1)}%`} />
              <MetricTile label="Expected Capture" value={`${forecast.capture.toFixed(0)}%`} tone="gold" />
              <MetricTile label="Sharpe-like Score" value={forecast.sharpe.toFixed(2)} tone="gold" />
              <MetricTile label="Capital Efficiency" value={`${(forecast.efficiency * 100).toFixed(0)}%`} />
              <MetricTile label="Diversification" value={forecast.diversification.toFixed(0)} />
            </div>
            <div className="rounded-xl border border-trading-gold/30 bg-gradient-to-br from-trading-gold/10 to-transparent p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Portfolio Health</p>
              <p className="text-5xl font-bold tabular-nums text-trading-gold">{forecast.health}</p>
              <p className="text-[10px] text-muted-foreground">out of 100</p>
              <Progress value={forecast.health} className="mt-3 h-2" />
              <p className="mt-2 text-[10px] text-muted-foreground">
                vs recommended book: {forecast.health - baseline.health >= 0 ? '+' : ''}{forecast.health - baseline.health} pts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5 — PORTFOLIO HEALTH */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" /> Portfolio Health
          </CardTitle>
          <CardDescription className="text-xs">Six structural dimensions rolled into one composite score.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-xl border border-trading-gold/30 bg-background/40 p-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Health Score</p>
              <p className="text-6xl font-bold tabular-nums text-trading-gold">{forecast.health}</p>
              <p className="text-xs text-muted-foreground">/ 100</p>
              <Badge className="mt-3 bg-trading-profit/15 text-trading-profit hover:bg-trading-profit/20">
                {forecast.health >= 90 ? 'Excellent' : forecast.health >= 78 ? 'Strong' : forecast.health >= 62 ? 'Adequate' : 'Weak'}
              </Badge>
            </div>
            <div className="space-y-3 lg:col-span-2">
              {[
                { label: 'Regime Coverage', value: forecast.coverage, note: `${forecast.regimeExposure.filter((r) => r.value >= 10).length}/5 regimes above the 10% exposure floor` },
                { label: 'Diversification', value: Math.round(forecast.diversification), note: 'Herfindahl evenness de-rated by behavioural overlap' },
                { label: 'Correlation (inverted)', value: Math.round((1 - forecast.correlation) * 100), note: `Weighted pairwise overlap ${(forecast.correlation * 100).toFixed(0)}% — rejection threshold 60%` },
                { label: 'Capital Efficiency', value: Math.round(forecast.efficiency * 100), note: 'Return generated per unit of deployed simulated capital' },
                { label: 'Risk Balance', value: forecast.riskBalance, note: 'Drawdown, correlation and diversification blended' },
                { label: 'Architecture Health', value: 89, note: 'Composite from Portfolio Architecture Review — Mature' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{row.label}</span>
                    <span className="font-bold tabular-nums text-trading-gold">{row.value}/100</span>
                  </div>
                  <Progress value={row.value} className="mt-1 h-1.5" />
                  <p className="mt-1 text-[10px] text-muted-foreground">{row.note}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6 — AI PORTFOLIO COACH */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-trading-gold" /> AI Portfolio Coach
          </CardTitle>
          <CardDescription className="text-xs">
            Advisory only. Recommendations are never auto-applied and never touch production allocation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {coach.map((r) => (
            <div key={r.action} className={cn(
              'rounded-lg border p-4 transition-colors',
              r.tone === 'good' ? 'border-trading-profit/25 bg-trading-profit/5' : 'border-trading-warning/25 bg-trading-warning/5',
            )}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{r.action}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">{r.delta}</Badge>
              </div>
              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ['Reason', r.reason], ['Evidence', r.evidence],
                  ['Expected Benefit', r.benefit], ['Expected Risk', r.risk],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="leading-relaxed text-foreground/80">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Confidence Level</span><span className="font-semibold text-foreground">{r.confidence}%</span>
                </div>
                <Progress value={r.confidence} className="mt-1 h-1.5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SECTION 7 — PORTFOLIO HISTORY */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Allocation Timeline</CardTitle>
              <CardDescription className="text-xs">Historical simulated allocation mix across the research trial.</CardDescription>
            </div>
            <Tabs value={historyRange} onValueChange={(v) => setHistoryRange(v as typeof historyRange)}>
              <TabsList className="h-8">
                <TabsTrigger value="7" className="text-[10px]">7 days</TabsTrigger>
                <TabsTrigger value="30" className="text-[10px]">30 days</TabsTrigger>
                <TabsTrigger value="90" className="text-[10px]">90 days</TabsTrigger>
                <TabsTrigger value="trial" className="text-[10px]">Entire Trial</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {SPECIALISTS.map((sp) => (
                  <Area key={sp.key} type="monotone" dataKey={sp.short} stackId="1"
                    stroke={sp.color} fill={sp.color} fillOpacity={0.35} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* SECTIONS 8 + 9 — CONFIDENCE + RISK RADAR */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-trading-gold" /> Confidence Engine
            </CardTitle>
            <CardDescription className="text-xs">Portfolio-level conviction and what moved it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
              <svg viewBox="0 0 120 120" className="absolute h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--trading-gold))" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(confidence.score / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="text-center">
                <p className="text-4xl font-bold tabular-nums text-trading-gold">{confidence.score}</p>
                <p className="text-xs font-medium">{confidence.label}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-trading-profit/25 bg-trading-profit/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-trading-profit">What increased confidence</p>
                <ul className="mt-1 space-y-1 text-[11px] text-foreground/80">
                  <li>• Architecture Review returned Mature (composite 89)</li>
                  <li>• Specialist roster marked Complete — all five regimes covered</li>
                  <li>• Challenger has held the lead for 5 consecutive days</li>
                  <li>• No guardrail breaches in the current trial window</li>
                </ul>
              </div>
              <div className="rounded-lg border border-trading-loss/25 bg-trading-loss/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-trading-loss">What reduced confidence</p>
                <ul className="mt-1 space-y-1 text-[11px] text-foreground/80">
                  <li>• 42% of the challenger lead originates from Bull Trend</li>
                  <li>• Capital Efficiency flagged Warning at 0.71</li>
                  <li>• Momentum Scalper v2 PF drifted 1.82 → 1.52 in low-vol sessions</li>
                  <li>• Time gates incomplete — day 23 of 60, 31 of 50 trades</li>
                </ul>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why confidence changed</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                Confidence moved from Medium to {confidence.label} as the architecture review closed the last structural gap and
                Low-Vol Coiler v2 cleared its capture criteria. The remaining drag is concentration, not edge: the book's
                out-performance is still leaning on a single regime, so the score is capped until Bull dependency falls below 35%
                or the trial accumulates enough non-Bull sessions to prove the lead is regime-agnostic.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RadarIcon className="h-4 w-4 text-primary" /> Risk Radar
            </CardTitle>
            <CardDescription className="text-xs">Seven risk categories, scored live against the current studio allocation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riskRadar} outerRadius="72%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar dataKey="value" stroke="hsl(var(--trading-gold))" fill="hsl(var(--trading-gold))" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {riskRadar.map((r) => (
                <div key={r.category} className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-card/40 p-2">
                  <div>
                    <p className="text-xs font-medium">{r.category}</p>
                    <p className="text-[10px] text-muted-foreground">{r.note}</p>
                  </div>
                  <RiskPill level={r.level} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 10 — WHAT-IF LAB */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4 text-primary" /> What-If Lab
              </CardTitle>
              <CardDescription className="text-xs">
                Unlimited simulated portfolios compared side by side. Nothing here affects production.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addPortfolio}>
              <Plus className="mr-1 h-3 w-3" /> Snapshot current studio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2 text-left">Portfolio</th>
                  <th className="p-2 text-left">Mix</th>
                  <th className="p-2 text-right">PnL</th>
                  <th className="p-2 text-right">PF</th>
                  <th className="p-2 text-right">DD</th>
                  <th className="p-2 text-right">Capture</th>
                  <th className="p-2 text-right">Diversification</th>
                  <th className="p-2 text-right">Sharpe</th>
                  <th className="p-2 text-right">Risk</th>
                  <th className="p-2 text-right">Cap. Eff.</th>
                  <th className="p-2 text-center">Winner</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {compare.map((p) => (
                  <tr key={p.id} className={cn(
                    'border-b border-border/50 transition-colors hover:bg-muted/30',
                    p.id === winner.id && 'bg-trading-gold/5',
                  )}>
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-[10px] text-muted-foreground">
                      {SPECIALISTS.map((sp) => `${sp.short} ${p.weights[sp.key]}%`).join(' · ')}
                    </td>
                    <td className="p-2 text-right tabular-nums text-trading-profit">{fmtUsd(p.f.pnl)}</td>
                    <td className="p-2 text-right tabular-nums">{p.f.pf.toFixed(2)}</td>
                    <td className="p-2 text-right tabular-nums">{p.f.dd.toFixed(1)}%</td>
                    <td className="p-2 text-right tabular-nums">{p.f.capture.toFixed(0)}%</td>
                    <td className="p-2 text-right tabular-nums">{p.f.diversification.toFixed(0)}</td>
                    <td className="p-2 text-right tabular-nums">{p.f.sharpe.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <RiskPill level={p.f.riskBalance >= 70 ? 'Low' : p.f.riskBalance >= 50 ? 'Medium' : 'High'} />
                    </td>
                    <td className="p-2 text-right tabular-nums">{(p.f.efficiency * 100).toFixed(0)}%</td>
                    <td className="p-2 text-center">
                      {p.id === winner.id && <Crown className="mx-auto h-4 w-4 text-trading-gold" />}
                    </td>
                    <td className="p-2 text-right">
                      {portfolios.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => setPortfolios((list) => list.filter((x) => x.id !== p.id))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Winner is scored on a blend of Sharpe-like score (40%), profit factor (30%) and diversification (30%).
            Current winner: <b className="text-trading-gold">{winner.name}</b>.
          </p>
        </CardContent>
      </Card>

      {/* SECTION 12 — SCENARIO SIMULATOR */}
      <ScenarioSimulator currentWeights={weights} />

      {/* SECTION 13 — AI DEBATE */}
      <AiDebate weights={weights} />

      {/* SECTION 14 — PORTFOLIO EVOLUTION */}
      <PortfolioEvolution />

      {/* SECTION 15 — RESEARCH DEPENDENCY MAP */}
      <ResearchDependencyMap />

      {/* SECTION 16 — EXECUTIVE INTELLIGENCE LAYER */}
      <IntelligenceLayer />

      {/* SECTION 11 — EXECUTIVE DECISION */}
      <Card className="animate-fade-in overflow-hidden border-trading-gold/40 bg-gradient-to-br from-card via-card to-trading-gold/5">
        <div className="h-1 w-full bg-gradient-to-r from-trading-gold via-primary to-trading-gold/20" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-trading-gold" /> Executive Decision
          </CardTitle>
          <CardDescription className="text-xs">Board summary — observation record, not an instruction to act.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricTile label="Current Portfolio Health" value={`${forecast.health}/100`} tone="gold" />
            <MetricTile label="Architecture" value="Mature" tone="good" />
            <MetricTile label="Coverage" value={forecast.coverage >= 85 ? 'Excellent' : forecast.coverage >= 70 ? 'Good' : 'Partial'} tone="good" />
            <MetricTile label="Risk" value={forecast.riskBalance >= 70 ? 'Low' : forecast.riskBalance >= 50 ? 'Moderate' : 'Elevated'} tone={forecast.riskBalance >= 70 ? 'good' : 'bad'} />
            <MetricTile label="Diversification" value={forecast.diversification >= 70 ? 'Strong' : forecast.diversification >= 50 ? 'Adequate' : 'Concentrated'} tone="gold" />
          </div>
          <div className="rounded-xl border border-trading-gold/30 bg-background/40 p-5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommendation</p>
            <p className="mt-1 text-2xl font-bold text-trading-gold">Continue Observation</p>
            <p className="mt-2 text-xs leading-relaxed text-foreground/80">
              No promotion action required. The specialist roster is complete, architecture is Mature and all guardrails remain
              unbreached, but the promotion gates are still time-limited: the champion trial stands at day 23 of 60 with 31 of the
              required 50 trades, and Bull-regime concentration remains above the 35% threshold. The Director recommends holding the
              recommended book unchanged and re-reviewing when either the trade minimum is met or concentration falls inside tolerance.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-trading-profit/40 text-trading-profit text-[10px]">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Guardrails clear
              </Badge>
              <Badge variant="outline" className="border-trading-warning/40 text-trading-warning text-[10px]">
                <AlertTriangle className="mr-1 h-3 w-3" /> Bull concentration 42%
              </Badge>
              <Badge variant="outline" className="border-trading-gold/40 text-trading-gold text-[10px]">
                <Lock className="mr-1 h-3 w-3" /> Promotion locked — observation only
              </Badge>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            Portfolio AI Director™ is a research and observation surface. It performs no live trading, modifies no strategy,
            changes no allocation and bypasses no governance. All figures are simulated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
