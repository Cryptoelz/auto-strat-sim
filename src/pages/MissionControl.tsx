import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, AlertTriangle, FlaskConical, Zap, CalendarDays, Search, Moon,
  ArrowRight, TrendingUp, TrendingDown, Minus, Brain, Trophy, Layers, Eye,
  Crown, BookOpen, Gavel, CheckCircle2, Clock, Activity, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// ─── Data (simulation / research only) ───────────────────────────────────────

type Impact = 'High' | 'Medium' | 'Low';

const MISSIONS = [
  {
    rank: 1,
    title: 'Review Bull-Trend concentration in Dynamic Allocation',
    impact: 'High' as Impact,
    confidence: 84,
    reason: 'Bull Trend contributes 42% of portfolio PnL — above the 35% concentration guardrail.',
    evidence: 'Risk Radar concentration axis 42% for 18 consecutive days; Promotion Gate 7 failing.',
    next: 'Open the Allocation Studio and simulate a 5-point shift from Trend Rider to Low-Vol Coiler v2.',
    to: '/portfolio-ai-director',
    linkLabel: 'Portfolio AI Director',
  },
  {
    rank: 2,
    title: 'Advance Champion Forward Trial (Day 23 / 60)',
    impact: 'Medium' as Impact,
    confidence: 92,
    reason: 'Challenger (Confidence Weighted) leads PnL by +5.8% with a Lead Stability Score of 82.',
    evidence: 'Head-to-head: challenger wins 6 of 8 metrics; no guardrail breaches in trial to date.',
    next: 'Log today\'s battle entry and confirm the stress monitor remains GREEN.',
    to: '/champion-trial',
    linkLabel: 'Champion Trial',
  },
  {
    rank: 3,
    title: 'Monitor Capital Efficiency warning',
    impact: 'Medium' as Impact,
    confidence: 77,
    reason: 'Capital efficiency sits at 0.71 — the only Champion Health metric outside the healthy band.',
    evidence: 'Observation Center health panel flags efficiency Warning; all other metrics Healthy.',
    next: 'Check idle-capital share in the Forward Validation health monitor.',
    to: '/observation-center',
    linkLabel: 'Observation Center',
  },
  {
    rank: 4,
    title: 'Prepare Low-Vol Coiler v2 activation plan',
    impact: 'Low' as Impact,
    confidence: 73,
    reason: 'Low volatility remains the least-served regime despite v2 clearing all approval gates.',
    evidence: 'Capture lifted 60% → 64%, PF 1.74, DD 2.6%; Approval Board marked roster complete.',
    next: 'Draft a staged activation weight (≤ 12%) in the What-If Lab before any review.',
    to: '/low-vol-coiler-v2',
    linkLabel: 'Low-Vol Coiler v2',
  },
  {
    rank: 5,
    title: 'Re-check Momentum Scalper v2 degradation flag',
    impact: 'Medium' as Impact,
    confidence: 69,
    reason: 'PF drifted 1.82 → 1.52 across recent low-volatility sessions.',
    evidence: 'Degradation engine flagged MS v2 and Mean Reversion v1 with Warning status.',
    next: 'Confirm the regime activation gate is correctly disabling MS v2 in chop.',
    to: '/momentum-scalper-v2',
    linkLabel: 'Momentum Scalper v2',
  },
];

