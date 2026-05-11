/**
 * Trading Analytics Hub — Operator dashboard for Baseline v11.
 * Aggregates archived paper-trading sessions into charts, asset/regime
 * breakdowns, blocked-trade analysis, exports, and AI-style insights.
 */
import { useMemo, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { loadSessionHistory } from '@/lib/sessionHistory';
import { summarizeSession, findBestWorst } from '@/lib/sessionAnalytics';
import {
  computeAssetMetrics, computeRegimeMetrics, computeBlockedTradeMetrics,
  computeEquityCurve, computeSessionPnlSeries, generateHubInsights,
  exportSessionReportCsv, downloadCsv, archivedContextCoverage,
} from '@/lib/analyticsHub';
import {
  regimeDirectionMatrix, strategyRegimeMatrix, volatilityAssetMatrix,
  continuationVsCrossoverByRegime, convictionRangeMetrics,
  strongestRegimes, weakestForDirection, detectFailurePatterns,
  dangerousConditions, generateContextInsights,
} from '@/lib/contextIntelligence';
import { HeatmapMatrix } from '@/components/trading/HeatmapMatrix';
import { formatCurrency } from '@/lib/performance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Gauge, TrendingUp, TrendingDown, Target, AlertTriangle, Trophy,
  Skull, Download, Sparkles, Activity, Layers, Ban, Brain, Flame, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsHub() {
  const [sessions] = useState(loadSessionHistory);
  const summaries = useMemo(() => sessions.map(summarizeSession), [sessions]);
  const assetMetrics = useMemo(() => computeAssetMetrics(sessions), [sessions]);
  const regimeMetrics = useMemo(() => computeRegimeMetrics(sessions), [sessions]);
  const blockedMetrics = useMemo(() => computeBlockedTradeMetrics(sessions), [sessions]);
  const coverage = useMemo(() => archivedContextCoverage(sessions), [sessions]);
  const equityCurve = useMemo(() => computeEquityCurve(sessions), [sessions]);
  const sessionSeries = useMemo(() => computeSessionPnlSeries(summaries), [summaries]);
  const { best, worst } = useMemo(() => findBestWorst(summaries), [summaries]);
  const insights = useMemo(
    () => generateHubInsights(sessions, summaries, assetMetrics, regimeMetrics),
    [sessions, summaries, assetMetrics, regimeMetrics],
  );

  // ── Context Intelligence ──
  const regimeDirMatrix = useMemo(() => regimeDirectionMatrix(sessions), [sessions]);
  const stratRegMatrix = useMemo(() => strategyRegimeMatrix(sessions), [sessions]);
  const volAssetMatrix = useMemo(() => volatilityAssetMatrix(sessions), [sessions]);
  const cvcMatrix = useMemo(() => continuationVsCrossoverByRegime(sessions), [sessions]);
  const convBins = useMemo(() => convictionRangeMetrics(sessions), [sessions]);
  const strongRegimes = useMemo(() => strongestRegimes(sessions, 3), [sessions]);
  const weakLongs = useMemo(() => weakestForDirection(sessions, 'long', 2), [sessions]);
  const weakShorts = useMemo(() => weakestForDirection(sessions, 'short', 2), [sessions]);
  const failures = useMemo(() => detectFailurePatterns(sessions, 3), [sessions]);
  const warnings = useMemo(() => dangerousConditions(sessions), [sessions]);
  const ctxInsights = useMemo(() => generateContextInsights(sessions), [sessions]);

  const totalPnl = summaries.reduce((s, x) => s + x.totalPnl, 0);
  const avgWinRate = summaries.length > 0 ? summaries.reduce((s, x) => s + x.winRate, 0) / summaries.length : 0;
  const avgDd = summaries.length > 0 ? summaries.reduce((s, x) => s + x.maxDrawdown, 0) / summaries.length : 0;
  const totalTrades = summaries.reduce((s, x) => s + x.totalTrades, 0);

  const handleExport = () => {
    const csv = exportSessionReportCsv(sessions);
    downloadCsv(`analytics-hub-report-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  if (sessions.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Header />
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No archived sessions yet. Run paper trading and reset to populate the Analytics Hub.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
            Baseline v11
          </Badge>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Top metric cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <MetricCard
          label="Cumulative PnL"
          value={`${totalPnl >= 0 ? '+' : ''}${formatCurrency(totalPnl)}`}
          icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
          color={totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}
        />
        <MetricCard label="Sessions" value={String(sessions.length)} sub={`${totalTrades} trades`} icon={Layers} />
        <MetricCard label="Avg Win Rate" value={`${avgWinRate.toFixed(1)}%`} icon={Target} />
        <MetricCard
          label="Avg Max DD"
          value={`${avgDd.toFixed(2)}%`}
          icon={AlertTriangle}
          color={avgDd > 3 ? 'text-trading-loss' : 'text-trading-profit'}
          sub={avgDd > 3 ? 'above 3% target' : 'within target'}
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
          <TabsTrigger value="assets" className="text-xs">Assets</TabsTrigger>
          <TabsTrigger value="regimes" className="text-xs">Regimes</TabsTrigger>
          <TabsTrigger value="exits" className="text-xs">Trade Outcomes</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">Sessions</TabsTrigger>
          <TabsTrigger value="intelligence" className="text-xs gap-1">
            <Brain className="h-3 w-3" /> Intelligence
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs">AI Insights</TabsTrigger>
        </TabsList>

        {/* ── Performance: equity + drawdown + per-session PnL ── */}
        <TabsContent value="performance" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Equity Curve (trade-by-trade)
              </CardTitle>
              <CardDescription className="text-xs">
                Cumulative balance across all archived sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={equityCurve}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      fontSize: 11,
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#eq)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Drawdown Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                      formatter={(v: number) => `${v.toFixed(2)}%`}
                    />
                    <ReferenceLine y={3} stroke="hsl(var(--trading-loss))" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--trading-loss))" fill="hsl(var(--trading-loss))" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Session PnL</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sessionSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Bar dataKey="pnl">
                      {sessionSeries.map((p, i) => (
                        <Cell key={i} fill={p.pnl >= 0 ? 'hsl(var(--trading-profit))' : 'hsl(var(--trading-loss))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Best / Worst */}
          <div className="grid gap-4 md:grid-cols-2">
            {best && <BestWorstCard title="Best Session" icon={Trophy} session={best} positive />}
            {worst && <BestWorstCard title="Worst Session" icon={Skull} session={worst} positive={false} />}
          </div>
        </TabsContent>

        {/* ── Assets ── */}
        <TabsContent value="assets" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Win Rate & Profit Factor by Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={assetMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="asset" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="l" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="winRate" name="Win Rate %" fill="hsl(var(--primary))" />
                  <Bar yAxisId="r" dataKey="profitFactor" name="Profit Factor" fill="hsl(var(--trading-profit))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Per-Asset Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead className="h-8 px-3">Asset</TableHead>
                    <TableHead className="h-8 px-3">Trades</TableHead>
                    <TableHead className="h-8 px-3">Win Rate</TableHead>
                    <TableHead className="h-8 px-3">Profit Factor</TableHead>
                    <TableHead className="h-8 px-3 text-right">PnL</TableHead>
                    <TableHead className="h-8 px-3 text-right">Long PnL</TableHead>
                    <TableHead className="h-8 px-3 text-right">Short PnL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetMetrics.map(a => (
                    <TableRow key={a.asset} className="text-xs">
                      <TableCell className="py-2 px-3 font-medium">{a.asset}</TableCell>
                      <TableCell className="py-2 px-3">{a.trades}</TableCell>
                      <TableCell className="py-2 px-3">{a.winRate.toFixed(1)}%</TableCell>
                      <TableCell className="py-2 px-3">{a.profitFactor === Infinity ? '∞' : a.profitFactor.toFixed(2)}</TableCell>
                      <TableCell className={cn('py-2 px-3 text-right font-mono font-semibold', a.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                        {a.pnl >= 0 ? '+' : ''}{formatCurrency(a.pnl)}
                      </TableCell>
                      <TableCell className={cn('py-2 px-3 text-right font-mono', a.longPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                        {a.longPnl >= 0 ? '+' : ''}{formatCurrency(a.longPnl)}
                      </TableCell>
                      <TableCell className={cn('py-2 px-3 text-right font-mono', a.shortPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                        {a.shortPnl >= 0 ? '+' : ''}{formatCurrency(a.shortPnl)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Regimes ── */}
        <TabsContent value="regimes" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm">Regime Distribution & PnL</CardTitle>
                  <CardDescription className="text-xs">
                    {coverage.percent >= 100
                      ? 'Using archived per-trade regime context for all trades.'
                      : coverage.percent > 0
                        ? `Using archived regime for ${coverage.archived} trades; ${coverage.heuristic} legacy trades fall back to heuristic classification.`
                        : 'No archived per-trade regime yet — using heuristic classification (trade direction × outcome).'}
                  </CardDescription>
                </div>
                <Badge variant={coverage.percent >= 100 ? 'default' : coverage.percent > 0 ? 'secondary' : 'outline'} className="text-[10px]">
                  {coverage.percent.toFixed(0)}% archived context
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={regimeMetrics}
                      dataKey="trades"
                      nameKey="label"
                      outerRadius={80}
                      label={(e: { label: string; trades: number }) => `${e.label}: ${e.trades}`}
                      labelLine={false}
                    >
                      {regimeMetrics.map((r, i) => {
                        const colors = ['hsl(var(--trading-profit))', 'hsl(var(--trading-loss))', 'hsl(var(--muted-foreground))'];
                        return <Cell key={i} fill={colors[i]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {regimeMetrics.map(r => (
                    <div key={r.regime} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{r.label}</span>
                        <span className={cn('text-xs font-mono font-semibold', r.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                          {r.pnl >= 0 ? '+' : ''}{formatCurrency(r.pnl)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 text-[10px] text-muted-foreground gap-2">
                        <span>{r.trades} trades</span>
                        <span>{r.wins} wins</span>
                        <span>{r.winRate.toFixed(0)}% WR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Trade Outcomes / Blocked ── */}
        <TabsContent value="exits" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ban className="h-4 w-4 text-primary" /> Trade Exit & Outcome Analysis
              </CardTitle>
              <CardDescription className="text-xs">
                Frequency of each exit reason across all archived trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={blockedMetrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={130} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-3 space-y-1">
                {blockedMetrics.map(m => (
                  <div key={m.reason} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="capitalize">{m.reason}</span>
                    <span className="text-muted-foreground">{m.count} ({m.percent.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sessions table ── */}
        <TabsContent value="sessions" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Context Intelligence ── */}
        <TabsContent value="intelligence" className="space-y-4">
          {/* Dangerous conditions banner */}
          {warnings.length > 0 && (
            <Card className="border-trading-warning/40 bg-trading-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-trading-warning" /> Most Dangerous Conditions
                </CardTitle>
                <CardDescription className="text-xs">
                  Recurring contexts where the system loses money — candidates for filter rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-foreground/85">{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Strongest regimes + weakest long/short */}
          <div className="grid gap-4 md:grid-cols-3">
            <ConditionListCard
              title="Strongest Regimes"
              icon={Trophy}
              positive
              items={strongRegimes}
              empty="Not enough archived trades yet."
            />
            <ConditionListCard
              title="Weakest Conditions for Longs"
              icon={TrendingDown}
              items={weakLongs}
              empty="No qualifying long context yet."
            />
            <ConditionListCard
              title="Weakest Conditions for Shorts"
              icon={TrendingDown}
              items={weakShorts}
              empty="No qualifying short context yet."
            />
          </div>

          {/* Regime × Direction matrix */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Regime × Direction Performance
              </CardTitle>
              <CardDescription className="text-xs">PnL by entry regime and trade direction (color = signed PnL).</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapMatrix cells={regimeDirMatrix} rowLabel="Regime" colLabel="Direction" />
            </CardContent>
          </Card>

          {/* Continuation vs Crossover */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Continuation vs Crossover by Regime
              </CardTitle>
              <CardDescription className="text-xs">
                Continuation = closed at SL/TP. Crossover = closed via opposite-signal flip.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapMatrix cells={cvcMatrix} rowLabel="Regime" colLabel="Exit Style" />
            </CardContent>
          </Card>

          {/* Volatility × Asset */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" /> Volatility × Asset
              </CardTitle>
              <CardDescription className="text-xs">Which volatility tier each asset extracts edge from.</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapMatrix cells={volAssetMatrix} rowLabel="Volatility" colLabel="Asset" />
            </CardContent>
          </Card>

          {/* Strategy × Regime */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Strategy × Regime
              </CardTitle>
              <CardDescription className="text-xs">
                {stratRegMatrix.length === 0
                  ? 'No strategy attribution captured yet. Wire additional strategies to unlock this matrix.'
                  : 'Per-strategy regime fit. Becomes more informative as the agent runs multiple strategies.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapMatrix cells={stratRegMatrix} rowLabel="Strategy" colLabel="Regime" />
            </CardContent>
          </Card>

          {/* Conviction bins */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Conviction-Score Performance
              </CardTitle>
              <CardDescription className="text-xs">
                Trade outcomes grouped by conviction score band (requires agent-decision-engine to capture conviction at entry).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {convBins.every(b => b.trades === 0) ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  No conviction scores captured yet. The unified engine currently runs SMA-crossover signals directly; conviction-band analysis activates once the agent decision engine writes conviction to each trade.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {convBins.map(b => (
                    <div key={b.range} className="rounded-lg border border-border/50 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conviction {b.range}</div>
                      <div className={cn('text-base font-mono font-semibold mt-1', b.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                        {b.pnl >= 0 ? '+' : ''}{formatCurrency(b.pnl)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {b.trades}t · {b.winRate.toFixed(0)}% WR
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Failure patterns */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-trading-loss" /> Recurring Failure Patterns
              </CardTitle>
              <CardDescription className="text-xs">
                Context combinations that consistently lose money (≥3 trades, ≥60% loss rate).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failures.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No recurring failure patterns detected — the system has no systematic blind spots in archived context yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Pattern</TableHead>
                      <TableHead className="text-xs text-right">Trades</TableHead>
                      <TableHead className="text-xs text-right">Loss Rate</TableHead>
                      <TableHead className="text-xs text-right">Cumulative PnL</TableHead>
                      <TableHead className="text-xs text-right">Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failures.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{f.description}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{f.trades}</TableCell>
                        <TableCell className="text-xs text-right font-mono text-trading-loss">{f.lossRate.toFixed(0)}%</TableCell>
                        <TableCell className="text-xs text-right font-mono text-trading-loss">{formatCurrency(f.pnl)}</TableCell>
                        <TableCell className="text-xs text-right">
                          <Badge variant={f.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {f.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Plain-English context insights */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Context Intelligence — Plain-English Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Derived from archived per-trade context. Use to inform adaptive allocation research.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs">
                {ctxInsights.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI insights ── */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Plain-English Insights
              </CardTitle>
              <CardDescription className="text-xs">
                Auto-generated commentary on Baseline v11 stability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.map((line, i) => (
                  <li key={i} className="flex gap-3 text-xs leading-relaxed">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
        <Gauge className="h-5 w-5 text-primary" /> Analytics Hub
      </h1>
      <p className="text-xs text-muted-foreground">
        Long-term operator view of Baseline v11 performance and stability
      </p>
    </div>
  );
}

function MetricCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={cn('h-4 w-4', color || 'text-muted-foreground')} />
        </div>
        <p className={cn('text-base font-bold font-mono', color)}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BestWorstCard({
  title, icon: Icon, session, positive,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  session: ReturnType<typeof summarizeSession>;
  positive: boolean;
}) {
  return (
    <Card className={cn('border-border/50', positive ? 'border-l-4 border-l-trading-profit' : 'border-l-4 border-l-trading-loss')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={cn('h-4 w-4', positive ? 'text-trading-profit' : 'text-trading-loss')} /> {title}
        </CardTitle>
        <CardDescription className="text-xs">{session.label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Stat label="PnL" value={`${session.totalPnl >= 0 ? '+' : ''}${formatCurrency(session.totalPnl)}`} color={session.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'} />
          <Stat label="Win Rate" value={`${session.winRate.toFixed(1)}%`} />
          <Stat label="Max DD" value={`${session.maxDrawdown.toFixed(2)}%`} color="text-trading-loss" />
          <Stat label="Trades" value={String(session.totalTrades)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('font-mono font-semibold', color)}>{value}</p>
    </div>
  );
}
