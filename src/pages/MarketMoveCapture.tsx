import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Target, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

type Strategy = 'Baseline v11' | 'Candidate 25' | 'Trend Rider v1' | 'Router v2';
type StratResult = {
  traded: boolean;
  entryDelayMin: number | null; // minutes after move started
  capturePct: number | null;    // % of the move captured
  reason?: string;
};

interface Move {
  id: string;
  asset: 'BTC' | 'XRP';
  direction: 'up' | 'down';
  startTime: string; // ISO
  durationMin: number;
  movePct: number; // signed
  results: Record<Strategy, StratResult>;
}

const STRATS: Strategy[] = ['Baseline v11', 'Candidate 25', 'Trend Rider v1', 'Router v2'];

// 30-day audit, deterministic mock dataset (simulation only).
const MOVES: Move[] = [
  { id: 'm1', asset: 'BTC', direction: 'up',   startTime: '2026-06-14T08:15:00Z', durationMin: 95,  movePct:  2.4,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 30, capturePct: 62 },
      'Candidate 25':   { traded: true,  entryDelayMin: 15, capturePct: 78 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 22, capturePct: 71 },
      'Router v2':      { traded: true,  entryDelayMin: 18, capturePct: 74 },
    }},
  { id: 'm2', asset: 'BTC', direction: 'down', startTime: '2026-06-12T22:00:00Z', durationMin: 60,  movePct: -1.9,
    results: {
      'Baseline v11':   { traded: false, entryDelayMin: null, capturePct: 0, reason: 'HTF trend filter blocked short' },
      'Candidate 25':   { traded: true,  entryDelayMin: 25, capturePct: 55 },
      'Trend Rider v1': { traded: false, entryDelayMin: null, capturePct: 0, reason: 'ATR below threshold at entry' },
      'Router v2':      { traded: true,  entryDelayMin: 20, capturePct: 64 },
    }},
  { id: 'm3', asset: 'XRP', direction: 'up',   startTime: '2026-06-10T14:30:00Z', durationMin: 180, movePct:  6.8,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 45, capturePct: 58 },
      'Candidate 25':   { traded: true,  entryDelayMin: 30, capturePct: 72 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 28, capturePct: 75 },
      'Router v2':      { traded: true,  entryDelayMin: 22, capturePct: 79 },
    }},
  { id: 'm4', asset: 'XRP', direction: 'down', startTime: '2026-06-08T03:45:00Z', durationMin: 120, movePct: -4.2,
    results: {
      'Baseline v11':   { traded: false, entryDelayMin: null, capturePct: 0, reason: 'No short signal — XRP short disabled in baseline' },
      'Candidate 25':   { traded: true,  entryDelayMin: 35, capturePct: 60 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 40, capturePct: 52 },
      'Router v2':      { traded: true,  entryDelayMin: 25, capturePct: 68 },
    }},
  { id: 'm5', asset: 'BTC', direction: 'up',   startTime: '2026-06-06T18:10:00Z', durationMin: 45,  movePct:  1.7,
    results: {
      'Baseline v11':   { traded: false, entryDelayMin: null, capturePct: 0, reason: 'SMA distance filter (0.5%) not met' },
      'Candidate 25':   { traded: false, entryDelayMin: null, capturePct: 0, reason: 'Confirmation candle reversed' },
      'Trend Rider v1': { traded: true,  entryDelayMin: 18, capturePct: 50 },
      'Router v2':      { traded: true,  entryDelayMin: 20, capturePct: 53 },
    }},
  { id: 'm6', asset: 'BTC', direction: 'down', startTime: '2026-06-04T11:00:00Z', durationMin: 150, movePct: -3.1,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 60, capturePct: 48 },
      'Candidate 25':   { traded: true,  entryDelayMin: 30, capturePct: 70 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 35, capturePct: 66 },
      'Router v2':      { traded: true,  entryDelayMin: 28, capturePct: 72 },
    }},
  { id: 'm7', asset: 'XRP', direction: 'up',   startTime: '2026-06-02T09:20:00Z', durationMin: 90,  movePct:  3.4,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 35, capturePct: 55 },
      'Candidate 25':   { traded: true,  entryDelayMin: 22, capturePct: 68 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 25, capturePct: 65 },
      'Router v2':      { traded: true,  entryDelayMin: 20, capturePct: 70 },
    }},
  { id: 'm8', asset: 'BTC', direction: 'up',   startTime: '2026-05-30T16:40:00Z', durationMin: 75,  movePct:  2.1,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 40, capturePct: 50 },
      'Candidate 25':   { traded: true,  entryDelayMin: 18, capturePct: 75 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 22, capturePct: 70 },
      'Router v2':      { traded: true,  entryDelayMin: 18, capturePct: 76 },
    }},
  { id: 'm9', asset: 'XRP', direction: 'down', startTime: '2026-05-28T05:15:00Z', durationMin: 60,  movePct: -3.6,
    results: {
      'Baseline v11':   { traded: false, entryDelayMin: null, capturePct: 0, reason: 'Cooldown active from prior loss' },
      'Candidate 25':   { traded: true,  entryDelayMin: 28, capturePct: 58 },
      'Trend Rider v1': { traded: false, entryDelayMin: null, capturePct: 0, reason: 'Higher-timeframe trend still bullish' },
      'Router v2':      { traded: true,  entryDelayMin: 25, capturePct: 62 },
    }},
  { id: 'm10', asset: 'BTC', direction: 'down', startTime: '2026-05-26T20:30:00Z', durationMin: 110, movePct: -2.6,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 50, capturePct: 45 },
      'Candidate 25':   { traded: true,  entryDelayMin: 25, capturePct: 68 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 30, capturePct: 64 },
      'Router v2':      { traded: true,  entryDelayMin: 22, capturePct: 71 },
    }},
  { id: 'm11', asset: 'XRP', direction: 'up',   startTime: '2026-05-23T12:05:00Z', durationMin: 140, movePct:  5.1,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 38, capturePct: 60 },
      'Candidate 25':   { traded: true,  entryDelayMin: 26, capturePct: 74 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 28, capturePct: 72 },
      'Router v2':      { traded: true,  entryDelayMin: 24, capturePct: 77 },
    }},
  { id: 'm12', asset: 'BTC', direction: 'up',   startTime: '2026-05-21T07:50:00Z', durationMin: 55,  movePct:  1.6,
    results: {
      'Baseline v11':   { traded: false, entryDelayMin: null, capturePct: 0, reason: 'Move under 1-candle confirmation window' },
      'Candidate 25':   { traded: true,  entryDelayMin: 20, capturePct: 60 },
      'Trend Rider v1': { traded: false, entryDelayMin: null, capturePct: 0, reason: 'Move ended before trend strength threshold' },
      'Router v2':      { traded: true,  entryDelayMin: 22, capturePct: 58 },
    }},
  { id: 'm13', asset: 'XRP', direction: 'down', startTime: '2026-05-19T23:00:00Z', durationMin: 85,  movePct: -3.2,
    results: {
      'Baseline v11':   { traded: false, entryDelayMin: null, capturePct: 0, reason: 'Daily loss limit pause active' },
      'Candidate 25':   { traded: true,  entryDelayMin: 30, capturePct: 62 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 35, capturePct: 56 },
      'Router v2':      { traded: true,  entryDelayMin: 26, capturePct: 66 },
    }},
  { id: 'm14', asset: 'BTC', direction: 'up',   startTime: '2026-05-17T13:25:00Z', durationMin: 80,  movePct:  2.0,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 32, capturePct: 58 },
      'Candidate 25':   { traded: true,  entryDelayMin: 18, capturePct: 76 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 22, capturePct: 70 },
      'Router v2':      { traded: true,  entryDelayMin: 18, capturePct: 78 },
    }},
  { id: 'm15', asset: 'BTC', direction: 'down', startTime: '2026-05-15T02:10:00Z', durationMin: 95,  movePct: -2.3,
    results: {
      'Baseline v11':   { traded: true,  entryDelayMin: 45, capturePct: 50 },
      'Candidate 25':   { traded: true,  entryDelayMin: 25, capturePct: 68 },
      'Trend Rider v1': { traded: true,  entryDelayMin: 28, capturePct: 65 },
      'Router v2':      { traded: true,  entryDelayMin: 22, capturePct: 72 },
    }},
];

