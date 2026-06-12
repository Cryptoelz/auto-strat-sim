import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Gavel, ShieldCheck, CheckCircle2, XCircle, Lock, Crown, Sparkles, AlertTriangle,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Promotion Review Board
// Status ladder: Research → Candidate → Approved → Champion
// Minimum gate: 30d, 20 trades, PF>1.5, DD<3%
// Gold gate:    60d, 50 trades, PF>1.8, DD<3%
// Readiness 0–100 = weighted average of (days, trades, PF, DD) against Gold.
// ─────────────────────────────────────────────────────────────────────────────

type Status = 'Research' | 'Candidate' | 'Approved' | 'Champion';
type Strategy = {
  id: string;
  name: string;
  days: number;
  trades: number;
  netPnl: number;
  pf: number;
  drawdown: number;
  winRate: number;
  stability: number; // 0-100
  regimes: { name: string; pct: number; pf: number }[];
  status: Status;
};

const STRATS: Strategy[] = [
  {
    id: 'base', name: 'Baseline v11',
    days: 92, trades: 58, netPnl: 612, pf: 1.91, drawdown: 2.6, winRate: 59.3, stability: 84,
    regimes: [
      { name: 'Trend',    pct: 38, pf: 2.10 },
      { name: 'Moderate', pct: 42, pf: 1.85 },
      { name: 'Sideways', pct: 20, pf: 1.55 },
    ],
    status: 'Champion',
  },
  {
    id: 'c25', name: 'Candidate 25',
    days: 41, trades: 53, netPnl: 1018, pf: 1.79, drawdown: 2.4, winRate: 58.1, stability: 78,
    regimes: [
      { name: 'Trend',    pct: 35, pf: 1.92 },
      { name: 'Moderate', pct: 45, pf: 1.84 },
      { name: 'Sideways', pct: 20, pf: 1.48 },
    ],
    status: 'Candidate',
  },
  {
    id: 'tr1', name: 'Trend Rider v1',
    days: 32, trades: 25, netPnl: 892, pf: 2.06, drawdown: 2.7, winRate: 51.2, stability: 64,
    regimes: [
      { name: 'Trend',    pct: 70, pf: 2.35 },
      { name: 'Moderate', pct: 22, pf: 1.65 },
      { name: 'Sideways', pct: 8,  pf: 0.92 },
    ],
    status: 'Candidate',
  },
  {
    id: 'mr1', name: 'Mean Reversion v1',
    days: 31, trades: 22, netPnl: 438, pf: 1.75, drawdown: 2.1, winRate: 64.7, stability: 71,
    regimes: [
      { name: 'Trend',    pct: 12, pf: 0.95 },
      { name: 'Moderate', pct: 28, pf: 1.42 },
      { name: 'Sideways', pct: 60, pf: 2.14 },
    ],
    status: 'Candidate',
  },
  {
    id: 'rtr1', name: 'Router v1',
    days: 32, trades: 34, netPnl: 1008, pf: 1.98, drawdown: 2.4, winRate: 56.2, stability: 80,
    regimes: [
      { name: 'Trend',    pct: 38, pf: 2.18 },
      { name: 'Moderate', pct: 42, pf: 1.86 },
      { name: 'Sideways', pct: 20, pf: 1.60 },
    ],
    status: 'Candidate',
  },
  {
    id: 'rtr2', name: 'Router v2',
    days: 21, trades: 24, netPnl: 718, pf: 2.10, drawdown: 2.3, winRate: 58.7, stability: 76,
    regimes: [
      { name: 'Trend',    pct: 35, pf: 2.20 },
      { name: 'Moderate', pct: 38, pf: 1.90 },
      { name: 'Sideways', pct: 22, pf: 2.05 },
      { name: 'Uncertain', pct: 5, pf: 1.40 },
    ],
    status: 'Research',
  },
];

const MIN_GATE = { days: 30, trades: 20, pf: 1.5, dd: 3.0 };
const GOLD_GATE = { days: 60, trades: 50, pf: 1.8, dd: 3.0 };

const fmtUsd = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(0)}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function readiness(s: Strategy): number {
  // Each component scored 0–100 against the Gold standard.
  const daysScore = clamp((s.days / GOLD_GATE.days) * 100);
  const tradesScore = clamp((s.trades / GOLD_GATE.trades) * 100);
  const pfScore = clamp(((s.pf - 1) / (GOLD_GATE.pf - 1)) * 100);
  const ddScore = s.drawdown >= MIN_GATE.dd ? 0 : clamp(100 - (s.drawdown / MIN_GATE.dd) * 100 + 50);
  // Weights: PF & PnL evidence > duration > drawdown floor
  return 0.30 * daysScore + 0.25 * tradesScore + 0.30 * pfScore + 0.15 * ddScore;
}

function meets(s: Strategy, g: typeof MIN_GATE) {
  return s.days >= g.days && s.trades >= g.trades && s.pf > g.pf && s.drawdown < g.dd;
}

