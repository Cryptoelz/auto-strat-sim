/**
 * Portfolio AI Director™ v3.5 — Executive Boardroom + Executive Briefing.
 * Observation / research / simulation only. No trading, execution or allocation.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Activity, HeartPulse, Crown, Layers, Gauge, ShieldCheck,
  FileText, TrendingUp, AlertTriangle, Sparkles, ArrowRight, Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BoardroomMetrics {
  regime: string;
  regimeConfidence: number;
  health: number;
  champion: string;
  championDays: number;
  architecture: string;
  architectureScore: number;
  confidence: number;
  governance: string;
  pf: number;
  dd: number;
  capture: number;
  diversification: number;
  promotionProbability: number;
}

/* ---------------- Section 1 — The Executive Boardroom ---------------- */

function BoardCard({
  label, value, sub, icon: Icon, tone, delay,
}: {
  label: string; value: string; sub: string; icon: React.ElementType;
  tone: 'gold' | 'good' | 'warn' | 'info'; delay: number;
}) {
  const prev = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 700);
      return () => clearTimeout(t);
    }
  }, [value]);

  const toneText = tone === 'good' ? 'text-trading-profit'
    : tone === 'warn' ? 'text-trading-warning'
      : tone === 'gold' ? 'text-trading-gold' : 'text-primary';
  const toneRing = tone === 'good' ? 'hover:border-trading-profit/50'
    : tone === 'warn' ? 'hover:border-trading-warning/50'
      : tone === 'gold' ? 'hover:border-trading-gold/50' : 'hover:border-primary/50';
  const glow = tone === 'good' ? 'from-trading-profit/20'
    : tone === 'warn' ? 'from-trading-warning/20'
      : tone === 'gold' ? 'from-trading-gold/25' : 'from-primary/20';

  return (
    <div
      className={cn(
        'animate-fade-in group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur transition-all duration-500',
        toneRing, pulse && 'scale-[1.02] ring-1 ring-trading-gold/60',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn(
        'pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br to-transparent opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-80',
        glow,
      )} />
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', toneText)} />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={cn('mt-2 text-lg font-bold leading-tight transition-colors duration-500 sm:text-xl', toneText)}>
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}

export function ExecutiveBoardroom({ m }: { m: BoardroomMetrics }) {
  const healthLabel = m.health >= 85 ? 'Strong' : m.health >= 70 ? 'Healthy' : 'Under Watch';
  return (
    <Card className="animate-fade-in overflow-hidden border-trading-gold/40 bg-gradient-to-br from-background via-card to-primary/10">
      <div className="h-1 w-full bg-gradient-to-r from-trading-gold via-primary to-trading-gold/10" />
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">The Executive Boardroom</CardTitle>
            <CardDescription className="text-xs">
              Six live board indicators, refreshed from the research book. Observation record only.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> v3.5 · SIMULATION
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <BoardCard icon={Activity} tone="gold" delay={0} label="Market Regime"
            value={m.regime} sub={`Regime confidence ${m.regimeConfidence}%`} />
          <BoardCard icon={HeartPulse} tone={m.health >= 85 ? 'good' : 'warn'} delay={40} label="Portfolio Health"
            value={`${m.health}/100 · ${healthLabel}`} sub={`PF ${m.pf.toFixed(2)} · drawdown ${m.dd.toFixed(1)}%`} />
          <BoardCard icon={Crown} tone="gold" delay={80} label="Current Champion"
            value={m.champion} sub={`Forward trial day ${m.championDays} of 60`} />
          <BoardCard icon={Layers} tone="good" delay={120} label="Architecture Status"
            value={m.architecture} sub={`Composite architecture score ${m.architectureScore}`} />
          <BoardCard icon={Gauge} tone={m.confidence >= 70 ? 'info' : 'warn'} delay={160} label="Current Confidence"
            value={`${m.confidence}%`} sub={`Promotion probability ${m.promotionProbability}%`} />
          <BoardCard icon={ShieldCheck} tone="good" delay={200} label="Governance Status"
            value={m.governance} sub="Zero breaches · promotion locked behind gates" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Section 2 — Executive Briefing ---------------- */

function BriefBlock({
  title, icon: Icon, tone, body, delay,
}: { title: string; icon: React.ElementType; tone: string; body: string; delay: number }) {
  return (
    <div
      className="animate-fade-in rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-trading-gold/40"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}

export function ExecutiveBriefing({ m }: { m: BoardroomMetrics }) {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-trading-gold" /> Executive Briefing
        </CardTitle>
        <CardDescription className="text-xs">
          Board-level narrative prepared by the Director from metrics displayed elsewhere on this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <BriefBlock delay={0} title="Market Summary" icon={Activity} tone="text-trading-gold"
            body={`The book is trading a ${m.regime.toLowerCase()} regime at ${m.regimeConfidence}% detector confidence. Directional trend remains the highest-frequency state across the 90-day window at 38% of sessions, with High Volatility second. Volatility-linked specialists (VCB v1, Momentum Scalper v2) are the primary beneficiaries of the current state, while the Low Volatility sleeve remains staged and unfunded at 0% weight.`} />
          <BriefBlock delay={40} title="Portfolio Status" icon={HeartPulse} tone="text-trading-profit"
            body={`Composite portfolio health stands at ${m.health}/100 with a simulated profit factor of ${m.pf.toFixed(2)} and maximum drawdown of ${m.dd.toFixed(1)}% against a 3.0% ceiling. Move capture is ${m.capture.toFixed(0)}% and diversification scores ${m.diversification.toFixed(0)}. Capital efficiency remains the single metric on watch at 0.73 versus the 0.75 target.`} />
          <BriefBlock delay={80} title="Biggest Opportunity" icon={Sparkles} tone="text-trading-profit"
            body="Low-Vol Coiler v2 is approved at 64% capture and closes the 41% Low-Volatility coverage gap identified by Discovery Lab v2, but sits at 0% allocation. Activating it when ATR% falls below 0.35 is the highest-value unexercised improvement available to the book, worth an estimated +6 diversification points without adding directional exposure." />
          <BriefBlock delay={120} title="Biggest Risk" icon={AlertTriangle} tone="text-trading-loss"
            body="Bull-trend concentration has held at 42% for 19 consecutive days, above the 35% tolerance. 42% of the challenger's forward-trial lead originates from that single regime, so a trend-to-chop transition would compress the measured edge faster than the trial can re-baseline it." />
          <BriefBlock delay={160} title="Research Progress" icon={TrendingUp} tone="text-primary"
            body={`The specialist roster is complete at five certified strategies with 89% average regime coverage and readiness 94. Architecture review scored ${m.architectureScore} (${m.architecture}) with layers 1, 4 and 5 Mature. The Champion Forward Trial stands at day ${m.championDays} of 60 with 31 of the required 50 trades and a promotion probability of ${m.promotionProbability}%.`} />
          <BriefBlock delay={200} title="Recommended Action" icon={ArrowRight} tone="text-trading-gold"
            body="Continue Observation. No production changes recommended. Hold the recommended book unchanged, let the forward trial reach its time and trade minimums, and re-review when Bull concentration falls inside the 35% tolerance or the 50-trade floor is met." />
        </div>
        <div className="rounded-xl border border-trading-gold/40 bg-trading-gold/5 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Board Recommendation</p>
          <p className="mt-1 text-2xl font-bold text-trading-gold">Continue Observation</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            No production changes recommended. Promotion remains locked behind governance gates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExecutiveBoardroom;