const ATTENTION = [
  { severity: 'high', category: 'Concentration', title: 'Bull Trend concentration at 42%', detail: 'Above the 35% ceiling for 18 consecutive days. Primary promotion blocker.', to: '/allocation-production-path' },
  { severity: 'high', category: 'Promotion Gate', title: '6 of 9 promotion gates passing', detail: 'Concentration, minimum runtime and trade-count gates remain open. Forecast probability 58%.', to: '/allocation-production-path' },
  { severity: 'medium', category: 'Degradation', title: 'Momentum Scalper v2 PF decline', detail: 'Rolling PF 1.82 → 1.52 over recent low-vol sessions; watch the activation gate precision.', to: '/momentum-scalper-v2' },
  { severity: 'medium', category: 'Capital Efficiency', title: 'Efficiency 0.71 (Warning band)', detail: 'Idle capital rising during disabled-specialist windows.', to: '/forward-validation' },
  { severity: 'medium', category: 'Champion Trial', title: 'Milestone: Day 23 of 60', detail: 'Next milestone Day 30 — interim stability review and weekly report generation.', to: '/champion-trial' },
  { severity: 'low', category: 'Portfolio Health', title: 'Health 86 / 100 — stable', detail: 'No decline week-over-week. Two specialists on Warning, none Critical.', to: '/observation-center' },
  { severity: 'low', category: 'Governance', title: 'No governance breaches', detail: 'Zero guardrail trips during the current trial window. Observation lock intact.', to: '/governance' },
];

const RESEARCH_ACTIVITY = {
  completed: [
    'Trade Frequency Opportunity Audit',
    'Momentum Scalper v2 Regime Activation Audit',
    'VCB v1 full validation suite',
    'Low-Vol Coiler v2 capture audit',
    'Portfolio Architecture Review',
  ],
  validations: [
    { name: 'Champion Forward Trial', progress: 38, note: 'Day 23 of 60' },
    { name: 'Forward Validation (60-day streak)', progress: 20, note: '12 of 60 consecutive days' },
    { name: 'Router v2.1 fork observation', progress: 45, note: '27 of 60 days, 14 of 20 trades' },
  ],
  journal: [
    { date: '31 Jul 2026', text: 'Low-Vol Coiler v2 approved — aggregate capture 64%, PF 1.74.' },
    { date: '29 Jul 2026', text: 'Specialist roster declared complete; coverage gap reduced to 9%.' },
    { date: '26 Jul 2026', text: 'Architecture Review returned Mature (composite 89).' },
    { date: '22 Jul 2026', text: 'Confidence Weighted Allocation awarded research champion status.' },
  ],
  reports: [
    { name: 'Monthly Research Report — July 2026', to: '/monthly-report' },
    { name: 'Executive Program Status', to: '/executive-program-status' },
    { name: 'Weekly Review pack', to: '/weekly-review' },
  ],
};

const QUICK_COMMANDS = [
  { label: 'Portfolio AI Director', to: '/portfolio-ai-director', icon: Brain },
  { label: 'Championship', to: '/championship', icon: Trophy },
  { label: 'Allocation Lab', to: '/allocation-lab', icon: Layers },
  { label: 'Observation Centre', to: '/observation-center', icon: Eye },
  { label: 'Production Path', to: '/allocation-production-path', icon: Rocket },
  { label: 'Executive Dashboard', to: '/executive', icon: Crown },
  { label: 'Journal', to: '/journal', icon: BookOpen },
  { label: 'Promotion Board', to: '/promotion-board', icon: Gavel },
];

const CALENDAR = {
  today: [
    'Log Champion Trial day 23 battle entry',
    'Review Bull concentration in Allocation Studio',
    'Confirm degradation flags on MS v2',
  ],
  week: [
    { day: 'Mon', item: 'Weekly stability report — Champion Trial' },
    { day: 'Wed', item: 'Specialist Championship Elo recalculation' },
    { day: 'Thu', item: 'Capital efficiency deep-dive (Forward Validation)' },
    { day: 'Fri', item: 'Research Journal weekly consolidation' },
  ],
  governance: [
    { date: '07 Aug 2026', item: 'Governance review — guardrail thresholds' },
    { date: '14 Aug 2026', item: 'Promotion Board interim reading (observation)' },
  ],
  deadlines: [
    { date: '07 Aug 2026', item: 'Champion Trial Day 30 milestone' },
    { date: '06 Sep 2026', item: 'Champion Trial Day 60 completion' },
  ],
  forecast: [
    { date: '06 Sep 2026', item: 'Estimated earliest promotion date — 58% probability' },
  ],
};