function statusBadge(status: Status) {
  const map: Record<Status, { tone: string; icon: React.ReactNode }> = {
    Research:  { tone: 'text-muted-foreground border-border',                       icon: <Sparkles className="h-3 w-3" /> },
    Candidate: { tone: 'text-trading-warning border-trading-warning/40',            icon: <AlertTriangle className="h-3 w-3" /> },
    Approved:  { tone: 'text-trading-profit border-trading-profit/40',              icon: <ShieldCheck className="h-3 w-3" /> },
    Champion:  { tone: 'text-primary border-primary/40',                            icon: <Crown className="h-3 w-3" /> },
  };
  const cfg = map[status];
  return <Badge variant="outline" className={`gap-1 text-[10px] ${cfg.tone}`}>{cfg.icon}{status}</Badge>;
}

function GateCell({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit inline" />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-trading-loss inline" />
  );
}

export default function PromotionReviewBoard() {
  const rows = useMemo(
    () =>
      STRATS.map((s) => {
        const r = readiness(s);
        const minOk = meets(s, MIN_GATE);
        const goldOk = meets(s, GOLD_GATE);
        let recommendation: Status = s.status;
        if (s.status === 'Research' && minOk) recommendation = 'Candidate';
        else if (s.status === 'Candidate' && minOk) recommendation = 'Approved';
        if (goldOk && s.stability >= 75) recommendation = 'Champion';
        return { s, r, minOk, goldOk, recommendation };
      }).sort((a, b) => b.r - a.r),
    [],
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" /> Promotion Review Board
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Evidence-based promotion ladder: Research → Candidate → Approved → Champion. No strategy advances without meeting every numeric gate.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Lock className="h-3 w-3" /> Manual approval required after gates pass
        </Badge>
      </div>

      {/* Gates summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <GateCard title="Minimum Gate" icon={<ShieldCheck className="h-4 w-4 text-trading-warning" />} gate={MIN_GATE} />
        <GateCard title="Gold Standard" icon={<Crown className="h-4 w-4 text-primary" />} gate={GOLD_GATE} />
      </div>

      {/* Main board */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategy Review</CardTitle>
          <CardDescription className="text-xs">
            Promotion Readiness = 30% days · 25% trades · 30% PF · 15% drawdown floor, all measured against the Gold Standard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Strategy</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Net PnL</TableHead>
                  <TableHead className="text-right">PF</TableHead>
                  <TableHead className="text-right">DD</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Stability</TableHead>
                  <TableHead className="text-center">Min</TableHead>
                  <TableHead className="text-center">Gold</TableHead>
                  <TableHead className="text-right">Readiness</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {rows.map(({ s, r, minOk, goldOk, recommendation }) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.days}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.trades}</TableCell>
                    <TableCell className={`text-right tabular-nums ${s.netPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                      {fmtUsd(s.netPnl)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.pf.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPct(s.drawdown)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPct(s.winRate)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.stability}</TableCell>
                    <TableCell className="text-center"><GateCell ok={minOk} /></TableCell>
                    <TableCell className="text-center"><GateCell ok={goldOk} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={r} className="h-1.5 w-16" />
                        <span className="tabular-nums w-9 text-right">{r.toFixed(0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-right">
                      {recommendation === s.status ? (
                        <span className="text-muted-foreground">Hold</span>
                      ) : (
                        <span className="text-trading-profit font-medium">→ {recommendation}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Per-strategy regime + reasoning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map(({ s, r, minOk, goldOk, recommendation }) => (
          <Card key={s.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">{s.name}</CardTitle>
                  <CardDescription className="text-[11px]">
                    Readiness {r.toFixed(0)} · Stability {s.stability} · {s.days}d / {s.trades} trades
                  </CardDescription>
                </div>
                {statusBadge(s.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="text-muted-foreground">Regime Breakdown</div>
                {s.regimes.map((r) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <span className="w-24 shrink-0">{r.name}</span>
                    <Progress value={r.pct} className="h-1.5 flex-1" />
                    <span className="tabular-nums w-10 text-right">{r.pct}%</span>
                    <span className="tabular-nums w-14 text-right text-muted-foreground">PF {r.pf.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 leading-relaxed">
                <div className="font-medium mb-1">Board reasoning</div>
                <div className="text-muted-foreground">
                  {minOk ? 'Minimum gate met. ' : 'Minimum gate not yet met. '}
                  {goldOk ? 'Gold Standard met. ' : 'Gold Standard not yet met. '}
                  {recommendation === s.status
                    ? 'No status change recommended at this time.'
                    : `Recommend advancing to ${recommendation} pending operator approval.`}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GateCard({
  title, icon, gate,
}: { title: string; icon: React.ReactNode; gate: typeof MIN_GATE }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-xs">
        <GateChip label="Days live" value={`≥ ${gate.days}`} />
        <GateChip label="Trades"    value={`≥ ${gate.trades}`} />
        <GateChip label="Profit Factor" value={`> ${gate.pf.toFixed(1)}`} />
        <GateChip label="Drawdown"  value={`< ${gate.dd.toFixed(1)}%`} />
      </CardContent>
    </Card>
  );
}

function GateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
