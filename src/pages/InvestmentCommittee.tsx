import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, ArrowUpRight, ArrowDownRight, Minus, FileText, Calendar,
  TrendingUp, Shield, Crown,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Investment Committee
// Plain-English explanations behind every Portfolio Manager allocation move.
// Mirrors the allocation set produced by Portfolio Manager v1 (Balanced mode).
// ─────────────────────────────────────────────────────────────────────────────

type Status = 'Approved' | 'Champion';
type Direction = 'up' | 'down' | 'flat';

type Member = {
  id: string;
  name: string;
  flavor: 'baseline' | 'balanced' | 'trend' | 'sideways' | 'router';
  status: Status;
  allocPrev: number;
  allocNow: number;
  confidence: number;
  regimeFit: number;
  recentPnl: number;
  riskScore: number; // 0-100, lower = safer
  reason: string;
};

const FLAVOR_COLOR: Record<Member['flavor'], string> = {
  baseline: 'hsl(220 10% 55%)',
  balanced: 'hsl(210 90% 60%)',
  trend:    'hsl(35 95% 55%)',
  sideways: 'hsl(160 70% 45%)',
  router:   'hsl(280 80% 65%)',
};

const MEMBERS: Member[] = [
  {
    id: 'rtr1', name: 'Router v1', flavor: 'router', status: 'Approved',
    allocPrev: 28, allocNow: 30, confidence: 84, regimeFit: 74, recentPnl: 1008, riskScore: 38,
    reason: 'Router v1 led the championship in Sharpe-like score for the third consecutive week. Increased +2% to take the largest slice.',
  },
  {
    id: 'tr1',  name: 'Trend Rider v1', flavor: 'trend', status: 'Approved',
    allocPrev: 15, allocNow: 22, confidence: 76, regimeFit: 82, recentPnl: 892, riskScore: 52,
    reason: 'Trend strength held above the 25 ADX threshold for 5 consecutive sessions and HTF alignment averaged 71. Increased +7% to capture the active trend.',
  },
  {
    id: 'c25',  name: 'Candidate 25', flavor: 'balanced', status: 'Approved',
    allocPrev: 22, allocNow: 18, confidence: 72, regimeFit: 68, recentPnl: 845, riskScore: 42,
    reason: 'Moderate-trend regime share fell from 45% to 38% week-over-week. Reduced −4% to make room for the trend specialist.',
  },
  {
    id: 'mr1',  name: 'Mean Reversion v1', flavor: 'sideways', status: 'Approved',
    allocPrev: 18, allocNow: 10, confidence: 61, regimeFit: 48, recentPnl: 438, riskScore: 34,
    reason: 'Sideways opportunity score dropped from 64 to 48 as ATR expanded. Reduced −8% — sideways edge does not hold in expanding-volatility regimes.',
  },
  {
    id: 'base', name: 'Baseline v11', flavor: 'baseline', status: 'Champion',
    allocPrev: 12, allocNow: 15, confidence: 88, regimeFit: 62, recentPnl: 198, riskScore: 28,
    reason: 'Champion status with the lowest risk score in the pool. Increased +3% as a stability anchor while specialists rotate.',
  },
];

const CASH_PREV = 5;
const CASH_NOW = 5;

const fmtUsd = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(0)}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function direction(prev: number, now: number, eps = 0.5): Direction {
  if (now - prev > eps) return 'up';
  if (prev - now > eps) return 'down';
  return 'flat';
}

