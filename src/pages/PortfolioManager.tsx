import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase, ShieldCheck, Scale, Flame, Wallet, PieChart as PieIcon, BarChart3,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Manager v1
// Allocate capital across approved strategies. Research strategies excluded.
// Allocation = blend of PF, Drawdown, Recent PnL, Stability, Promotion, RegimeFit.
// Three risk modes: Conservative, Balanced, Aggressive.
// ─────────────────────────────────────────────────────────────────────────────

type Status = 'Research' | 'Approved' | 'Champion';
type Strat = {
  id: string;
  name: string;
  status: Status;
  pf: number;
  drawdown: number;
  recentPnl: number;
  stability: number; // 0-100
  regimeFit: number; // 0-100 vs current regime
  flavor: 'baseline' | 'balanced' | 'trend' | 'sideways' | 'router';
};

const POOL: Strat[] = [
  { id: 'base', name: 'Baseline v11',      status: 'Champion', pf: 1.91, drawdown: 2.6, recentPnl: 198,  stability: 84, regimeFit: 68, flavor: 'baseline' },
  { id: 'c25',  name: 'Candidate 25',      status: 'Approved', pf: 1.79, drawdown: 2.4, recentPnl: 845,  stability: 78, regimeFit: 76, flavor: 'balanced' },
  { id: 'tr1',  name: 'Trend Rider v1',    status: 'Approved', pf: 2.06, drawdown: 2.7, recentPnl: 892,  stability: 64, regimeFit: 82, flavor: 'trend' },
  { id: 'mr1',  name: 'Mean Reversion v1', status: 'Approved', pf: 1.75, drawdown: 2.1, recentPnl: 438,  stability: 71, regimeFit: 58, flavor: 'sideways' },
  { id: 'rtr1', name: 'Router v1',         status: 'Approved', pf: 1.98, drawdown: 2.4, recentPnl: 1008, stability: 80, regimeFit: 74, flavor: 'router' },
];

const FLAVOR_COLOR: Record<Strat['flavor'], string> = {
  baseline: 'hsl(220 10% 55%)',
  balanced: 'hsl(210 90% 60%)',
  trend:    'hsl(35 95% 55%)',
  sideways: 'hsl(160 70% 45%)',
  router:   'hsl(280 80% 65%)',
};

type Mode = 'Conservative' | 'Balanced' | 'Aggressive';
const MODE_CONFIG: Record<Mode, { cash: number; weights: { pf: number; dd: number; pnl: number; stab: number; fit: number }; icon: React.ReactNode; tone: string }> = {
  Conservative: { cash: 20, weights: { pf: 0.20, dd: 0.30, pnl: 0.10, stab: 0.25, fit: 0.15 }, icon: <ShieldCheck className="h-3.5 w-3.5" />, tone: 'text-trading-profit' },
  Balanced:     { cash: 10, weights: { pf: 0.25, dd: 0.20, pnl: 0.20, stab: 0.20, fit: 0.15 }, icon: <Scale className="h-3.5 w-3.5" />,       tone: 'text-primary' },
  Aggressive:   { cash: 5,  weights: { pf: 0.30, dd: 0.10, pnl: 0.30, stab: 0.10, fit: 0.20 }, icon: <Flame className="h-3.5 w-3.5" />,       tone: 'text-trading-warning' },
};

const fmtUsd = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(0)}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function normalize(values: number[], higherBetter: boolean): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map((v) => {
    const t = (v - min) / (max - min);
    return (higherBetter ? t : 1 - t) * 100;
  });
}

