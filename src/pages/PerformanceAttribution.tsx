import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  buildPerformanceAttribution, exportAttributionReport, downloadText,
  GBP, PCT, GOVERNANCE_TEXT, RATING_STATUS,
  Contribution, SpecialistScorecard, FilterAttribution,
} from '@/lib/performanceAttribution';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid, ExecStatusPill, ExecGovernanceFooter,
} from '@/components/executive/ExecUi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  BarChart3, BrainCircuit, Download, FileText, Filter, Landmark, Link2,
  Lock, PieChart, Scale, ShieldCheck, Sparkles, Target, TrendingUp,
} from 'lucide-react';

const AXIS = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } as const;

function chartTooltip() {
  return {
    contentStyle: {
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 8,
      fontSize: 11,
    },
    labelStyle: { color: 'hsl(var(--foreground))' },
  };
}

function barColor(v: number) {
  return v >= 0 ? 'hsl(var(--exec-healthy, var(--primary)))' : 'hsl(var(--destructive))';
}

function Money({ v }: { v: number }) {
  return (
    <span className={v >= 0 ? 'text-exec-healthy' : 'text-exec-critical'}>{GBP(v)}</span>
  );
}

function TrendPill({ trend }: { trend: SpecialistScorecard['trend'] }) {
  const status = trend === 'Improving' ? 'healthy' : trend === 'Declining' ? 'warning' : 'watch';
  return <ExecStatusPill status={status} label={trend} />;
}

