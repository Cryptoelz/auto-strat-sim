import { useMemo, useState } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Eye, Crown, ShieldAlert, TrendingUp, Gauge, Scale, Filter } from 'lucide-react';
import { buildMarketContext, runAllSpecialists } from '@/lib/specialists/registry';
import { selectChampion } from '@/lib/specialists/selector';
import { SPECIALIST_IDS } from '@/lib/specialists/stats';
import { conversionRate } from '@/lib/specialists/attribution';
import { useSpecialistAttribution } from '@/hooks/useSpecialistAttribution';
import { SpecialistProposal } from '@/lib/specialists/types';
import { Asset } from '@/types/trading';

const signalTone = (s: string) =>
  s === 'BUY' ? 'bg-success/15 text-success border-success/30'
  : s === 'SELL' ? 'bg-destructive/15 text-destructive border-destructive/30'
  : 'bg-muted text-muted-foreground border-border';

export default function SpecialistBoard() {
  const { candles, strategyConfig, executionAttempts } = useTradingContext();
  const assets = strategyConfig.enabledAssets;
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0]);
  const { funnels, stats, ledger } = useSpecialistAttribution();

  const perAsset = useMemo(() => {
    return assets.map((asset) => {
      const ctx = buildMarketContext(asset, candles[asset] ?? []);
      if (!ctx) return { asset, proposals: [] as SpecialistProposal[], result: null };
      const proposals = runAllSpecialists(ctx);
      const result = selectChampion(proposals, stats);
      return { asset, proposals, result };
    });
  }, [assets, candles, stats]);

  const current = perAsset.find((a) => a.asset === selectedAsset) ?? perAsset[0];


  const superlatives = useMemo(() => {
    const entries = SPECIALIST_IDS.map((id) => ({ id, s: stats[id] }));
    const pick = (fn: (a: typeof entries[number], b: typeof entries[number]) => number) =>
      [...entries].sort(fn)[0]?.id ?? '—';
    const proposalsById = (id: string) => current?.proposals.find((p) => p.specialistId === id);
    return {
      weakest: pick((a, b) => a.s.institutionRating - b.s.institutionRating),
      mostAccurate: pick((a, b) => b.s.winRate - a.s.winRate),
      highestAlpha: pick((a, b) => b.s.alpha - a.s.alpha),
      largestDrawdown: pick((a, b) => b.s.maxDrawdown - a.s.maxDrawdown),
      mostConservative: [...(current?.proposals ?? [])].sort((a, b) => a.risk - b.risk)[0]?.specialistName ?? '—',
      mostAggressive: [...(current?.proposals ?? [])].sort((a, b) => b.risk - a.risk)[0]?.specialistName ?? '—',
      highestConfidence: [...(current?.proposals ?? [])].sort((a, b) => b.confidence - a.confidence)[0]?.specialistName ?? '—',
      proposalsById,
    };
  }, [stats, current]);

  const nameOf = (id: string) => current?.proposals.find((p) => p.specialistId === id)?.specialistName ?? id;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold sm:text-xl">Specialist Executive Board</h1>
          <Badge variant="outline" className="gap-1 text-[10px]"><Eye className="h-3 w-3" /> Shadow Mode — Observation Only</Badge>
        </div>
        <p className="max-w-[68ch] text-xs text-muted-foreground">
          Five genuinely independent specialist engines analyse the same market snapshot without seeing each other.
          The institution compares every proposal and selects a champion. Nothing on this page executes — the live
          trading engine is untouched.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {assets.map((a) => (
          <Button
            key={a}
            size="sm"
            variant={a === selectedAsset ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => setSelectedAsset(a)}
          >
            {a.replace('USDT', '')}
          </Button>
        ))}
      </div>

      {!current || current.proposals.length === 0 ? (
        <Card><CardContent className="p-6 text-xs text-muted-foreground">Waiting for market data…</CardContent></Card>
      ) : (
        <Tabs defaultValue="comparison" className="space-y-4">
          <TabsList>
            <TabsTrigger value="comparison" className="text-xs">Comparison</TabsTrigger>
            <TabsTrigger value="champion" className="text-xs">Champion Selection</TabsTrigger>
            <TabsTrigger value="attribution" className="text-xs">Attribution</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>

            <TabsTrigger value="board" className="text-xs">Executive Board</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-3">
            {current.proposals.map((p) => (
              <Card key={p.specialistId}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-sm">{p.specialistName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${signalTone(p.signal)}`}>{p.signal}</Badge>
                      <span className="text-xs font-mono">{p.confidence}%</span>
                      {current.result?.champion?.specialistId === p.specialistId && (
                        <Badge className="gap-1 text-[10px]"><Crown className="h-3 w-3" /> Champion</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={p.confidence} className="h-1.5" />
                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                    <div><span className="text-muted-foreground">Regime</span><div className="font-medium">{p.regime.replace('_', ' ')}</div></div>
                    <div><span className="text-muted-foreground">Risk</span><div className="font-medium">{p.risk}</div></div>
                    <div><span className="text-muted-foreground">Expected Reward</span><div className="font-medium">{p.expectedReward}R</div></div>
                    <div><span className="text-muted-foreground">Expected Value</span><div className="font-medium">{p.expectedValue}R</div></div>
                    <div><span className="text-muted-foreground">Size</span><div className="font-medium">{p.suggestedSizePercent}%</div></div>
                    <div><span className="text-muted-foreground">Stop</span><div className="font-medium">{p.suggestedStop ? p.suggestedStop.toFixed(4) : '—'}</div></div>
                    <div><span className="text-muted-foreground">Target</span><div className="font-medium">{p.suggestedTarget ? p.suggestedTarget.toFixed(4) : '—'}</div></div>
                    <div><span className="text-muted-foreground">Institution Score</span><div className="font-medium">{p.institutionScore}</div></div>
                  </div>
                  <div className="space-y-1">
                    {p.evidence.map((e) => (
                      <div key={e.label} className="flex items-center justify-between rounded border border-border/60 px-2 py-1 text-[11px]">
                        <span className="text-muted-foreground">{e.label}</span>
                        <span className="flex items-center gap-2 font-mono">
                          {e.value}
                          <Badge variant="outline" className={`text-[9px] ${e.pass ? 'text-success border-success/40' : 'text-muted-foreground'}`}>
                            {e.pass ? 'PASS' : e.threshold}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                    {p.reasoning.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="champion" className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4" /> Institution Decision</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className={`text-[10px] ${current.result?.decision === 'PROPOSE' ? 'text-success border-success/40' : ''}`}>
                  {current.result?.decision === 'PROPOSE' ? 'PROPOSAL ADVANCES (shadow)' : 'NO ACTION'}
                </Badge>
                <p className="max-w-[68ch] text-xs text-muted-foreground">{current.result?.explanation}</p>
                <div className="space-y-2">
                  {current.result?.scores.map((s, i) => (
                    <div key={s.specialistId} className="rounded border border-border/60 p-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{i + 1}. {s.specialistName}</span>
                        <span className="font-mono">{s.total}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground sm:grid-cols-4">
                        {Object.entries(s.components).map(([k, v]) => (
                          <div key={k} className="flex justify-between"><span>{k.replace(/([A-Z])/g, ' $1')}</span><span className="font-mono">{Math.round(v)}</span></div>
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">{s.rationale}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded border border-border/60 p-2 text-[11px] text-muted-foreground">
                  Governance path after champion selection: Risk Engine → Portfolio Manager → Allocation Engine → Governance → Executive Decision → Execution.
                  In shadow mode the chain stops here; no order is ever created.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Signal Funnel — Live Execution Path</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="max-w-[68ch] text-[11px] text-muted-foreground">
                  Seen and Proposed come from specialists running on the exact candles the live engine evaluated.
                  Approved, Rejected and Executed are resolved from the engine's own execution-attempt records
                  ({executionAttempts.length} attempts observed, {ledger.length} comparison rounds).
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-[11px]">
                    <thead className="text-muted-foreground">
                      <tr className="border-b border-border">
                        {['Specialist', 'Signals Seen', 'Proposed', 'Approved', 'Rejected', 'Executed', 'Proposal → Execution'].map((h) => (
                          <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SPECIALIST_IDS.map((id) => {
                        const f = funnels[id];
                        return (
                          <tr key={id} className="border-b border-border/50">
                            <td className="px-2 py-1 font-medium">{nameOf(id)}</td>
                            <td className="px-2 py-1 font-mono">{f.seen}</td>
                            <td className="px-2 py-1 font-mono">{f.proposed}</td>
                            <td className="px-2 py-1 font-mono text-success">{f.approved}</td>
                            <td className="px-2 py-1 font-mono text-muted-foreground">{f.rejected}</td>
                            <td className="px-2 py-1 font-mono">{f.executed}</td>
                            <td className="px-2 py-1 font-mono">{conversionRate(f)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              {SPECIALIST_IDS.map((id) => {
                const f = funnels[id];
                const reasons = Object.entries(f.rejections).sort((a, b) => b[1] - a[1]);
                return (
                  <Card key={id}>
                    <CardHeader className="pb-2"><CardTitle className="text-xs">{nameOf(id)} — Rejection Reasons</CardTitle></CardHeader>
                    <CardContent className="space-y-1">
                      {reasons.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No rejections recorded yet.</p>
                      ) : reasons.map(([reason, count]) => (
                        <div key={reason} className="flex items-center justify-between rounded border border-border/60 px-2 py-1 text-[11px]">
                          <span className="text-muted-foreground">{reason}</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ))}
                      {f.lastReason && <p className="pt-1 text-[10px] text-muted-foreground">Most recent outcome: {f.lastReason}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>



          <TabsContent value="performance" className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4" /> Independent Specialist Statistics</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-[11px]">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      {['Specialist', 'Proposals', 'Actionable', 'Waits', 'Correct Waits', 'Win Rate', 'PF', 'DD', 'Sharpe', 'Sortino', 'EV', 'Alpha', 'Opp. Cost', 'Research', 'Rating'].map((h) => (
                        <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SPECIALIST_IDS.map((id) => {
                      const s = stats[id];
                      return (
                        <tr key={id} className="border-b border-border/50">
                          <td className="px-2 py-1 font-medium">{nameOf(id)}</td>
                          <td className="px-2 py-1 font-mono">{s.proposals}</td>
                          <td className="px-2 py-1 font-mono">{s.actionable}</td>
                          <td className="px-2 py-1 font-mono">{s.waits}</td>
                          <td className="px-2 py-1 font-mono">{s.correctWaits}</td>
                          <td className="px-2 py-1 font-mono">{s.winRate}%</td>
                          <td className="px-2 py-1 font-mono">{s.profitFactor}</td>
                          <td className="px-2 py-1 font-mono">{s.maxDrawdown}</td>
                          <td className="px-2 py-1 font-mono">{s.sharpe}</td>
                          <td className="px-2 py-1 font-mono">{s.sortino}</td>
                          <td className="px-2 py-1 font-mono">{s.expectedValue}</td>
                          <td className="px-2 py-1 font-mono">{s.alpha}</td>
                          <td className="px-2 py-1 font-mono">{s.opportunityCost}</td>
                          <td className="px-2 py-1 font-mono">{s.researchScore}</td>
                          <td className="px-2 py-1 font-mono">{s.institutionRating}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Statistics derive from {ledger.length} recorded comparison rounds. Every record feeds only the specialist that produced it.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="board" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Current Champion', value: current.result?.champion?.specialistName ?? '—', icon: Crown },
              { label: 'Runner-up', value: current.result?.runnerUp?.specialistName ?? '—', icon: TrendingUp },
              { label: 'Weakest Specialist', value: nameOf(superlatives.weakest), icon: ShieldAlert },
              { label: 'Most Accurate', value: nameOf(superlatives.mostAccurate), icon: Gauge },
              { label: 'Highest Alpha', value: nameOf(superlatives.highestAlpha), icon: TrendingUp },
              { label: 'Largest Drawdown', value: nameOf(superlatives.largestDrawdown), icon: ShieldAlert },
              { label: 'Most Conservative', value: superlatives.mostConservative, icon: Scale },
              { label: 'Most Aggressive', value: superlatives.mostAggressive, icon: TrendingUp },
              { label: 'Highest Confidence', value: superlatives.highestConfidence, icon: Gauge },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <c.icon className="h-3 w-3" /> {c.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{c.value}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