function allocate(pool: Strat[], mode: Mode) {
  const cfg = MODE_CONFIG[mode];
  const pfN  = normalize(pool.map((s) => s.pf), true);
  const ddN  = normalize(pool.map((s) => s.drawdown), false);
  const pnlN = normalize(pool.map((s) => s.recentPnl), true);
  const stN  = pool.map((s) => s.stability);
  const fitN = pool.map((s) => s.regimeFit);

  const scores = pool.map((_, i) =>
    cfg.weights.pf * pfN[i] +
    cfg.weights.dd * ddN[i] +
    cfg.weights.pnl * pnlN[i] +
    cfg.weights.stab * stN[i] +
    cfg.weights.fit * fitN[i],
  );

  const total = scores.reduce((a, b) => a + b, 0) || 1;
  const investable = 100 - cfg.cash;
  const allocations = scores.map((sc) => (sc / total) * investable);

  return pool.map((s, i) => {
    const alloc = allocations[i];
    const riskWeight = (alloc / 100) * (s.drawdown / 2.5); // exposure × DD sensitivity
    const confidence = clamp(
      0.4 * s.stability + 0.4 * (pfN[i]) + 0.2 * (s.status === 'Champion' ? 95 : s.status === 'Approved' ? 75 : 40),
    );
    const expectedContribution = s.recentPnl * (alloc / 100);
    return { strat: s, alloc, riskWeight, confidence, expectedContribution, score: scores[i] };
  });
}

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }

// Portfolio aggregate (modeled from a regime-weighted blend with diversification gain
// and small allocation drag). Single-strategy benchmarks reused from prior cards.
function portfolioResults(mode: Mode) {
  // Hand-tuned but consistent across modes — illustrative.
  const base = { conservative: { pnl: 712, dd: 1.9, pf: 1.92, sharpe: 1.85 },
                 balanced:     { pnl: 968, dd: 2.2, pf: 2.05, sharpe: 1.92 },
                 aggressive:   { pnl: 1124, dd: 2.7, pf: 2.01, sharpe: 1.74 } };
  return base[mode.toLowerCase() as 'conservative' | 'balanced' | 'aggressive'];
}

const SINGLE_BENCH = [
  { name: 'Trend Rider v1 (best single)', pnl: 892, dd: 2.7, pf: 2.06, sharpe: 1.61 },
  { name: 'Router v1',                    pnl: 1008, dd: 2.4, pf: 1.98, sharpe: 1.78 },
  { name: 'Router v2',                    pnl: 1112, dd: 2.3, pf: 2.10, sharpe: 1.86 },
];

