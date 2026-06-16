import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { GitFork, Lock, Shield, TrendingUp, Activity, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Router v2.1 — Forked from Router v2 (Trade Frequency Opportunity Audit)
//
// Only change vs Router v2: −10% reduction to entry move thresholds.
// All other modules (routing, MPC v2, governance, sizing, risk, selection)
// are inherited unchanged from Router v2 (the control version).
// Status: Research. Promotion locked until 30 days runtime + 20 trades.
// ─────────────────────────────────────────────────────────────────────────────

type Row = {
  label: string;
  v2: string;
  v21: string;
  delta: string;
  deltaTone: 'good' | 'bad' | 'neutral';
};

const COMPARISON: Row[] = [
  { label: 'Net PnL',            v2: '$773',  v21: '$905',  delta: '+$132 (+17.1%)', deltaTone: 'good' },
  { label: 'Profit Factor',      v2: '1.71',  v21: '1.62',  delta: '−0.09',           deltaTone: 'bad' },
  { label: 'Max Drawdown',       v2: '3.1%',  v21: '3.4%',  delta: '+0.3pp',          deltaTone: 'bad' },
  { label: 'Win Rate',           v2: '54.8%', v21: '53.5%', delta: '−1.3pp',          deltaTone: 'bad' },
  { label: 'Trade Count (30d)',  v2: '42',    v21: '57',    delta: '+15 (+35.7%)',    deltaTone: 'good' },
  { label: 'Trades per Day',     v2: '1.4',   v21: '1.9',   delta: '+0.5',            deltaTone: 'good' },
  { label: 'Move Capture %',     v2: '61%',   v21: '72%',   delta: '+11pp',           deltaTone: 'good' },
  { label: 'Avg Entry Delay',    v2: '2.3 candles', v21: '1.7 candles', delta: '−0.6 candles', deltaTone: 'good' },
  { label: 'Sharpe-like Score',  v2: '1.48',  v21: '1.41',  delta: '−0.07',           deltaTone: 'bad' },
];

const INHERITED = [
  'Routing logic (regime → specialist mapping)',
  'MPC v2 Confidence Recovery (unchanged)',
  'Governance gates and pause logic (unchanged)',
  'Position sizing (3–6% adaptive tiers)',
  'Risk management (asset-specific SL/TP, trailing stops)',
  'Strategy selection rules (Baseline v11 / Candidate 25 / Trend Rider v1 / Mean Reversion v1)',
];

const CHANGES = [
  { label: 'Long entry move threshold',  v2: '0.50%', v21: '0.45%' },
  { label: 'Short entry move threshold', v2: '0.60%', v21: '0.54%' },
  { label: 'XRP entry move threshold',   v2: '1.20%', v21: '1.08%' },
  { label: 'Confirmation rule',          v2: '1 candle', v21: '1 candle (unchanged)' },
];

const PROMOTION = {
  runtimeDays: 0,
  runtimeRequired: 30,
  trades: 0,
  tradesRequired: 20,
};

function toneClass(t: Row['deltaTone']) {
  if (t === 'good') return 'text-trading-profit';
  if (t === 'bad') return 'text-trading-warning';
  return 'text-muted-foreground';
}

export default function RouterV21() {
  const runtimePct = (PROMOTION.runtimeDays / PROMOTION.runtimeRequired) * 100;
  const tradesPct = (PROMOTION.trades / PROMOTION.tradesRequired) * 100;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" /> Router v2.1
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Forked from Router v2 following the Trade Frequency Opportunity Audit recommendation
            (−10% entry threshold adjustment). All other modules inherited unchanged. Router v2
            remains the control version.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Status: Research
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px] text-trading-warning border-trading-warning/40">
            <Lock className="h-3 w-3" /> Promotion locked
          </Badge>
        </div>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Net PnL',       value: '$905',  hint: 'vs $773' },
          { label: 'Profit Factor', value: '1.62',  hint: 'vs 1.71' },
          { label: 'Max DD',        value: '3.4%',  hint: 'vs 3.1%' },
          { label: 'Win Rate',      value: '53.5%', hint: 'vs 54.8%' },
          { label: 'Trades/Day',    value: '1.9',   hint: 'vs 1.4' },
          { label: 'Move Capture',  value: '72%',   hint: 'vs 61%' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <p className="text-base font-bold tabular-nums mt-1">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">v2 vs v2.1</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="inherited">Inherited</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        {/* Comparison panel */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Router v2 vs Router v2.1
              </CardTitle>
              <CardDescription className="text-xs">
                Projected 30-day comparison from the Trade Frequency Opportunity Audit. Router v2
                is the control; only entry thresholds change in v2.1.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="text-left font-medium py-2 pr-3">Metric</th>
                      <th className="text-right font-medium py-2 px-3">Router v2 (control)</th>
                      <th className="text-right font-medium py-2 px-3">Router v2.1</th>
                      <th className="text-right font-medium py-2 pl-3">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((r) => (
                      <tr key={r.label} className="border-b border-border/40">
                        <td className="py-2 pr-3 text-muted-foreground">{r.label}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.v2}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">{r.v21}</td>
                        <td className={`py-2 pl-3 text-right tabular-nums ${toneClass(r.deltaTone)}`}>{r.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-trading-warning shrink-0 mt-0.5" />
                  Interpretation: v2.1 trades 36% more often, captures 11pp more of major moves and
                  generates ~$132 additional PnL — at the cost of a small PF/WR reduction and
                  +0.3pp drawdown. Both DD and PF remain within governance safety bands.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changes panel */}
        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parameter Changes (only)</CardTitle>
              <CardDescription className="text-xs">
                −10% reduction on entry move thresholds. Nothing else is modified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="text-left font-medium py-2 pr-3">Parameter</th>
                    <th className="text-right font-medium py-2 px-3">Router v2</th>
                    <th className="text-right font-medium py-2 pl-3">Router v2.1</th>
                  </tr>
                </thead>
                <tbody>
                  {CHANGES.map((c) => (
                    <tr key={c.label} className="border-b border-border/40">
                      <td className="py-2 pr-3 text-muted-foreground">{c.label}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{c.v2}</td>
                      <td className="py-2 pl-3 text-right tabular-nums font-medium">{c.v21}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inherited panel */}
        <TabsContent value="inherited">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-trading-profit" />
                Inherited from Router v2 (unchanged)
              </CardTitle>
              <CardDescription className="text-xs">
                These modules are identical to Router v2. Any future change must be promoted via
                its own audit and review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs">
                {INHERITED.map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{i}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Governance panel */}
        <TabsContent value="governance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-trading-warning" />
                Promotion Gate (locked)
              </CardTitle>
              <CardDescription className="text-xs">
                Router v2.1 cannot be promoted until both runtime and trade-count gates clear.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Runtime</span>
                  <span className="tabular-nums">{PROMOTION.runtimeDays} / {PROMOTION.runtimeRequired} days</span>
                </div>
                <Progress value={runtimePct} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Trades</span>
                  <span className="tabular-nums">{PROMOTION.trades} / {PROMOTION.tradesRequired} minimum</span>
                </div>
                <Progress value={tradesPct} className="h-1.5" />
              </div>
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <Activity className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                Goal: determine whether the additional trade frequency improves profitability
                without materially degrading risk-adjusted performance. Router v2 stays live as
                the control; do not modify.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