const SEARCH_INDEX: { title: string; category: string; to: string; keywords: string }[] = [
  { title: 'Router v2.1 (fork)', category: 'Strategies', to: '/router-v21', keywords: 'router threshold reduction fork' },
  { title: 'Trend Rider v1', category: 'Specialists', to: '/strategies', keywords: 'trend rider bull bear specialist' },
  { title: 'Momentum Scalper v1', category: 'Specialists', to: '/momentum-scalper', keywords: 'momentum scalper breakout atr' },
  { title: 'Momentum Scalper v2', category: 'Specialists', to: '/momentum-scalper-v2', keywords: 'momentum scalper regime activation gate' },
  { title: 'VCB v1', category: 'Specialists', to: '/vcb-v1', keywords: 'volatility compression breakout bollinger squeeze' },
  { title: 'Low-Vol Coiler v1', category: 'Specialists', to: '/low-vol-coiler-v1', keywords: 'low vol coiler compression persistence' },
  { title: 'Low-Vol Coiler v2', category: 'Specialists', to: '/low-vol-coiler-v2', keywords: 'low vol coiler capture xrp sol' },
  { title: 'Research Journal', category: 'Journal', to: '/journal', keywords: 'journal entries notes log' },
  { title: 'Monthly Research Report', category: 'Reports', to: '/monthly-report', keywords: 'monthly report executive summary' },
  { title: 'Weekly Review', category: 'Reports', to: '/weekly-review', keywords: 'weekly review pdf export' },
  { title: 'Portfolio Architecture Review', category: 'Architecture', to: '/portfolio-architecture-review', keywords: 'architecture layers maturity spof redundancy' },
  { title: 'Specialist Approval Board', category: 'Architecture', to: '/specialist-approval-board', keywords: 'roster coverage diversity readiness' },
  { title: 'Specialist Discovery Lab v2', category: 'Validation', to: '/specialist-discovery-v2', keywords: 'discovery gap scanner overlap idea generator' },
  { title: 'Forward Validation', category: 'Validation', to: '/forward-validation', keywords: 'forward validation health degradation streak' },
  { title: 'Champion Forward Trial', category: 'Validation', to: '/champion-trial', keywords: 'champion trial challenger stress defense' },
  { title: 'Trade Frequency Audit', category: 'Validation', to: '/trade-frequency', keywords: 'frequency thresholds missed moves' },
  { title: 'Promotion Review Board', category: 'Promotion', to: '/promotion-board', keywords: 'promotion board candidates gates' },
  { title: 'Allocation Production Path', category: 'Promotion', to: '/allocation-production-path', keywords: 'promotion ladder forecast probability stages' },
  { title: 'Governance', category: 'Governance', to: '/governance', keywords: 'governance guardrails health state' },
  { title: 'Operator Controls', category: 'Governance', to: '/operator-controls', keywords: 'autonomy override operator policy' },
  { title: 'Specialist Allocation Lab v1', category: 'Allocation', to: '/allocation-lab', keywords: 'equal regime dynamic allocation' },
  { title: 'Specialist Allocation Lab v2', category: 'Allocation', to: '/allocation-lab-v2', keywords: 'confidence weighted rolling purity allocation' },
  { title: 'Portfolio AI Director', category: 'Allocation', to: '/portfolio-ai-director', keywords: 'director studio scenario debate knowledge graph' },
  { title: 'Specialist Championship', category: 'Strategies', to: '/specialist-championship', keywords: 'elo belt champion defences' },
  { title: 'Observation Center', category: 'Governance', to: '/observation-center', keywords: 'observation health challenge monitor' },
  { title: 'Executive Program Status', category: 'Reports', to: '/executive-program-status', keywords: 'program status pipeline verdict' },
];

