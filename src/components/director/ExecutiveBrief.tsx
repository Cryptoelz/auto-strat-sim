import { Sun, Activity, Crown, AlertTriangle, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  regime: string;
  regimeConfidence: number;
  health: number;
  champion: string;
  largestRisk: string;
  opportunity: string;
  action: string;
  actionNote: string;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function Item({
  label, value, sub, icon: Icon, tone = 'neutral',
}: { label: string; value: string; sub?: string; icon: React.ElementType; tone?: 'good' | 'bad' | 'gold' | 'neutral' }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4 backdrop-blur transition-all duration-300 hover:border-trading-gold/40 hover:bg-background/60">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={cn(
        'mt-2 text-lg font-bold leading-tight',
        tone === 'good' && 'text-trading-profit',
        tone === 'bad' && 'text-trading-loss',
        tone === 'gold' && 'text-trading-gold',
      )}>{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function ExecutiveBrief({
  regime, regimeConfidence, health, champion, largestRisk, opportunity, action, actionNote,
}: Props) {
  const healthLabel = health >= 80 ? 'Healthy' : health >= 60 ? 'Stable' : 'Under Watch';
  return (
    <Card className="animate-fade-in overflow-hidden border-trading-gold/40 bg-gradient-to-br from-background via-card to-primary/10">
      <div className="h-1 w-full bg-gradient-to-r from-trading-gold via-primary to-trading-gold/10" />
      <CardContent className="p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-trading-gold" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-trading-gold">AI Executive Brief</p>
            </div>
            <h2 className="mt-1 bg-gradient-to-r from-trading-gold via-foreground to-primary bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-4xl">
              {greeting()}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}Chief Investment Officer briefing — simulated research book
            </p>
          </div>
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> OBSERVATION ONLY
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Item icon={Activity} label="Current Market" value={regime} sub={`Regime confidence ${regimeConfidence}%`} tone="gold" />
          <Item icon={Sparkles} label="Portfolio Status" value={healthLabel} sub={`Composite health ${health}/100`} tone={health >= 80 ? 'good' : 'neutral'} />
          <Item icon={Crown} label="Current Champion" value={champion} sub="Forward trial in progress — day 24 of 60" tone="gold" />
          <Item icon={AlertTriangle} label="Largest Risk" value={largestRisk} sub="Above the 35% concentration tolerance" tone="bad" />
          <Item icon={Sparkles} label="Greatest Opportunity" value={opportunity} sub="Staged for activation when ATR% < 0.35" tone="good" />
          <div className="rounded-xl border border-trading-gold/40 bg-trading-gold/5 p-4">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-trading-gold" />
              <p className="text-[10px] uppercase tracking-wider text-trading-gold">Recommended Action</p>
            </div>
            <p className="mt-2 text-lg font-bold text-trading-gold">{action}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{actionNote}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