function ContributionRow({ c }: { c: Contribution }) {
  return (
    <div className="grid grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] items-center gap-2 border-b border-border/60 py-2 text-xs last:border-0">
      <div className="min-w-0">
        <p className="truncate font-medium">{c.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{c.family} · {c.evidence}</p>
      </div>
      <span className="text-right font-mono"><Money v={c.contributionGbp} /></span>
      <span className="text-right font-mono tabular-nums text-muted-foreground">{c.contributionPct}%</span>
      <span className="text-right font-mono tabular-nums">{c.alphaScore}</span>
      <span className="text-right font-mono tabular-nums text-muted-foreground">{c.confidence}%</span>
    </div>
  );
}

function FilterRow({ f }: { f: FilterAttribution }) {
  const status =
    f.recommendation === 'Keep' ? 'healthy' : f.recommendation === 'Investigate' ? 'watch' : 'warning';
  return (
    <div className="grid grid-cols-[1.7fr_repeat(6,minmax(0,1fr))_auto] items-center gap-2 border-b border-border/60 py-2 text-xs last:border-0">
      <div className="min-w-0">
        <p className="truncate font-medium">{f.name}</p>
        <p className="text-[10px] text-muted-foreground">{f.family}</p>
      </div>
      <span className="text-right font-mono text-exec-healthy">{GBP(f.moneyProtected)}</span>
      <span className="text-right font-mono text-exec-critical">{GBP(f.profitMissed)}</span>
      <span className="text-right font-mono"><Money v={f.net} /></span>
      <span className="text-right font-mono tabular-nums">{f.avgTradeQuality}</span>
      <span className="text-right font-mono tabular-nums text-muted-foreground">{f.falsePositives} / {f.falseNegatives}</span>
      <span className="text-right font-mono tabular-nums text-muted-foreground">{f.researchConfidence}%</span>
      <span className="justify-self-end"><ExecStatusPill status={status} label={f.recommendation} /></span>
    </div>
  );
}

export default function PerformanceAttribution() {
  const a = useMemo(() => buildPerformanceAttribution(Date.UTC(2026, 7, 9, 16, 0, 0)), []);
  const [tab, setTab] = useState('breakdown');

  const h = a.hero;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6 sm:p-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" /> Observation Only</Badge>
          <Badge variant="outline" className="text-[10px]">Simulation Only</Badge>
          <Badge variant="outline" className="text-[10px]">Research Only</Badge>
          <Badge variant="outline" className="text-[10px]">Human Approval Required</Badge>
        </div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Landmark className="h-7 w-7 text-trading-gold" aria-hidden="true" />
          Performance Attribution™
        </h1>
        <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
          Understand exactly where institutional performance comes from. Every figure below is derived from a
          deterministic, reproducible model of the last {a.windowDays} days and links back to its evidence.
        </p>
      </header>

      {/* EXECUTIVE HERO */}
      <ExecMetricGrid cols={5}>
        <ExecMetric label="Institution Return" value={PCT(h.institutionReturn, 2)} hint={GBP(h.institutionReturnGbp)} status={h.institutionReturn >= 0 ? 'healthy' : 'warning'} trend={h.institutionReturn >= 0 ? 'up' : 'down'} />
        <ExecMetric label="Risk Adjusted Return" value={h.riskAdjustedReturn.toFixed(2)} hint="Sharpe-like, 30d" status={h.riskAdjustedReturn > 1.5 ? 'healthy' : 'watch'} />
        <ExecMetric label="Institution Alpha" value={PCT(h.institutionAlpha, 2)} hint="vs Router v2 baseline" status={h.institutionAlpha >= 0 ? 'healthy' : 'warning'} />
        <ExecMetric label="Protected Capital" value={GBP(h.protectedCapital)} hint="Risk + governance" status="healthy" />
        <ExecMetric label="Opportunity Cost" value={GBP(h.opportunityCost)} hint="From Opportunity Analysis™" status="watch" />
        <ExecMetric label="Institution Confidence" value={`${h.institutionConfidence}%`} hint="Weighted decision confidence" status="healthy" />
        <ExecMetric label="Research Quality" value={`${h.researchQuality}%`} hint="Evidence completeness" status="healthy" />
        <ExecMetric label="Governance Quality" value={`${h.governanceQuality}%`} hint="Controls observed" status="healthy" />
        <ExecMetric label="Institution IQ" value={h.institutionIQ} hint="ATLAS IQ index" status="healthy" />
        <ExecMetric label="Attribution Window" value={`${a.windowDays}d`} hint={new Date(a.generatedAt).toLocaleDateString('en-GB')} status="watch" />
      </ExecMetricGrid>

      {/* PORTFOLIO STORY */}
      <ExecCard className="p-5">
        <ExecCardHeader title="Portfolio Story" icon={Sparkles} hint="Auto-generated executive explanation" />
        <div className="space-y-2">
          {a.story.map((s, i) => (
            <p key={i} className="max-w-[80ch] text-sm leading-relaxed text-muted-foreground">{s}</p>
          ))}
        </div>
      </ExecCard>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="breakdown">Profit Breakdown</TabsTrigger>
          <TabsTrigger value="specialists">Specialists</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="regimes">Regimes</TabsTrigger>
          <TabsTrigger value="risk">Risk &amp; Opportunity</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="oracle">Oracle</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* PROFIT BREAKDOWN */}
        <TabsContent value="breakdown" className="mt-4 space-y-4">
          <ExecCard className="p-5">
            <ExecCardHeader title="Institutional Profit Breakdown" icon={PieChart} hint="Every component of the day's performance" />
            <div className="grid grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] gap-2 border-b border-border pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Component</span>
              <span className="text-right">Contribution</span>
              <span className="text-right">Contribution %</span>
              <span className="text-right">Alpha Score</span>
              <span className="text-right">Confidence</span>
            </div>
            {a.contributions.map((c) => <ContributionRow key={c.id} c={c} />)}
          </ExecCard>

          <ExecCard className="p-5">
            <ExecCardHeader title="Contribution Chart" icon={BarChart3} hint="£ attributed per component" />
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.contributions} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={AXIS} angle={-35} textAnchor="end" interval={0} height={70} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} formatter={(v: number) => GBP(v)} />
                  <Bar dataKey="contributionGbp" name="Contribution" radius={[4, 4, 0, 0]}>
                    {a.contributions.map((c) => <Cell key={c.id} fill={barColor(c.contributionGbp)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>
        </TabsContent>

        {/* SPECIALISTS */}
        <TabsContent value="specialists" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {a.specialists.map((s) => (
              <ExecCard key={s.name} className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{s.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{s.trades} simulated trades</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ExecStatusPill status={RATING_STATUS[s.rating]} label={s.rating} />
                    <TrendPill trend={s.trend} />
                  </div>
                </div>
                <Separator className="mb-3" />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {[
                    ['Profit', GBP(s.profit)],
                    ['Loss', GBP(s.loss)],
                    ['Win Rate', `${s.winRate.toFixed(1)}%`],
                    ['Average Hold', `${s.avgHoldHours.toFixed(1)}h`],
                    ['Average Confidence', `${s.avgConfidence.toFixed(0)}%`],
                    ['Average Drawdown', `${s.avgDrawdown.toFixed(2)}%`],
                    ['Risk Contribution', `${s.riskContribution.toFixed(1)}%`],
                    ['Capital Efficiency', `£${s.capitalEfficiency.toFixed(1)} / £1k`],
                    ['Expected Value', GBP(s.expectedValue)],
                    ['Profit Factor', s.profitFactor.toFixed(2)],
                    ['Sharpe', s.sharpe.toFixed(2)],
                    ['Sortino', s.sortino.toFixed(2)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Separator className="my-3" />
                <p className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Net contribution</span>
                  <span className="font-mono font-semibold"><Money v={s.net} /></span>
                </p>
              </ExecCard>
            ))}
          </div>
        </TabsContent>

        {/* FILTERS */}
        <TabsContent value="filters" className="mt-4">
          <ExecCard className="p-5">
            <ExecCardHeader title="Filter Attribution" icon={Filter} hint="Protection versus suppression, per filter" />
            <div className="grid grid-cols-[1.7fr_repeat(6,minmax(0,1fr))_auto] gap-2 border-b border-border pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Filter</span>
              <span className="text-right">Protected</span>
              <span className="text-right">Missed</span>
              <span className="text-right">Net</span>
              <span className="text-right">Quality</span>
              <span className="text-right">FP / FN</span>
              <span className="text-right">Confidence</span>
              <span className="justify-self-end">Recommendation</span>
            </div>
            {a.filters.map((f) => <FilterRow key={f.id} f={f} />)}
            <p className="mt-3 text-[11px] text-muted-foreground">
              Recommendations are advisory. No filter is modified by this module — research candidates are queued
              for human approval in the <Link className="underline" to="/decision-centre">Decision Centre™</Link>.
            </p>
          </ExecCard>
        </TabsContent>

        {/* ASSETS */}
        <TabsContent value="assets" className="mt-4 space-y-4">
          <ExecCard className="p-5">
            <ExecCardHeader title="Asset Contribution" icon={Target} hint="Ranked by net attribution" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                    {['Asset', 'Profit', 'Loss', 'Net', 'Drawdown', 'Win Rate', 'Avg Hold', 'Capital Used', 'Alpha', 'Rating'].map((x) => (
                      <th key={x} className={`py-2 ${x === 'Asset' ? 'text-left' : 'text-right'}`}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.assets.map((x) => (
                    <tr key={x.asset} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-semibold">{x.asset}</td>
                      <td className="py-2 text-right font-mono text-exec-healthy">{GBP(x.profit)}</td>
                      <td className="py-2 text-right font-mono text-exec-critical">{GBP(x.loss)}</td>
                      <td className="py-2 text-right font-mono"><Money v={x.net} /></td>
                      <td className="py-2 text-right font-mono tabular-nums">{x.drawdown.toFixed(2)}%</td>
                      <td className="py-2 text-right font-mono tabular-nums">{x.winRate.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono tabular-nums">{x.avgHoldHours.toFixed(1)}h</td>
                      <td className="py-2 text-right font-mono tabular-nums">{GBP(x.capitalUsed)}</td>
                      <td className="py-2 text-right font-mono tabular-nums">{x.alphaContribution}%</td>
                      <td className="py-2 text-right"><ExecStatusPill status={RATING_STATUS[x.rating]} label={x.rating} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ExecCard>
          <ExecCard className="p-5">
            <ExecCardHeader title="Asset Contribution Chart" icon={BarChart3} />
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.assets} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="asset" tick={AXIS} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} formatter={(v: number) => GBP(v)} />
                  <Bar dataKey="net" name="Net" radius={[4, 4, 0, 0]}>
                    {a.assets.map((x) => <Cell key={x.asset} fill={barColor(x.net)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>
        </TabsContent>

        {/* REGIMES */}
        <TabsContent value="regimes" className="mt-4">
          <ExecCard className="p-5">
            <ExecCardHeader title="Regime Analysis" icon={Scale} hint="Performance by market regime" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                    {['Regime', 'Trades', 'Win Rate', 'Profit Factor', 'Expected Value', 'Contribution'].map((x) => (
                      <th key={x} className={`py-2 ${x === 'Regime' ? 'text-left' : 'text-right'}`}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.regimes.map((r) => (
                    <tr key={r.regime} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-medium">{r.regime}</td>
                      <td className="py-2 text-right font-mono tabular-nums">{r.trades}</td>
                      <td className="py-2 text-right font-mono tabular-nums">{r.winRate.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono tabular-nums">{r.profitFactor.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono"><Money v={r.expectedValue} /></td>
                      <td className="py-2 text-right font-mono"><Money v={r.contribution} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ExecCard>
        </TabsContent>

        {/* RISK & OPPORTUNITY */}
        <TabsContent value="risk" className="mt-4 space-y-4">
          <ExecMetricGrid cols={3}>
            <ExecMetric label="Saved Capital" value={GBP(a.risk.savedCapital)} hint="Preserved + losses avoided" status="healthy" />
            <ExecMetric label="Risk Score" value={a.risk.riskScore} hint="Controls effectiveness" status="healthy" />
            <ExecMetric label="Governance Score" value={a.risk.governanceScore} hint="Policy observance" status="healthy" />
          </ExecMetricGrid>

          <ExecCard className="p-5">
            <ExecCardHeader title="Risk Attribution" icon={ShieldCheck} hint="What the risk controls did" />
            <div className="space-y-2">
              {a.risk.lines.map((l) => (
                <div key={l.label} className="border-b border-border/60 pb-2 last:border-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{l.label}</span>
                    <span className="font-mono text-sm tabular-nums text-trading-gold">{l.value}</span>
                  </div>
                  <p className="max-w-[80ch] text-[11px] text-muted-foreground">{l.detail}</p>
                </div>
              ))}
            </div>
          </ExecCard>

          <ExecCard className="p-5">
            <ExecCardHeader
              title="Opportunity Cost"
              icon={TrendingUp}
              action={<Link className="text-[10px] underline text-muted-foreground" to="/opportunity-analysis">Opportunity Analysis™ →</Link>}
            />
            <ExecMetricGrid cols={3}>
              <ExecMetric label="Money Protected" value={GBP(a.opportunity.moneyProtected)} hint="Correct waits" status="healthy" />
              <ExecMetric label="Money Missed" value={GBP(a.opportunity.moneyMissed)} hint="Incorrect waits" status="warning" />
              <ExecMetric label="Net Position" value={GBP(a.opportunity.netPosition)} hint="Protected − missed" status={a.opportunity.netPosition >= 0 ? 'healthy' : 'warning'} />
              <ExecMetric label="Correct Waits" value={a.opportunity.correctWaits} hint="Rejections that avoided loss" status="healthy" />
              <ExecMetric label="Incorrect Waits" value={a.opportunity.incorrectWaits} hint="Rejections that missed profit" status="watch" />
              <ExecMetric label="Largest Missed Move" value={GBP(a.opportunity.largestMissedMove.value)} hint={a.opportunity.largestMissedMove.label} status="warning" />
              <ExecMetric label="Largest Avoided Loss" value={GBP(a.opportunity.largestAvoidedLoss.value)} hint={a.opportunity.largestAvoidedLoss.label} status="healthy" />
            </ExecMetricGrid>
          </ExecCard>
        </TabsContent>

        {/* DASHBOARDS */}
        <TabsContent value="dashboards" className="mt-4 grid gap-4 xl:grid-cols-2">
          <ExecCard className="p-5">
            <ExecCardHeader title="Alpha Trend" icon={TrendingUp} hint="Daily institutional alpha (%)" />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={a.trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={AXIS} interval={4} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} />
                  <Area type="monotone" dataKey="alpha" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>

          <ExecCard className="p-5">
            <ExecCardHeader title="Institution Score &amp; Confidence Trend" icon={BrainCircuit} />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={a.trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={AXIS} interval={4} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} />
                  <Line type="monotone" dataKey="institutionScore" name="Institution Score" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="confidence" name="Confidence" stroke="hsl(var(--trading-gold))" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>

          <ExecCard className="p-5">
            <ExecCardHeader title="Capital Preservation vs Opportunity Cost" icon={ShieldCheck} hint="£ per day" />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={a.trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={AXIS} interval={4} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} formatter={(v: number) => GBP(v)} />
                  <Area type="monotone" dataKey="capitalPreserved" name="Capital preserved" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.16)" strokeWidth={2} />
                  <Area type="monotone" dataKey="opportunityCost" name="Opportunity cost" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.14)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>

          <ExecCard className="p-5">
            <ExecCardHeader title="Knowledge Growth" icon={Sparkles} hint="Linked evidence records" />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={a.trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={AXIS} interval={4} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} />
                  <Area type="monotone" dataKey="knowledge" name="Knowledge records" stroke="hsl(var(--trading-gold))" fill="hsl(var(--trading-gold) / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>

          <ExecCard className="p-5">
            <ExecCardHeader title="Specialist Contribution" icon={BarChart3} />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.specialists} margin={{ top: 8, right: 8, left: 0, bottom: 44 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={AXIS} angle={-25} textAnchor="end" interval={0} height={56} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} formatter={(v: number) => GBP(v)} />
                  <Bar dataKey="net" name="Net" radius={[4, 4, 0, 0]}>
                    {a.specialists.map((s) => <Cell key={s.name} fill={barColor(s.net)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>

          <ExecCard className="p-5">
            <ExecCardHeader title="Filter Contribution" icon={Filter} hint="Net £ per filter" />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.filters} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={AXIS} angle={-35} textAnchor="end" interval={0} height={72} />
                  <YAxis tick={AXIS} />
                  <Tooltip {...chartTooltip()} formatter={(v: number) => GBP(v)} />
                  <Bar dataKey="net" name="Net" radius={[4, 4, 0, 0]}>
                    {a.filters.map((f) => <Cell key={f.id} fill={barColor(f.net)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>
        </TabsContent>

        {/* ORACLE */}
        <TabsContent value="oracle" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {a.oracle.map((o) => (
              <ExecCard key={o.question} className="p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <BrainCircuit className="h-4 w-4 text-trading-gold" aria-hidden="true" />
                    {o.question}
                  </h3>
                  <ExecStatusPill status={o.status} />
                </div>
                <p className="max-w-[80ch] text-sm leading-relaxed text-muted-foreground">{o.answer}</p>
                <ul className="mt-3 space-y-1">
                  {o.evidence.map((e, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-muted-foreground">
                      <Link2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </ExecCard>
            ))}
          </div>
          <ExecCard className="p-5">
            <ExecCardHeader title="Knowledge Graph Links" icon={Link2} hint="Every attribution record is cross-linked" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {a.knowledgeLinks.map((k) => (
                <Link key={k.label} to={k.url} className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/40">
                  <p className="text-xs font-semibold">{k.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{k.description}</p>
                </Link>
              ))}
            </div>
          </ExecCard>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="mt-4">
          <ExecCard className="p-5">
            <ExecCardHeader title="Executive Reports" icon={FileText} hint="Deterministic, reproducible exports" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {a.reports.map((r) => (
                <div key={r.id} className="flex flex-col justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{r.description}</p>
                    <ul className="mt-2 space-y-0.5">
                      {r.sections.map((s) => (
                        <li key={s} className="text-[10px] text-muted-foreground">· {s}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-2"
                    onClick={() => downloadText(
                      `atlas-${r.id}-${new Date(a.generatedAt).toISOString().slice(0, 10)}.txt`,
                      exportAttributionReport(r, a),
                    )}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export
                  </Button>
                </div>
              ))}
            </div>
          </ExecCard>
        </TabsContent>
      </Tabs>

      <ExecGovernanceFooter text={GOVERNANCE_TEXT} />
    </div>
  );
}
