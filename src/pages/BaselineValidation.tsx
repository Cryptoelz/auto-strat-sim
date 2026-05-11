import { useMemo, useState, useEffect } from 'react';
import { loadSessionHistory } from '@/lib/sessionHistory';
import {
  validateAllCandidates,
  CANDIDATE_ASSETS,
  type BaselineValidationResult,
} from '@/lib/baselineValidation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Scale } from 'lucide-react';
import { DEFAULT_PORTFOLIO_CONFIG } from '@/types/portfolio';

const verdictMeta = {
  pass: { Icon: CheckCircle2, color: 'border-trading-profit/40 bg-trading-profit/5 text-trading-profit', label: 'PASS' },
  watch: { Icon: AlertTriangle, color: 'border-trading-warning/40 bg-trading-warning/5 text-trading-warning', label: 'WATCH' },
  fail: { Icon: XCircle, color: 'border-destructive/40 bg-destructive/10 text-destructive', label: 'FAIL' },
  insufficient_data: { Icon: HelpCircle, color: 'border-muted-foreground/30 bg-muted/30 text-muted-foreground', label: 'NEED DATA' },
} as const;

const METRIC_LABEL: Record<string, string> = {
  pnl: 'Total PnL ($)',
  profitFactor: 'Profit Factor',
  winRate: 'Win Rate (%)',
  maxDrawdown: 'Max Drawdown (%)',
  longPnl: 'Long PnL ($)',
  shortPnl: 'Short PnL ($)',
};

function fmt(metric: string, n: number): string {
  if (metric === 'profitFactor') return n.toFixed(2);
  if (metric === 'winRate' || metric === 'maxDrawdown') return n.toFixed(1) + '%';
  return '$' + n.toFixed(2);
}

export default function BaselineValidation() {
  const [sessions, setSessions] = useState(() => loadSessionHistory());
  useEffect(() => {
    const onStorage = () => setSessions(loadSessionHistory());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const results = useMemo(() => validateAllCandidates(sessions), [sessions]);
  const allocation = DEFAULT_PORTFOLIO_CONFIG.fixedAllocations;

  return (
    <div className="space-y-6 p-6">
      <header>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Baseline Validation</h1>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
            ETH / SOL vs BTC / XRP
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare new diversification candidates against the Baseline v11 reference set before scaling allocation.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Starting Allocation Plan</CardTitle>
          <CardDescription>Capital is not split equally. Diversification expands carefully.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {([
              { asset: 'BTCUSDT', role: 'Anchor (Baseline)' },
              { asset: 'ETHUSDT', role: 'Diversifier' },
              { asset: 'XRPUSDT', role: 'Legacy (Baseline)' },
              { asset: 'SOLUSDT', role: 'Probe' },
            ] as const).map(({ asset, role }) => (
              <div key={asset} className="rounded-md border bg-card/40 p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{role}</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{asset.replace('USDT', '')}</span>
                  <span className="font-mono text-lg">{allocation[asset]}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={CANDIDATE_ASSETS[0]} className="space-y-4">
        <TabsList>
          {results.map(r => {
            const v = verdictMeta[r.verdict];
            return (
              <TabsTrigger key={r.candidate} value={r.candidate}>
                {r.candidate.replace('USDT', '')} · {v.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {results.map(r => (
          <TabsContent key={r.candidate} value={r.candidate}>
            <ValidationReport result={r} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ValidationReport({ result }: { result: BaselineValidationResult }) {
  const v = verdictMeta[result.verdict];
  const { candidateReport: c, referenceReport: r } = result;

  return (
    <div className="space-y-4">
      <Card className={v.color}>
        <CardContent className="flex items-start gap-3 py-4">
          <v.Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold">{result.candidate}: {v.label}</div>
            <p className="mt-1 text-xs text-muted-foreground">{result.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{result.verdictReason}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryCard title={`${result.candidate} (candidate)`} report={c} />
        <SummaryCard title="BTC + XRP (baseline reference)" report={r} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Baseline Checks</CardTitle>
          <CardDescription>Each delta must remain healthy vs BTC/XRP.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 text-left">Metric</th>
                  <th className="py-1.5 text-right">Reference</th>
                  <th className="py-1.5 text-right">Candidate</th>
                  <th className="py-1.5 text-right">Δ</th>
                  <th className="py-1.5 text-left pl-3">Status / Note</th>
                </tr>
              </thead>
              <tbody>
                {result.deltas.map(d => (
                  <tr key={d.metric} className="border-b last:border-0">
                    <td className="py-1.5 font-medium">{METRIC_LABEL[d.metric]}</td>
                    <td className="py-1.5 text-right font-mono">{fmt(d.metric, d.reference)}</td>
                    <td className="py-1.5 text-right font-mono">{fmt(d.metric, d.candidate)}</td>
                    <td className={`py-1.5 text-right font-mono ${d.delta >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                      {d.delta >= 0 ? '+' : ''}{fmt(d.metric, d.delta)}
                    </td>
                    <td className="py-1.5 pl-3">
                      <Badge variant="outline" className={`mr-2 text-[10px] ${d.passes ? 'border-trading-profit/40 text-trading-profit' : 'border-trading-warning/40 text-trading-warning'}`}>
                        {d.passes ? 'OK' : 'WATCH'}
                      </Badge>
                      <span className="text-muted-foreground">{d.note}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Regime Performance</CardTitle>
          <CardDescription>Per-regime PnL and win rate, candidate vs reference.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 text-left">Regime</th>
                  <th className="py-1.5 text-right">Cand trades</th>
                  <th className="py-1.5 text-right">Cand WR</th>
                  <th className="py-1.5 text-right">Cand PnL</th>
                  <th className="py-1.5 text-right">Ref trades</th>
                  <th className="py-1.5 text-right">Ref WR</th>
                  <th className="py-1.5 text-right">Ref PnL</th>
                </tr>
              </thead>
              <tbody>
                {c.regimes.map((cr, i) => {
                  const rr = r.regimes[i];
                  return (
                    <tr key={cr.regime} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">{cr.label}</td>
                      <td className="py-1.5 text-right font-mono">{cr.trades}</td>
                      <td className="py-1.5 text-right font-mono">{cr.winRate.toFixed(0)}%</td>
                      <td className={`py-1.5 text-right font-mono ${cr.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>${cr.pnl.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{rr.trades}</td>
                      <td className="py-1.5 text-right font-mono">{rr.winRate.toFixed(0)}%</td>
                      <td className={`py-1.5 text-right font-mono ${rr.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>${rr.pnl.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, report }: { title: string; report: ReturnType<typeof import('@/lib/baselineValidation').buildAssetReport> }) {
  const row = (k: string, v: string) => (
    <div className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span></div>
  );
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {row('Trades', `${report.trades}`)}
        {row('PnL', `$${report.pnl.toFixed(2)}`)}
        {row('Win rate', `${report.winRate.toFixed(1)}%`)}
        {row('Profit factor', `${report.profitFactor.toFixed(2)}`)}
        {row('Max drawdown', `${report.maxDrawdownPercent.toFixed(2)}%`)}
        <div className="my-2 border-t" />
        {row('Long trades', `${report.longs.trades} · ${report.longs.winRate.toFixed(0)}% WR · $${report.longs.pnl.toFixed(2)}`)}
        {row('Short trades', `${report.shorts.trades} · ${report.shorts.winRate.toFixed(0)}% WR · $${report.shorts.pnl.toFixed(2)}`)}
      </CardContent>
    </Card>
  );
}