function DeltaBadge({ prev, now }: { prev: number; now: number }) {
  const d = direction(prev, now);
  const delta = now - prev;
  if (d === 'flat') {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  const up = d === 'up';
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${up ? 'text-trading-profit' : 'text-trading-loss'}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}

const DAILY_NOTES = [
  { time: 'Today · 09:00', body: 'Trend Rider raised to 22% (+7%) after 5 consecutive sessions of ADX > 25. Mean Reversion trimmed to 10% (−8%) — sideways opportunity score fell from 64 to 48.' },
  { time: 'Today · 09:00', body: 'Baseline v11 nudged to 15% (+3%) as a low-risk anchor while specialist rotations are active. Cash reserve unchanged at 5%.' },
  { time: 'Yesterday',     body: 'Router v1 retained the largest slice on the back of strong Sharpe-like score; no allocation change required.' },
  { time: '2 days ago',    body: 'Volatility quality dropped on XRP. Mean Reversion confidence flagged for review; no allocation change yet.' },
];

const WEEKLY_NOTES = [
  { week: 'Week of Jun 9', body: 'Regime distribution shifted toward stronger trends (38% → 45%). Trend Rider gained the most allocation across the week (+7%).' },
  { week: 'Week of Jun 9', body: 'Mean Reversion underperformed its regime-fit forecast for two consecutive weeks. Committee voted to halve its allocation rather than retire it — sideways regimes may return.' },
  { week: 'Week of Jun 2', body: 'Router v1 maintained Best Overall in the championship for 7 straight days; allocation increased by 2% with no change to risk weight.' },
];

export default function InvestmentCommittee() {
  const totalNow = useMemo(() => MEMBERS.reduce((s, m) => s + m.allocNow, 0) + CASH_NOW, []);
  const ups = MEMBERS.filter((m) => direction(m.allocPrev, m.allocNow) === 'up');
  const downs = MEMBERS.filter((m) => direction(m.allocPrev, m.allocNow) === 'down');

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Investment Committee
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Every allocation move from the Portfolio Manager comes with a plain-English rationale. Daily and weekly meeting notes are persisted for audit.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Calendar className="h-3 w-3" /> Last meeting: today 09:00
        </Badge>
      </div>

      {/* Committee summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard
          icon={<ArrowUpRight className="h-4 w-4 text-trading-profit" />}
          label="Allocations raised"
          value={`${ups.length} strateg${ups.length === 1 ? 'y' : 'ies'}`}
          detail={ups.map((u) => u.name).join(', ') || '—'}
        />
        <SummaryCard
          icon={<ArrowDownRight className="h-4 w-4 text-trading-loss" />}
          label="Allocations reduced"
          value={`${downs.length} strateg${downs.length === 1 ? 'y' : 'ies'}`}
          detail={downs.map((u) => u.name).join(', ') || '—'}
        />
        <SummaryCard
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
          label="Cash reserve"
          value={`${CASH_NOW}%`}
          detail={CASH_NOW === CASH_PREV ? 'Unchanged — regime stable' : `Changed from ${CASH_PREV}%`}
        />
      </div>

      {/* Member table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Committee Members</CardTitle>
          <CardDescription className="text-xs">
            Each member is an approved strategy. The committee re-weights allocations daily based on confidence, regime fit and recent performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Strategy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Allocation</TableHead>
                  <TableHead className="text-right">Δ</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="text-right">Regime Fit</TableHead>
                  <TableHead className="text-right">Recent PnL</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {MEMBERS.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium" style={{ color: FLAVOR_COLOR[m.flavor] }}>{m.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 text-[10px] ${m.status === 'Champion' ? 'text-primary border-primary/40' : 'text-trading-profit border-trading-profit/40'}`}>
                        {m.status === 'Champion' && <Crown className="h-3 w-3" />}
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={m.allocNow * 2} className="h-1.5 w-16" />
                        <span className="tabular-nums w-10 text-right font-medium">{m.allocNow}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><DeltaBadge prev={m.allocPrev} now={m.allocNow} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={m.confidence} className="h-1.5 w-12" />
                        <span className="tabular-nums w-8 text-right">{m.confidence}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={m.regimeFit} className="h-1.5 w-12" />
                        <span className="tabular-nums w-8 text-right">{m.regimeFit}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${m.recentPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>{fmtUsd(m.recentPnl)}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.riskScore}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="text-muted-foreground">Cash Reserve</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-medium tabular-nums">{CASH_NOW}%</TableCell>
                  <TableCell className="text-right"><DeltaBadge prev={CASH_PREV} now={CASH_NOW} /></TableCell>
                  <TableCell colSpan={4} className="text-muted-foreground">Buffer against regime transition shocks</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="text-[10px] text-muted-foreground mt-2 text-right">Total allocated: {totalNow}%</div>
          </div>
        </CardContent>
      </Card>

      {/* Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Committee Decisions
          </CardTitle>
          <CardDescription className="text-xs">
            Plain-English rationale for every allocation move at this morning's meeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MEMBERS.map((m) => {
            const d = direction(m.allocPrev, m.allocNow);
            const Icon = d === 'up' ? ArrowUpRight : d === 'down' ? ArrowDownRight : Minus;
            const tone = d === 'up' ? 'text-trading-profit' : d === 'down' ? 'text-trading-loss' : 'text-muted-foreground';
            return (
              <div key={m.id} className="rounded-md border border-border/60 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium" style={{ color: FLAVOR_COLOR[m.flavor] }}>{m.name}</span>
                  <span className={`inline-flex items-center gap-1 ${tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {m.allocPrev}% → <span className="font-semibold">{m.allocNow}%</span>
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{m.reason}</p>
              </div>
            );
          })}
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <span className="text-foreground font-medium">Cash reserve:</span>{' '}
            Held at {CASH_NOW}%. Regime stability score is 78 and no transition signals are firing — no need to raise the buffer this session.
          </div>
        </CardContent>
      </Card>

      {/* Meeting notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Meeting Notes
          </CardTitle>
          <CardDescription className="text-xs">Persisted summaries for audit and weekly review.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="space-y-2 mt-3">
              {DAILY_NOTES.map((n, i) => (
                <NoteRow key={i} time={n.time} body={n.body} />
              ))}
            </TabsContent>
            <TabsContent value="weekly" className="space-y-2 mt-3">
              {WEEKLY_NOTES.map((n, i) => (
                <NoteRow key={i} time={n.week} body={n.body} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {icon}{label}
        </div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground leading-snug">{detail}</div>
      </CardContent>
    </Card>
  );
}

function NoteRow({ time, body }: { time: string; body: string }) {
  return (
    <div className="flex gap-3 text-xs">
      <Badge variant="outline" className="h-fit shrink-0 text-[10px]">{time}</Badge>
      <p className="text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
