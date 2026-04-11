/**
 * Session Analytics — Performance review across archived paper trading sessions.
 */
import { useState, useMemo } from 'react';
import { loadSessionHistory, ArchivedSession } from '@/lib/sessionHistory';
import {
  summarizeSession, compareSessions, findBestWorst, generateInsights,
  SessionSummary, Insight,
} from '@/lib/sessionAnalytics';
import { formatCurrency } from '@/lib/performance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle,
  CheckCircle2, Info, ArrowUpDown, Trophy, Skull, Scale,
  ArrowLeftRight, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SessionAnalytics() {
  const [sessions] = useState<ArchivedSession[]>(loadSessionHistory);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  const summaries = useMemo(() => sessions.map(summarizeSession), [sessions]);
  const { best, worst } = useMemo(() => findBestWorst(summaries), [summaries]);
  const insights = useMemo(() => generateInsights(summaries), [summaries]);

  const comparison = useMemo(() => {
    if (!compareA || !compareB) return null;
    const a = summaries.find(s => s.id === compareA);
    const b = summaries.find(s => s.id === compareB);
    if (!a || !b) return null;
    return compareSessions(a, b);
  }, [compareA, compareB, summaries]);

  if (sessions.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Session Analytics
          </h1>
          <p className="text-xs text-muted-foreground">No archived sessions. Run paper trading sessions and reset to archive them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Session Analytics
        </h1>
        <p className="text-xs text-muted-foreground">
          Performance patterns across {sessions.length} archived session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs">Compare</TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs">Breakdown</TabsTrigger>
          <TabsTrigger value="report" className="text-xs">Report</TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Aggregate stats */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <AggCard label="Total Sessions" value={String(summaries.length)} icon={BarChart3} />
            <AggCard
              label="Cumulative PnL"
              value={`${summaries.reduce((s, x) => s + x.totalPnl, 0) >= 0 ? '+' : ''}${formatCurrency(summaries.reduce((s, x) => s + x.totalPnl, 0))}`}
              icon={TrendingUp}
              color={summaries.reduce((s, x) => s + x.totalPnl, 0) >= 0 ? 'text-trading-profit' : 'text-trading-loss'}
            />
            <AggCard
              label="Avg Win Rate"
              value={`${(summaries.reduce((s, x) => s + x.winRate, 0) / summaries.length).toFixed(1)}%`}
              icon={Target}
            />
            <AggCard
              label="Avg Max DD"
              value={`${(summaries.reduce((s, x) => s + x.maxDrawdown, 0) / summaries.length).toFixed(2)}%`}
              icon={AlertTriangle}
              color="text-trading-loss"
            />
          </div>

          {/* Best & Worst */}
          <div className="grid gap-4 md:grid-cols-2">
            {best && <HighlightCard title="Best Session" icon={Trophy} summary={best} variant="positive" />}
            {worst && <HighlightCard title="Worst Session" icon={Skull} summary={worst} variant="negative" />}
          </div>

          {/* Session Table */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px]">
                      <TableHead className="h-8 px-3">Date</TableHead>
                      <TableHead className="h-8 px-3">Trades</TableHead>
                      <TableHead className="h-8 px-3 text-right">PnL</TableHead>
                      <TableHead className="h-8 px-3">Win Rate</TableHead>
                      <TableHead className="h-8 px-3">PF</TableHead>
                      <TableHead className="h-8 px-3">Max DD</TableHead>
                      <TableHead className="h-8 px-3">L / S</TableHead>
                      <TableHead className="h-8 px-3">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map(s => (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell className="py-2 px-3 font-medium">{s.date}</TableCell>
                        <TableCell className="py-2 px-3">{s.totalTrades}</TableCell>
                        <TableCell className={cn('py-2 px-3 text-right font-mono font-semibold', s.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                          {s.totalPnl >= 0 ? '+' : ''}{formatCurrency(s.totalPnl)}
                        </TableCell>
                        <TableCell className="py-2 px-3">{s.winRate.toFixed(1)}%</TableCell>
                        <TableCell className="py-2 px-3">{s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}</TableCell>
                        <TableCell className="py-2 px-3 text-trading-loss">{s.maxDrawdown.toFixed(2)}%</TableCell>
                        <TableCell className="py-2 px-3">{s.longTrades} / {s.shortTrades}</TableCell>
                        <TableCell className="py-2 px-3 text-muted-foreground">{s.durationMinutes}m</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Compare ─────────────────────────────────── */}
        <TabsContent value="compare" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-primary" /> Side-by-Side Comparison
              </CardTitle>
              <CardDescription className="text-xs">Select two sessions to compare</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Session A</p>
                  <div className="space-y-1">
                    {summaries.map(s => (
                      <Button
                        key={s.id}
                        variant={compareA === s.id ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-between text-xs h-8"
                        onClick={() => setCompareA(s.id)}
                      >
                        <span>{s.label}</span>
                        <span className={cn('font-mono', s.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                          {s.totalPnl >= 0 ? '+' : ''}{formatCurrency(s.totalPnl)}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Session B</p>
                  <div className="space-y-1">
                    {summaries.map(s => (
                      <Button
                        key={s.id}
                        variant={compareB === s.id ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-between text-xs h-8"
                        onClick={() => setCompareB(s.id)}
                      >
                        <span>{s.label}</span>
                        <span className={cn('font-mono', s.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                          {s.totalPnl >= 0 ? '+' : ''}{formatCurrency(s.totalPnl)}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {comparison && (
                <div className="border-t border-border/50 pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[10px]">
                        <TableHead className="h-8 px-3">Metric</TableHead>
                        <TableHead className="h-8 px-3">Session A</TableHead>
                        <TableHead className="h-8 px-3">Session B</TableHead>
                        <TableHead className="h-8 px-3">Delta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <CompareRow label="PnL" a={formatCurrency(comparison.sessionA.totalPnl)} b={formatCurrency(comparison.sessionB.totalPnl)} delta={comparison.pnlDelta} format="currency" />
                      <CompareRow label="Win Rate" a={`${comparison.sessionA.winRate.toFixed(1)}%`} b={`${comparison.sessionB.winRate.toFixed(1)}%`} delta={comparison.winRateDelta} format="percent" />
                      <CompareRow label="Max DD" a={`${comparison.sessionA.maxDrawdown.toFixed(2)}%`} b={`${comparison.sessionB.maxDrawdown.toFixed(2)}%`} delta={comparison.drawdownDelta} format="percent" invert />
                      <CompareRow label="Profit Factor" a={comparison.sessionA.profitFactor.toFixed(2)} b={comparison.sessionB.profitFactor.toFixed(2)} delta={comparison.profitFactorDelta} format="number" />
                      <CompareRow label="Trades" a={String(comparison.sessionA.totalTrades)} b={String(comparison.sessionB.totalTrades)} delta={comparison.sessionB.totalTrades - comparison.sessionA.totalTrades} format="number" />
                      <CompareRow label="Long PnL" a={formatCurrency(comparison.sessionA.longPnl)} b={formatCurrency(comparison.sessionB.longPnl)} delta={comparison.sessionB.longPnl - comparison.sessionA.longPnl} format="currency" />
                      <CompareRow label="Short PnL" a={formatCurrency(comparison.sessionA.shortPnl)} b={formatCurrency(comparison.sessionB.shortPnl)} delta={comparison.sessionB.shortPnl - comparison.sessionA.shortPnl} format="currency" />
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Breakdown ───────────────────────────────── */}
        <TabsContent value="breakdown" className="space-y-4">
          {/* PnL by Asset */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">PnL by Asset (All Sessions)</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetBreakdownTable summaries={summaries} />
            </CardContent>
          </Card>

          {/* Long vs Short */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" /> Long vs Short Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <DirectionCard
                  direction="Long"
                  trades={summaries.reduce((s, x) => s + x.longTrades, 0)}
                  pnl={summaries.reduce((s, x) => s + x.longPnl, 0)}
                  avgWinRate={summaries.filter(s => s.longTrades > 0).length > 0
                    ? summaries.filter(s => s.longTrades > 0).reduce((s, x) => s + x.longWinRate, 0) / summaries.filter(s => s.longTrades > 0).length
                    : 0}
                />
                <DirectionCard
                  direction="Short"
                  trades={summaries.reduce((s, x) => s + x.shortTrades, 0)}
                  pnl={summaries.reduce((s, x) => s + x.shortPnl, 0)}
                  avgWinRate={summaries.filter(s => s.shortTrades > 0).length > 0
                    ? summaries.filter(s => s.shortTrades > 0).reduce((s, x) => s + x.shortWinRate, 0) / summaries.filter(s => s.shortTrades > 0).length
                    : 0}
                />
              </div>
            </CardContent>
          </Card>

          {/* Drawdown by Session */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Drawdown by Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summaries.map(s => {
                  const maxDD = Math.max(...summaries.map(x => x.maxDrawdown), 1);
                  return (
                    <div key={s.id} className="flex items-center gap-3 text-xs">
                      <span className="w-28 truncate text-muted-foreground">{s.label}</span>
                      <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
                        <div
                          className={cn('h-full rounded', s.maxDrawdown > 3 ? 'bg-destructive/70' : 'bg-trading-loss/50')}
                          style={{ width: `${Math.min((s.maxDrawdown / maxDD) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-mono text-trading-loss">{s.maxDrawdown.toFixed(2)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Exit Reasons */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Exit Reasons (All Sessions)</CardTitle>
            </CardHeader>
            <CardContent>
              <ExitReasonsTable summaries={summaries} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Report ──────────────────────────────────── */}
        <TabsContent value="report" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Performance Report
              </CardTitle>
              <CardDescription className="text-xs">
                Plain-English analysis of your trading patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <InsightRow key={i} insight={insight} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Per-session win rate & PF table */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Session-by-Session Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px]">
                      <TableHead className="h-8 px-3">Session</TableHead>
                      <TableHead className="h-8 px-3">Win Rate</TableHead>
                      <TableHead className="h-8 px-3">Profit Factor</TableHead>
                      <TableHead className="h-8 px-3 text-right">PnL</TableHead>
                      <TableHead className="h-8 px-3">Long WR</TableHead>
                      <TableHead className="h-8 px-3">Short WR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map(s => (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell className="py-2 px-3 font-medium">{s.label}</TableCell>
                        <TableCell className="py-2 px-3">{s.winRate.toFixed(1)}%</TableCell>
                        <TableCell className="py-2 px-3">{s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}</TableCell>
                        <TableCell className={cn('py-2 px-3 text-right font-mono', s.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                          {s.totalPnl >= 0 ? '+' : ''}{formatCurrency(s.totalPnl)}
                        </TableCell>
                        <TableCell className="py-2 px-3">{s.longWinRate.toFixed(1)}%</TableCell>
                        <TableCell className="py-2 px-3">{s.shortTrades > 0 ? `${s.shortWinRate.toFixed(1)}%` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AggCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color?: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
        </div>
        <p className={cn('text-lg font-bold', color)}>{value}</p>
      </CardContent>
    </Card>
  );
}

function HighlightCard({ title, icon: Icon, summary, variant }: {
  title: string; icon: React.ElementType; summary: SessionSummary; variant: 'positive' | 'negative';
}) {
  const isPositive = variant === 'positive';
  return (
    <Card className={cn('border-border/50', isPositive ? 'bg-trading-profit/5' : 'bg-trading-loss/5')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={cn('h-4 w-4', isPositive ? 'text-trading-profit' : 'text-trading-loss')} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground block">Date</span>{summary.date}</div>
          <div>
            <span className="text-muted-foreground block">PnL</span>
            <span className={cn('font-mono font-semibold', summary.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
              {summary.totalPnl >= 0 ? '+' : ''}{formatCurrency(summary.totalPnl)}
            </span>
          </div>
          <div><span className="text-muted-foreground block">Win Rate</span>{summary.winRate.toFixed(1)}%</div>
          <div><span className="text-muted-foreground block">Trades</span>{summary.totalTrades} ({summary.longTrades}L / {summary.shortTrades}S)</div>
          <div><span className="text-muted-foreground block">Max DD</span>{summary.maxDrawdown.toFixed(2)}%</div>
          <div><span className="text-muted-foreground block">PF</span>{summary.profitFactor === Infinity ? '∞' : summary.profitFactor.toFixed(2)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompareRow({ label, a, b, delta, format, invert }: {
  label: string; a: string; b: string; delta: number; format: 'currency' | 'percent' | 'number'; invert?: boolean;
}) {
  const isGood = invert ? delta < 0 : delta > 0;
  const deltaStr = format === 'currency'
    ? `${delta >= 0 ? '+' : ''}${formatCurrency(delta)}`
    : format === 'percent'
    ? `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`
    : `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;

  return (
    <TableRow className="text-xs">
      <TableCell className="py-2 px-3 font-medium">{label}</TableCell>
      <TableCell className="py-2 px-3 font-mono">{a}</TableCell>
      <TableCell className="py-2 px-3 font-mono">{b}</TableCell>
      <TableCell className={cn('py-2 px-3 font-mono font-semibold', isGood ? 'text-trading-profit' : delta === 0 ? 'text-muted-foreground' : 'text-trading-loss')}>
        {deltaStr}
      </TableCell>
    </TableRow>
  );
}

function DirectionCard({ direction, trades, pnl, avgWinRate }: {
  direction: string; trades: number; pnl: number; avgWinRate: number;
}) {
  return (
    <div className="rounded-lg border border-border/50 p-4 space-y-2">
      <div className="flex items-center gap-2">
        {direction === 'Long' ? <TrendingUp className="h-4 w-4 text-trading-profit" /> : <TrendingDown className="h-4 w-4 text-trading-loss" />}
        <span className="text-sm font-semibold">{direction}</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">{trades} trades</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground block">Total PnL</span>
          <span className={cn('font-mono font-semibold', pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Avg Win Rate</span>
          <span className="font-mono">{avgWinRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function AssetBreakdownTable({ summaries }: { summaries: SessionSummary[] }) {
  const assets = new Set<string>();
  for (const s of summaries) {
    for (const a of Object.keys(s.pnlByAsset)) assets.add(a);
  }
  const assetList = Array.from(assets);

  const totals = assetList.map(asset => ({
    asset,
    pnl: summaries.reduce((s, x) => s + (x.pnlByAsset[asset] || 0), 0),
    trades: summaries.reduce((s, x) => s + (x.tradesByAsset[asset] || 0), 0),
  }));

  return (
    <Table>
      <TableHeader>
        <TableRow className="text-[10px]">
          <TableHead className="h-8 px-3">Asset</TableHead>
          <TableHead className="h-8 px-3">Total Trades</TableHead>
          <TableHead className="h-8 px-3 text-right">Total PnL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {totals.map(row => (
          <TableRow key={row.asset} className="text-xs">
            <TableCell className="py-2 px-3 font-mono font-medium">{row.asset}</TableCell>
            <TableCell className="py-2 px-3">{row.trades}</TableCell>
            <TableCell className={cn('py-2 px-3 text-right font-mono font-semibold', row.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
              {row.pnl >= 0 ? '+' : ''}{formatCurrency(row.pnl)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ExitReasonsTable({ summaries }: { summaries: SessionSummary[] }) {
  const reasons: Record<string, number> = {};
  for (const s of summaries) {
    for (const [r, c] of Object.entries(s.exitReasons)) {
      reasons[r] = (reasons[r] || 0) + c;
    }
  }
  const sorted = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, c]) => s + c, 0);

  const reasonLabels: Record<string, string> = {
    stop_loss: 'Stop Loss',
    take_profit: 'Take Profit',
    bullish_crossover: 'Bullish Crossover',
    bearish_crossover: 'Bearish Crossover',
    flip_to_long: 'Flip to Long',
    flip_to_short: 'Flip to Short',
    daily_loss_limit: 'Daily Loss Limit',
    consecutive_loss_limit: 'Consecutive Loss Limit',
  };

  return (
    <div className="space-y-2">
      {sorted.map(([reason, count]) => (
        <div key={reason} className="flex items-center gap-3 text-xs">
          <span className="w-36 truncate">{reasonLabels[reason] || reason}</span>
          <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
            <div className="h-full bg-primary/40 rounded" style={{ width: `${(count / total) * 100}%` }} />
          </div>
          <span className="w-10 text-right font-mono text-muted-foreground">{count}</span>
          <span className="w-12 text-right text-muted-foreground">{((count / total) * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const icons = {
    positive: <CheckCircle2 className="h-4 w-4 text-trading-profit shrink-0 mt-0.5" />,
    negative: <AlertTriangle className="h-4 w-4 text-trading-loss shrink-0 mt-0.5" />,
    neutral: <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />,
  };
  const bg = {
    positive: 'bg-trading-profit/5 border-trading-profit/20',
    negative: 'bg-trading-loss/5 border-trading-loss/20',
    neutral: 'bg-muted/20 border-border/50',
  };

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-3', bg[insight.type])}>
      {icons[insight.type]}
      <p className="text-sm">{insight.message}</p>
    </div>
  );
}