const EOD = {
  changed: [
    'Champion Trial advanced to Day 23; challenger lead widened to +5.8%.',
    'Portfolio confidence increased 4 points to 71.',
    'Momentum Scalper v2 rolling PF slipped to 1.52 (Warning).',
    'No change to architecture maturity or governance status.',
  ],
  improvement: 'Lead Stability Score climbed to 82 — the challenger has now held the lead for five consecutive sessions with no guardrail trips.',
  concern: 'Bull Trend concentration remains at 42% for an 18th consecutive day, holding the promotion probability at 58%.',
  tomorrow: [
    'Simulate a 5-point de-concentration shift in the Allocation Studio.',
    'Verify Momentum Scalper v2 activation precision in low-vol windows.',
    'Prepare the Day 30 interim stability report template.',
  ],
  recommendation: 'Continue Observation. No production changes recommended.',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const impactTone: Record<Impact, string> = {
  High: 'border-destructive/40 bg-destructive/10 text-destructive',
  Medium: 'border-primary/40 bg-primary/10 text-primary',
  Low: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

const sevTone: Record<string, string> = {
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-primary/40 bg-primary/10 text-primary',
  low: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MissionControl() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.keywords.includes(q)
    ).slice(0, 12);
  }, [query]);

  const attention = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return [...ATTENTION].sort((a, b) => order[a.severity] - order[b.severity]);
  }, []);

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <header className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold tracking-tight sm:text-2xl">Mission Control™</h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              The operational home of CryptoTrader™ — answering one question: what should I do today?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-[10px]">OBSERVATION ONLY</Badge>
            <Badge variant="outline" className="text-[10px]">RESEARCH ONLY</Badge>
            <Badge variant="outline" className="text-[10px]">SIMULATION ONLY</Badge>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Portfolio Health', value: '86 / 100' },
            { label: 'Champion Trial', value: 'Day 23 / 60' },
            { label: 'Promotion Probability', value: '58%' },
            { label: 'Governance', value: 'No breaches' },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-border/60 bg-background/40 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-sm font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Section 1 — Today's Mission */}
      <Card>
        <CardHeader className="pb-3">
          <SectionTitle icon={Rocket} title="Today's Mission" subtitle="Five highest-priority actions, ranked by expected impact." />
        </CardHeader>
        <CardContent className="space-y-3">
          {MISSIONS.map((m) => (
            <div key={m.rank} className="rounded-md border border-border/60 bg-card/50 p-3 transition-colors hover:border-primary/40">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs font-bold text-primary">
                    {m.rank}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{m.title}</div>
                    <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-foreground">Why: </span>{m.reason}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground"><span className="font-medium text-foreground">Evidence: </span>{m.evidence}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground"><span className="font-medium text-foreground">Next step: </span>{m.next}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={`text-[10px] ${impactTone[m.impact]}`}>{m.impact} impact</Badge>
                  <span className="text-[10px] text-muted-foreground">Confidence {m.confidence}%</span>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                    <Link to={m.to}>{m.linkLabel} <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 2 — Attention Required */}
      <Card>
        <CardHeader className="pb-3">
          <SectionTitle icon={AlertTriangle} title="Attention Required" subtitle="Automatically detected signals across gates, health, risk and governance." />
        </CardHeader>
        <CardContent className="space-y-2">
          {attention.map((a) => (
            <Link
              key={a.title}
              to={a.to}
              className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-card/50 p-3 transition-colors hover:border-primary/40"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${sevTone[a.severity]}`}>{a.severity.toUpperCase()}</Badge>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.category}</span>
                </div>
                <div className="mt-1 text-sm font-medium">{a.title}</div>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Section 3 — Research Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <SectionTitle icon={FlaskConical} title="Research Activity" subtitle="Completed experiments and live validation progress." />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Experiments completed</div>
              <ul className="space-y-1">
                {RESEARCH_ACTIVITY.completed.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />{c}
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Active validations</div>
              <div className="space-y-3">
                {RESEARCH_ACTIVITY.validations.map((v) => (
                  <div key={v.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span>{v.name}</span>
                      <span className="text-muted-foreground">{v.note}</span>
                    </div>
                    <Progress value={v.progress} className="mt-1 h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <SectionTitle icon={BookOpen} title="Journal & Reports" subtitle="Latest journal entries and newly generated executive reports." />
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {RESEARCH_ACTIVITY.journal.map((j) => (
                <li key={j.date} className="border-l-2 border-primary/40 pl-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{j.date}</div>
                  <div className="text-xs">{j.text}</div>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="space-y-1">
              {RESEARCH_ACTIVITY.reports.map((r) => (
                <Link key={r.name} to={r.to} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-xs transition-colors hover:border-primary/40">
                  <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" />{r.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 4 — Quick Commands */}
      <Card>
        <CardHeader className="pb-3">
          <SectionTitle icon={Zap} title="Quick Commands" subtitle="One-click navigation across the research ecosystem." />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_COMMANDS.map((q) => (
              <Button key={q.to} asChild variant="outline" className="h-auto justify-start gap-2 py-3 text-xs">
                <Link to={q.to}>
                  <q.icon className="h-4 w-4 text-primary" />
                  <span className="truncate">{q.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5 — Research Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <SectionTitle icon={CalendarDays} title="Research Calendar" subtitle="Today, this week, governance reviews, trial deadlines and promotion forecast." />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md border border-border/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium"><Clock className="h-3.5 w-3.5 text-primary" />Today's work</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {CALENDAR.today.map((t) => <li key={t}>• {t}</li>)}
            </ul>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium"><Activity className="h-3.5 w-3.5 text-primary" />This week's milestones</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {CALENDAR.week.map((w) => (
                <li key={w.day}><span className="font-medium text-foreground">{w.day}</span> — {w.item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium"><Gavel className="h-3.5 w-3.5 text-primary" />Governance reviews</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {CALENDAR.governance.map((g) => (
                <li key={g.date}><span className="font-medium text-foreground">{g.date}</span> — {g.item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium"><Trophy className="h-3.5 w-3.5 text-primary" />Champion trial deadlines</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {CALENDAR.deadlines.map((d) => (
                <li key={d.date}><span className="font-medium text-foreground">{d.date}</span> — {d.item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium"><Rocket className="h-3.5 w-3.5 text-primary" />Promotion forecast</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {CALENDAR.forecast.map((f) => (
                <li key={f.date}><span className="font-medium text-foreground">{f.date}</span> — {f.item}</li>
              ))}
            </ul>
            <Progress value={58} className="mt-2 h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Section 6 — Knowledge Search */}
      <Card>
        <CardHeader className="pb-3">
          <SectionTitle icon={Search} title="Knowledge Search" subtitle="Search strategies, specialists, journal, architecture, validation, promotion, governance, allocation and reports." />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the research ecosystem…"
              className="pl-9"
              aria-label="Knowledge search"
            />
          </div>
          {query.trim() && (
            <div className="space-y-1">
              {results.length === 0 && <p className="text-xs text-muted-foreground">No matches found.</p>}
              {results.map((r) => (
                <Link key={r.to + r.title} to={r.to} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-xs transition-colors hover:border-primary/40">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                    {r.title}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 7 — End of Day Summary */}
      <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3">
          <SectionTitle icon={Moon} title="End of Day Summary" subtitle="Automatic executive close for the current research session." />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">What changed today</div>
            <ul className="space-y-1 text-xs">
              {EOD.changed.map((c) => <li key={c} className="flex gap-2"><Minus className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />{c}</li>)}
            </ul>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border/60 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium"><TrendingUp className="h-3.5 w-3.5 text-primary" />Biggest improvement</div>
              <p className="text-xs text-muted-foreground">{EOD.improvement}</p>
            </div>
            <div className="rounded-md border border-destructive/30 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium"><TrendingDown className="h-3.5 w-3.5 text-destructive" />Biggest concern</div>
              <p className="text-xs text-muted-foreground">{EOD.concern}</p>
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Tomorrow's priorities</div>
            <ol className="space-y-1 text-xs text-muted-foreground">
              {EOD.tomorrow.map((t, i) => <li key={t}>{i + 1}. {t}</li>)}
            </ol>
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/10 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Overall recommendation</div>
            <div className="text-sm font-semibold text-primary">{EOD.recommendation}</div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Simulation only — no live trading, no execution, no production allocation changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