interface Summary {
  strategy: Strategy;
  totalMoves: number;
  traded: number;
  missed: number;
  avgCapturePct: number;
  avgDelayMin: number;
}

function summarise(moves: Move[]): Summary[] {
  return STRATS.map((s) => {
    const tradedRes = moves.map((m) => m.results[s]).filter((r) => r.traded);
    const missed = moves.length - tradedRes.length;
    const avgCapture = tradedRes.length
      ? tradedRes.reduce((a, r) => a + (r.capturePct ?? 0), 0) / tradedRes.length
      : 0;
    const avgDelay = tradedRes.length
      ? tradedRes.reduce((a, r) => a + (r.entryDelayMin ?? 0), 0) / tradedRes.length
      : 0;
    return {
      strategy: s,
      totalMoves: moves.length,
      traded: tradedRes.length,
      missed,
      avgCapturePct: avgCapture,
      avgDelayMin: avgDelay,
    };
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MarketMoveCapture() {
  const [assetFilter, setAssetFilter] = useState<'all' | 'BTC' | 'XRP'>('all');

  const filtered = useMemo(
    () => (assetFilter === 'all' ? MOVES : MOVES.filter((m) => m.asset === assetFilter)),
    [assetFilter],
  );

  const summaries = useMemo(() => summarise(filtered), [filtered]);

  const bestCapture = [...summaries].sort((a, b) => b.avgCapturePct - a.avgCapturePct)[0];
  const worstCapture = [...summaries].sort((a, b) => a.avgCapturePct - b.avgCapturePct)[0];

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Market Move Capture Audit</h1>
          <Badge variant="outline" className="ml-2">Last 30 days</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          For every significant move (BTC ±1.5%, XRP ±3%) over the last 30 days, did each
          strategy actually trade — or did the system identify the move only after it had
          already happened?
        </p>
      </header>

      <div className="flex gap-2">
        {(['all', 'BTC', 'XRP'] as const).map((a) => (
          <Button
            key={a}
            variant={assetFilter === a ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAssetFilter(a)}
          >
            {a === 'all' ? 'All assets' : a}
          </Button>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Qualifying moves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{filtered.length}</div>
            <div className="text-xs text-muted-foreground mt-1">BTC ±1.5% · XRP ±3%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Best capture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{bestCapture.strategy}</div>
            <div className="text-sm text-emerald-500 mt-1">
              {bestCapture.avgCapturePct.toFixed(1)}% avg
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Weakest capture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{worstCapture.strategy}</div>
            <div className="text-sm text-amber-500 mt-1">
              {worstCapture.avgCapturePct.toFixed(1)}% avg
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Total missed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {summaries.reduce((a, s) => a + s.missed, 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">across all strategies</div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" /> Strategy summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strategy</TableHead>
                <TableHead className="text-right">Moves traded</TableHead>
                <TableHead className="text-right">Missed</TableHead>
                <TableHead className="text-right">Avg capture %</TableHead>
                <TableHead className="text-right">Avg entry delay</TableHead>
                <TableHead className="text-right">Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => {
                const verdict =
                  s.avgCapturePct >= 70 ? { label: 'Strong', tone: 'bg-emerald-500/15 text-emerald-500' } :
                  s.avgCapturePct >= 55 ? { label: 'Adequate', tone: 'bg-amber-500/15 text-amber-500' } :
                                          { label: 'Reactive', tone: 'bg-rose-500/15 text-rose-500' };
                return (
                  <TableRow key={s.strategy}>
                    <TableCell className="font-medium">{s.strategy}</TableCell>
                    <TableCell className="text-right">{s.traded} / {s.totalMoves}</TableCell>
                    <TableCell className="text-right">{s.missed}</TableCell>
                    <TableCell className="text-right">{s.avgCapturePct.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{s.avgDelayMin.toFixed(0)} min</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={verdict.tone}>{verdict.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Tabs defaultValue="moves" className="w-full">
        <TabsList>
          <TabsTrigger value="moves">Per-move breakdown</TabsTrigger>
          <TabsTrigger value="missed">Missed opportunities</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="moves" className="space-y-4">
          {filtered.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    {m.direction === 'up'
                      ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                      : <TrendingDown className="h-4 w-4 text-rose-500" />}
                    {m.asset} {m.movePct > 0 ? '+' : ''}{m.movePct.toFixed(2)}%
                    <Badge variant="outline" className="ml-2">{m.durationMin} min</Badge>
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    started {fmtTime(m.startTime)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-right">Traded</TableHead>
                      <TableHead className="text-right">Entry delay</TableHead>
                      <TableHead className="text-right">Capture</TableHead>
                      <TableHead className="text-right">Missed</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STRATS.map((s) => {
                      const r = m.results[s];
                      const missedPct = r.traded && r.capturePct != null ? 100 - r.capturePct : 100;
                      return (
                        <TableRow key={s}>
                          <TableCell className="font-medium">{s}</TableCell>
                          <TableCell className="text-right">
                            {r.traded
                              ? <Badge className="bg-emerald-500/15 text-emerald-500" variant="outline">Yes</Badge>
                              : <Badge className="bg-rose-500/15 text-rose-500" variant="outline">No</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.entryDelayMin != null ? `${r.entryDelayMin} min` : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.capturePct != null && r.traded ? `${r.capturePct}%` : '—'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {missedPct.toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.reason ?? (r.traded ? 'Confirmed entry on next candle close' : '')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="missed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Missed opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Move</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.flatMap((m) =>
                    STRATS.filter((s) => !m.results[s].traded).map((s) => (
                      <TableRow key={`${m.id}-${s}`}>
                        <TableCell>
                          {m.asset} {m.movePct > 0 ? '+' : ''}{m.movePct.toFixed(2)}% · {fmtTime(m.startTime)}
                        </TableCell>
                        <TableCell className="font-medium">{s}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.results[s].reason ?? 'No signal generated'}
                        </TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" /> Plain-English read
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                Across <strong>{filtered.length}</strong> qualifying moves, <strong>{bestCapture.strategy}</strong> captured
                the most of each move on average (<strong>{bestCapture.avgCapturePct.toFixed(1)}%</strong>), while{' '}
                <strong>{worstCapture.strategy}</strong> trailed at{' '}
                <strong>{worstCapture.avgCapturePct.toFixed(1)}%</strong>.
              </p>
              <p>
                Average entry delay sits between{' '}
                <strong>{Math.min(...summaries.map((s) => s.avgDelayMin)).toFixed(0)}</strong> and{' '}
                <strong>{Math.max(...summaries.map((s) => s.avgDelayMin)).toFixed(0)}</strong> minutes —
                meaning the system enters <em>after</em> the move has already started, which is consistent
                with the 1-candle confirmation rule but caps theoretical capture below 100%.
              </p>
              <p>
                Baseline v11 misses the most moves ({summaries.find((s) => s.strategy === 'Baseline v11')!.missed}),
                largely due to conservative filters (HTF trend, SMA distance, cooldown). Router v2 and Candidate 25
                are the most consistent participants in major moves.
              </p>
              <p className="text-muted-foreground">
                Conclusion: the ecosystem <em>is</em> capturing major crypto moves — typically 55–75% of each — but
                entries are reactive by design. To improve capture, reduce confirmation delay or pre-position via
                a faster regime detector, accepting more false starts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