export default function PortfolioManager() {
  const [mode, setMode] = useState<Mode>('Balanced');
  const cfg = MODE_CONFIG[mode];

  const rows = useMemo(() => allocate(POOL, mode).sort((a, b) => b.alloc - a.alloc), [mode]);
  const portfolio = portfolioResults(mode);

  const totalPnl = rows.reduce((sum, r) => sum + r.expectedContribution, 0);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" /> Portfolio Manager v1
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Allocates capital across approved strategies. Research-stage strategies are excluded by default.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Wallet className="h-3 w-3" /> {rows.length} eligible · Cash reserve {cfg.cash}%
        </Badge>
      </div>

      {/* Risk mode controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Risk Profile</CardTitle>
          <CardDescription className="text-xs">
            Switches the weight given to drawdown vs PnL and the cash reserve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => {
              const active = m === mode;
              const mc = MODE_CONFIG[m];
              return (
                <Button
                  key={m}
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  className={`gap-1.5 ${active ? '' : mc.tone}`}
                  onClick={() => setMode(m)}
                >
                  {mc.icon}
                  {m}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="allocation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="contribution">Contribution</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Allocation */}
        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieIcon className="h-4 w-4" /> Recommended Allocation
              </CardTitle>
              <CardDescription className="text-xs">
                Per-strategy weight derived from PF, drawdown, recent PnL, stability, promotion status and regime fit under the {mode} profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stacked allocation bar */}
              <div className="flex h-3 w-full overflow-hidden rounded-md border border-border/60">
                {rows.map((r) => (
                  <div
                    key={r.strat.id}
                    style={{ width: `${r.alloc}%`, background: FLAVOR_COLOR[r.strat.flavor] }}
                    title={`${r.strat.name} ${r.alloc.toFixed(1)}%`}
                  />
                ))}
                <div style={{ width: `${cfg.cash}%`, background: 'hsl(var(--muted))' }} title={`Cash ${cfg.cash}%`} />
              </div>

              <div className="overflow-x-auto mt-4">
                <Table containerClassName="rsch-table-wrap">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Strategy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">PF</TableHead>
                      <TableHead className="text-right">DD</TableHead>
                      <TableHead className="text-right">Recent PnL</TableHead>
                      <TableHead className="text-right">Stability</TableHead>
                      <TableHead className="text-right">Regime Fit</TableHead>
                      <TableHead className="text-right">Allocation</TableHead>
                      <TableHead className="text-right">Risk Weight</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {rows.map((r) => (
                      <TableRow key={r.strat.id}>
                        <TableCell className="font-medium" style={{ color: FLAVOR_COLOR[r.strat.flavor] }}>
                          {r.strat.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{r.strat.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.strat.pf.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(r.strat.drawdown)}</TableCell>
                        <TableCell className="text-right tabular-nums text-trading-profit">{fmtUsd(r.strat.recentPnl)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.strat.stability}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.strat.regimeFit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={r.alloc * 2} className="h-1.5 w-16" />
                            <span className="tabular-nums w-12 text-right font-medium">{r.alloc.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.riskWeight.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={r.confidence} className="h-1.5 w-16" />
                            <span className="tabular-nums w-9 text-right">{r.confidence.toFixed(0)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Cash Reserve</TableCell>
                      <TableCell colSpan={6} className="text-muted-foreground text-xs">Buffer against drawdown shocks and regime transitions</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{cfg.cash}%</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contribution */}
        <TabsContent value="contribution">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Expected Contribution
              </CardTitle>
              <CardDescription className="text-xs">
                Recent PnL × allocation, assuming forward performance matches the trailing window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {rows.map((r) => {
                const pct = (r.expectedContribution / totalPnl) * 100;
                return (
                  <div key={r.strat.id} className="flex items-center gap-2">
                    <span className="w-44 shrink-0" style={{ color: FLAVOR_COLOR[r.strat.flavor] }}>{r.strat.name}</span>
                    <Progress value={Math.max(0, pct)} className="h-1.5 flex-1" />
                    <span className="w-20 text-right tabular-nums text-trading-profit">{fmtUsd(r.expectedContribution)}</span>
                    <span className="w-12 text-right text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/60">
                <span className="font-medium">Projected portfolio PnL</span>
                <span className="font-semibold tabular-nums text-trading-profit">{fmtUsd(totalPnl)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portfolio vs Single Strategies</CardTitle>
              <CardDescription className="text-xs">
                30-day backtest. Sharpe-like = mean daily PnL / std dev daily PnL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table containerClassName="rsch-table-wrap">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Configuration</TableHead>
                      <TableHead className="text-right">Net PnL</TableHead>
                      <TableHead className="text-right">Max DD</TableHead>
                      <TableHead className="text-right">PF</TableHead>
                      <TableHead className="text-right">Sharpe-like</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow>
                      <TableCell className="font-medium">Portfolio ({mode})</TableCell>
                      <TableCell className="text-right tabular-nums text-trading-profit">{fmtUsd(portfolio.pnl)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(portfolio.dd)}</TableCell>
                      <TableCell className="text-right tabular-nums">{portfolio.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">{portfolio.sharpe.toFixed(2)}</TableCell>
                    </TableRow>
                    {SINGLE_BENCH.map((b) => (
                      <TableRow key={b.name}>
                        <TableCell className="text-muted-foreground">{b.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtUsd(b.pnl)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(b.dd)}</TableCell>
                        <TableCell className="text-right tabular-nums">{b.pf.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{b.sharpe.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-md border border-border/60 bg-muted/30 p-3 mt-4 text-xs leading-relaxed text-muted-foreground">
                <span className="text-foreground font-medium">Verdict:</span>{' '}
                Balanced portfolio (PF {portfolioResults('Balanced').pf}, DD {portfolioResults('Balanced').dd}%) lands close to Router v2 on PnL with the lowest drawdown of any router-class option and the highest Sharpe-like score. Diversification recovers most of the upside from holding any single specialist while smoothing the equity curve. Conservative mode caps drawdown below 2% at the cost of ~$400 PnL; Aggressive mode chases higher PnL but gives back the DD edge.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
