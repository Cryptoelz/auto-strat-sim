import { useMemo, useState } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { ALL_ASSETS } from '@/config/trading';
import {
  buildTradingDiagnostics, GUARANTEE_TEXT, StageState, AssetDiagnostics,
} from '@/lib/tradingDiagnostics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity, AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, Clock,
  Gauge, HelpCircle, Lock, ShieldCheck, Stethoscope, XCircle,
} from 'lucide-react';

const stateStyles: Record<StageState, string> = {
  PASS: 'bg-primary/10 text-primary border-primary/30',
  FAIL: 'bg-destructive/10 text-destructive border-destructive/30',
  WAITING: 'bg-muted text-muted-foreground border-border',
  BLOCKED: 'bg-destructive/10 text-destructive border-destructive/30',
};

function StageBadge({ state }: { state: StageState }) {
  const Icon = state === 'PASS' ? CheckCircle2 : state === 'WAITING' ? Clock : state === 'FAIL' ? XCircle : Lock;
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${stateStyles[state]}`}>
      <Icon className="h-3 w-3" />{state}
    </Badge>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AssetCard({ d }: { d: AssetDiagnostics }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {d.symbol}
            <span className="text-xs font-normal text-muted-foreground">{d.name}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{d.regime} · {d.regimeConfidence.toFixed(0)}%</Badge>
            <StageBadge state={d.finalDecision} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Price" value={d.price != null ? d.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'} />
          <Stat label="RSI (14)" value={d.rsi != null ? d.rsi.toFixed(1) : '—'} />
          <Stat label="ATR %" value={d.atrPercent != null ? `${d.atrPercent.toFixed(2)}%` : '—'} />
          <Stat label="SMA Sep." value={d.smaDistance != null ? `${d.smaDistance.toFixed(2)}%` : '—'} sub={`HTF ${d.htfTrend}`} />
        </div>

        <div>
          <p className="mb-1 font-medium">Why this regime was selected</p>
          <p className="text-muted-foreground">{d.regimeWhy}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Last regime change: {d.lastRegimeChange ? new Date(d.lastRegimeChange).toLocaleString() : '—'}
          </p>
        </div>

        <div>
          <p className="mb-1 font-medium">Specialist</p>
          <p className="text-muted-foreground">{d.specialistWhy}</p>
          {d.specialist && <p className="mt-1 text-muted-foreground">{d.specialist.reasoning}</p>}
        </div>

        <div>
          <p className="mb-2 font-medium">Decision pipeline</p>
          <div className="space-y-1">
            {d.pipeline.map((s, i) => (
              <div key={s.name} className="flex items-start gap-2 rounded-md border bg-muted/30 px-2 py-1.5">
                <span className="w-4 text-[10px] text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.name}</span>
                    <StageBadge state={s.state} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-medium">Every block explained ({d.blocks.length})</p>
          {d.blocks.length === 0 ? (
            <p className="text-muted-foreground">No blocking rules — all gates currently pass.</p>
          ) : (
            <div className="space-y-2">
              {d.blocks.map((b, i) => (
                <div key={i} className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                  <p className="font-medium text-destructive">{b.label}</p>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    <p><span className="text-muted-foreground">Current:</span> {b.currentValue}</p>
                    <p><span className="text-muted-foreground">Required:</span> {b.requiredValue}</p>
                    <p><span className="text-muted-foreground">Rule:</span> {b.rule}</p>
                    <p><span className="text-muted-foreground">Action:</span> {b.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="grid gap-2 sm:grid-cols-2">
          <div><p className="font-medium">Why ATLAS did not trade</p><p className="text-muted-foreground">{d.explanation.whyNoTrade}</p></div>
          <div><p className="font-medium">Why ATLAS recommends waiting</p><p className="text-muted-foreground">{d.explanation.whyWait}</p></div>
          <div><p className="font-medium">What would trigger a BUY</p><p className="text-muted-foreground">{d.explanation.buyTrigger}</p></div>
          <div><p className="font-medium">What would trigger a SELL</p><p className="text-muted-foreground">{d.explanation.sellTrigger}</p></div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">Estimated probability of next signal</span>
            <span className="tabular-nums">{d.explanation.nextSignalProbability}%</span>
          </div>
          <Progress value={d.explanation.nextSignalProbability} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TradingDiagnostics() {
  const { analytics, candles, prices, signals, state, config, equity, drawdown, enabledAssets } = useTradingContext();
  const [question, setQuestion] = useState<string | null>(null);

  const report = useMemo(() => buildTradingDiagnostics({
    assets: ALL_ASSETS,
    analytics, candles, prices, signals, state, config,
    equity, drawdown, enabledAssets,
  }), [analytics, candles, prices, signals, state, config, equity, drawdown, enabledAssets]);

  const answers: { q: string; a: string }[] = useMemo(() => {
    const byId = (sym: string) => report.assets.find(a => a.symbol.startsWith(sym));
    const btc = byId('BTC'); const xrp = byId('XRP');
    const worst = report.modules.filter(m => !m.ok);
    return [
      { q: 'Why is BTC blocked?', a: btc ? `${btc.explanation.whyNoTrade} Primary rule: ${btc.blocks[0]?.rule ?? 'none triggered'}.` : 'BTC is not in the active asset set.' },
      { q: 'Why is XRP waiting?', a: xrp ? `${xrp.symbol} is in state ${xrp.finalDecision}. ${xrp.explanation.whyWait}` : 'XRP is not in the active asset set.' },
      { q: 'Which specialist is active?', a: `${report.summary.activeSpecialist}. Champion strategy: ${report.summary.champion}.` },
      { q: "Why wasn't a trade opened?", a: `${report.summary.signalsBlocked} of ${report.assets.length} assets are blocked (${report.summary.blockedPercent}%). Leading causes: ${[...new Set(report.assets.flatMap(a => a.blocks.map(b => b.label)))].slice(0, 3).join(', ') || 'no blocking rules — simply no crossover yet'}.` },
      { q: 'What would trigger a BUY?', a: btc?.explanation.buyTrigger ?? 'A confirmed SMA crossover with volatility, trend and RSI confirmation.' },
      { q: 'Is the trading engine healthy?', a: `Engine status ${report.summary.engineStatus}, health ${report.summary.overallHealth}%. ${worst.length ? `Faults: ${worst.map(m => m.module).join(', ')}.` : 'All ten subsystems report healthy.'}` },
      { q: 'Is the market currently bullish?', a: `Dominant regime is ${report.summary.regime} at ${report.summary.avgConfidence}% average confidence across ${report.assets.length} assets.` },
      { q: 'Should I investigate anything?', a: worst.length ? `Yes — ${worst.map(m => `${m.module}: ${m.fault} (${m.severity}). Fix: ${m.fix}`).join(' | ')}` : 'No — no faults detected. Blocks are strategy-rule driven and expected.' },
    ];
  }, [report]);

  const s = report.summary;

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold sm:text-xl">ATLAS Trading Diagnostics™</h1>
          <Badge variant="outline" className="text-[10px]">Diagnostic only · no execution</Badge>
        </div>
        <p className="max-w-[68ch] text-xs text-muted-foreground">
          Explains every trading decision and non-decision across BTC, ETH, XRP, SOL, FET and XLM — regime, specialist, pipeline stage, blocking rule and the condition required for the next trade.
        </p>
      </header>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="max-w-[68ch] text-xs text-muted-foreground">{GUARANTEE_TEXT}</p>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Engine Status" value={s.engineStatus} />
        <Stat label="Overall Health" value={`${s.overallHealth}%`} />
        <Stat label="Market Regime" value={s.regime} />
        <Stat label="Active Specialist" value={s.activeSpecialist} />
        <Stat label="Signals Today" value={String(s.signalsToday)} />
        <Stat label="Signals Blocked" value={String(s.signalsBlocked)} />
        <Stat label="Trades Approved" value={String(s.tradesApproved)} />
        <Stat label="Trades Executed" value={String(s.tradesExecuted)} />
        <Stat label="Blocked %" value={`${s.blockedPercent}%`} />
        <Stat label="Avg Confidence" value={`${s.avgConfidence}%`} />
        <Stat label="Avg Risk Score" value={`${s.avgRiskScore}%`} />
        <Stat label="Portfolio Exposure" value={`${s.exposurePercent.toFixed(1)}%`} />
        <Stat label="Current Drawdown" value={`${s.drawdown.toFixed(2)}%`} />
        <Stat label="Champion Strategy" value={s.champion} />
      </section>

      <Tabs defaultValue="assets">
        <TabsList className="flex-wrap">
          <TabsTrigger value="assets" className="text-xs">Assets & Pipeline</TabsTrigger>
          <TabsTrigger value="specialists" className="text-xs">Specialists</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs">AI Maintenance</TabsTrigger>
          <TabsTrigger value="feed" className="text-xs">Live Decision Feed</TabsTrigger>
          <TabsTrigger value="questions" className="text-xs">Executive Questions</TabsTrigger>
          <TabsTrigger value="scores" className="text-xs">Health Score</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4 grid gap-4 xl:grid-cols-2">
          {report.assets.map(d => <AssetCard key={d.asset} d={d} />)}
        </TabsContent>

        <TabsContent value="specialists" className="mt-4 grid gap-4 md:grid-cols-2">
          {report.specialists.map(sp => (
            <Card key={sp.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BrainCircuit className="h-4 w-4 text-muted-foreground" />{sp.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    {sp.champion && <Badge className="text-[10px]">Champion</Badge>}
                    <Badge variant="outline" className={`text-[10px] ${sp.active ? 'border-primary/30 text-primary' : ''}`}>
                      {sp.active ? 'Active' : 'Standby'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Confidence" value={`${sp.confidence}%`} />
                  <Stat label="Performance (PF)" value={sp.performance.toFixed(2)} />
                </div>
                <p className="text-muted-foreground">{sp.reasoning}</p>
                {!sp.active && (
                  <p className="text-muted-foreground">
                    Not selected: the current regime does not match this specialist's validated mandate, or regime confidence is below the 55% activation gate.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Stethoscope className="h-4 w-4" />Subsystem verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {report.modules.map(m => (
                <div key={m.module} className="rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">
                      {m.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      {m.module}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${m.ok ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive'}`}>
                      {m.ok ? 'Verified' : m.severity.toUpperCase()}
                    </Badge>
                  </div>
                  {!m.ok && (
                    <div className="mt-1 grid gap-1 sm:grid-cols-2">
                      <p><span className="text-muted-foreground">Fault:</span> {m.fault}</p>
                      <p><span className="text-muted-foreground">Impact:</span> {m.impact}</p>
                      <p><span className="text-muted-foreground">Affected:</span> {m.affected.length ? m.affected.join(', ') : 'All assets'}</p>
                      <p><span className="text-muted-foreground">Recommended fix:</span> {m.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feed" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4" />Live decision feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-2">
                  {report.feed.map(f => (
                    <div key={f.id} className="rounded-md border p-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-nums text-muted-foreground">{new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-medium">{f.symbol}</span>
                        <span className="text-muted-foreground">{f.specialist}</span>
                        <Badge variant="outline" className="text-[10px]">{f.action}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${f.outcome === 'Approved' ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive'}`}>{f.outcome}</Badge>
                        <span className="ml-auto text-muted-foreground">Confidence {f.confidence}% · Risk {f.risk}%</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">Reason: {f.reason}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><HelpCircle className="h-4 w-4" />Ask ATLAS</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {answers.map(({ q }) => (
                <Button key={q} variant={question === q ? 'default' : 'outline'} size="sm"
                  className="w-full justify-between text-xs" onClick={() => setQuestion(q)}>
                  {q}<ArrowRight className="h-3 w-3" />
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{question ?? 'Select a question'}</CardTitle></CardHeader>
            <CardContent>
              <p className="max-w-[68ch] text-xs text-muted-foreground">
                {question ? answers.find(a => a.q === question)?.a : 'Every answer is derived live from the trading engine — regimes, indicators, filters, risk limits, allocation and governance state.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4" />Daily trading health score</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              {[
                ['Trading Engine Score', report.scores.tradingEngine],
                ['Market Alignment', report.scores.marketAlignment],
                ['Signal Quality', report.scores.signalQuality],
                ['Specialist Accuracy', report.scores.specialistAccuracy],
                ['Execution Readiness', report.scores.executionReadiness],
                ['Portfolio Readiness', report.scores.portfolioReadiness],
                ['Overall Trading Confidence', report.scores.overallConfidence],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="mb-1 flex items-center justify-between">
                    <span>{label}</span><span className="tabular-nums">{value as number}%</span>
                  </div>
                  <Progress value={value as number} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
