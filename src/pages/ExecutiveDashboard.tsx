import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Crown, CheckCircle2, FlaskConical, Archive, TrendingUp, TrendingDown,
  Shield, Trophy, BookOpen, Users, Gavel, Snowflake, Clock, Sparkles,
} from 'lucide-react';

const STATUS = [
  { label: 'Champion', count: 1, icon: Crown, tone: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { label: 'Approved', count: 4, icon: CheckCircle2, tone: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { label: 'Research', count: 7, icon: FlaskConical, tone: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { label: 'Retired', count: 9, icon: Archive, tone: 'text-muted-foreground', bg: 'bg-muted/40', border: 'border-border' },
];

const LEADERS = [
  { label: 'Highest PnL', value: '+$1,247', strategy: 'Trend Rider v1', icon: TrendingUp, tone: 'text-emerald-500' },
  { label: 'Highest PF', value: '2.14', strategy: 'Candidate 25', icon: Sparkles, tone: 'text-primary' },
  { label: 'Lowest DD', value: '1.4%', strategy: 'Baseline v11', icon: Shield, tone: 'text-sky-500' },
  { label: 'Champion Candidate', value: 'Router v2', strategy: 'PF 1.92 / DD 2.1%', icon: Crown, tone: 'text-yellow-500' },
];

const ALLOCATION = [
  { name: 'Baseline v11', pct: 30, tone: 'bg-primary' },
  { name: 'Candidate 25', pct: 20, tone: 'bg-emerald-500' },
  { name: 'Trend Rider v1', pct: 20, tone: 'bg-sky-500' },
  { name: 'Mean Reversion v1', pct: 15, tone: 'bg-violet-500' },
  { name: 'Router v1', pct: 10, tone: 'bg-amber-500' },
  { name: 'Cash Reserve', pct: 5, tone: 'bg-muted' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Router v2', pnl: '+$1,184', pf: '1.92', dd: '2.1%' },
  { rank: 2, name: 'Trend Rider v1', pnl: '+$1,247', pf: '1.78', dd: '2.6%' },
  { rank: 3, name: 'Candidate 25', pnl: '+$968', pf: '2.14', dd: '2.4%' },
  { rank: 4, name: 'Baseline v11', pnl: '+$842', pf: '1.71', dd: '1.4%' },
  { rank: 5, name: 'Router v1', pnl: '+$705', pf: '1.58', dd: '2.9%' },
  { rank: 6, name: 'Mean Reversion v1', pnl: '+$612', pf: '1.64', dd: '2.2%' },
  { rank: 7, name: 'Router v2.1 (Research)', pnl: '+$905', pf: '1.62', dd: '3.4%' },
];

const JOURNAL = [
  { date: 'Jun 16', text: 'Router v2.1 forked from Router v2 following Trade Frequency Audit (−10% threshold).', tone: 'text-primary' },
  { date: 'Jun 12', text: 'Committee increased Trend Rider allocation 15% → 20%.', tone: 'text-emerald-500' },
  { date: 'Jun 10', text: 'Router v2 overtook Router v1 in Championship Arena.', tone: 'text-primary' },
  { date: 'Jun 08', text: 'Baseline v11 promoted to Champion.', tone: 'text-yellow-500' },
  { date: 'Jun 05', text: 'Mean Reversion v1 approved after meeting gate.', tone: 'text-emerald-500' },
];

export default function ExecutiveDashboard() {
  const systemScore = 87;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One-page overview of the entire research ecosystem.
          </p>
        </div>
        <Card className="min-w-[220px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">System Score</span>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">Healthy</Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-emerald-500">{systemScore}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <Progress value={systemScore} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Research Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS.map((s) => (
          <Card key={s.label} className={`${s.border} ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-md bg-background/50 ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Leaders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Current Leaders
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LEADERS.map((l) => (
              <div key={l.label} className="rounded-md border border-border bg-card/40 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <l.icon className={`h-3.5 w-3.5 ${l.tone}`} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l.label}</span>
                </div>
                <p className={`text-lg font-semibold ${l.tone}`}>{l.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{l.strategy}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Portfolio Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Portfolio Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Portfolio PnL</p>
                <p className="text-emerald-500 font-semibold">+$1,032</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Portfolio DD</p>
                <p className="font-semibold">2.2%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Cash Reserve</p>
                <p className="font-semibold">5%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Active</p>
                <p className="font-semibold">5 strategies</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Allocation</p>
              <div className="flex h-2 w-full overflow-hidden rounded">
                {ALLOCATION.map((a) => (
                  <div key={a.name} className={a.tone} style={{ width: `${a.pct}%` }} title={`${a.name} ${a.pct}%`} />
                ))}
              </div>
              <div className="space-y-1 pt-1">
                {ALLOCATION.map((a) => (
                  <div key={a.name} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-sm ${a.tone}`} />
                      {a.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Governance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="h-4 w-4 text-violet-500" /> Governance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Awaiting promotion
              </span>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500">2</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Gavel className="h-3.5 w-3.5" /> Under review
              </span>
              <Badge variant="outline" className="border-sky-500/40 text-sky-500">3</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Snowflake className="h-3.5 w-3.5" /> Frozen
              </span>
              <Badge variant="outline" className="border-primary/40 text-primary">5</Badge>
            </div>
            <Separator />
            <p className="text-[11px] text-muted-foreground">
              Router v2 next: 4 days until promotion eligibility (28/30 days).
            </p>
          </CardContent>
        </Card>

        {/* Championship */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Championship Leaderboard
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">Next review in 4d</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {LEADERBOARD.map((r) => (
                <div key={r.name} className="grid grid-cols-12 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 text-sm">
                  <div className="col-span-1">
                    <Badge variant={r.rank === 1 ? 'default' : 'outline'} className="h-5 w-5 justify-center p-0 text-[10px]">
                      {r.rank}
                    </Badge>
                  </div>
                  <div className="col-span-5 font-medium">{r.name}</div>
                  <div className="col-span-2 text-right text-emerald-500 tabular-nums">{r.pnl}</div>
                  <div className="col-span-2 text-right tabular-nums text-muted-foreground">PF {r.pf}</div>
                  <div className="col-span-2 text-right tabular-nums text-muted-foreground">DD {r.dd}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiment Watchlist */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-sky-500" /> Experiment Watchlist
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-sky-500/40 text-sky-500">Live Experiment</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 pr-4">Strategy</th>
                  <th className="text-right pb-2 px-3">Days</th>
                  <th className="text-right pb-2 px-3">Trades</th>
                  <th className="text-right pb-2 px-3">PnL</th>
                  <th className="text-right pb-2 px-3">PF</th>
                  <th className="text-right pb-2 px-3">Max DD</th>
                  <th className="text-right pb-2 pl-3">Rank</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2.5 pr-4 font-medium">Router v2 (Control)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">28</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">39</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-500">+$773</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">1.71</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">3.1%</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums font-semibold">1</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium">Router v2.1 (Fork)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">12</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">18</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-500">+$905</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">1.62</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">3.4%</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums font-semibold">7</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* PnL Difference — green when v2.1 > v2 */}
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PnL Difference</p>
              <p className="text-lg font-semibold text-emerald-500">+$132</p>
              <p className="text-[11px] text-emerald-500/80">v2.1 ahead</p>
            </div>
            {/* PF Difference — red when v2.1 < v2 */}
            <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PF Difference</p>
              <p className="text-lg font-semibold text-red-500">-0.09</p>
              <p className="text-[11px] text-red-500/80">v2 ahead</p>
            </div>
            {/* DD Difference — red when v2.1 > v2 */}
            <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">DD Difference</p>
              <p className="text-lg font-semibold text-red-500">+0.3%</p>
              <p className="text-[11px] text-red-500/80">v2.1 riskier</p>
            </div>
            {/* Rank Difference — red when v2.1 rank > v2 rank */}
            <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rank Difference</p>
              <p className="text-lg font-semibold text-red-500">-6</p>
              <p className="text-[11px] text-red-500/80">v2 ahead</p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Green = challenger outperforming · Red = control outperforming · v2.1 is +17% PnL but trades off PF and DD.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Journal Highlights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Journal Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {JOURNAL.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-[11px] text-muted-foreground tabular-nums w-12 shrink-0 pt-0.5">{e.date}</span>
                  <span className={e.tone}>{e.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Committee Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" /> Committee Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald-500 mb-1">Latest Decision · Jun 12</p>
              <p className="leading-relaxed">
                Trend Rider raised <span className="text-emerald-500 font-medium">+5%</span> after 5 consecutive sessions
                of ADX &gt; 25. Mean Reversion reduced <span className="text-red-500 font-medium">−5%</span> on declining
                sideways opportunity score. Cash reserve held at 5%.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-border p-2 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Raised</p>
                <p className="text-emerald-500 font-semibold">2</p>
              </div>
              <div className="rounded-md border border-border p-2 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Reduced</p>
                <p className="text-red-500 font-semibold">1</p>
              </div>
              <div className="rounded-md border border-border p-2 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Held</p>
                <p className="font-semibold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
