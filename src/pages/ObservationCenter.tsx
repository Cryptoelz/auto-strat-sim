import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Eye, Lock, Crown, Swords, Activity, Building2, CheckCircle2, AlertTriangle, MessageSquare, Clock,
} from 'lucide-react';

type Health = 'Healthy' | 'Warning' | 'Critical';

const program = {
  stage: 'OBSERVING',
  champion: 'Dynamic Allocation v1',
  challenger: 'Confidence Weighted Allocation',
  daysCompleted: 12,
  daysTotal: 30,
};

const architecture = {
  readiness: 94,
  coverage: 89,
  diversity: 84,
  maturity: 'MATURE',
  composite: 89,
};

const championHealth: { metric: string; value: string; status: Health; note: string }[] = [
  { metric: 'Net PnL',            value: '+18.6%', status: 'Healthy',  note: 'Above 30-day baseline (+15.2%).' },
  { metric: 'Profit Factor',      value: '1.82',   status: 'Healthy',  note: 'Stable above 1.50 floor for 28 sessions.' },
  { metric: 'Drawdown',           value: '3.4%',   status: 'Healthy',  note: 'Below 4% guardrail; recovering from 3.1% mid-week dip.' },
  { metric: 'Capture',            value: '67%',    status: 'Healthy',  note: 'Above 60% target; Bull-trend regime contributing most.' },
  { metric: 'Capital Efficiency', value: '0.71',   status: 'Warning',  note: 'Marginally below 0.75 target; idle cash during Sideways stretch.' },
];

const challenge = {
  leadMargin: 'Champion +1.2%',
  stability: 78,
  consecutiveLeadDays: 4,
  confidenceInterval: '±1.6%',
  promotionProbability: 0.31,
};

function healthClass(s: Health) {
  return s === 'Healthy'
    ? 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit'
    : s === 'Warning'
    ? 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning'
    : 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss';
}

// Executive verdict
const warnings = championHealth.filter((c) => c.status === 'Warning').length;
const criticals = championHealth.filter((c) => c.status === 'Critical').length;
const verdict =
  criticals > 0
    ? { label: 'Review Required',     tone: 'loss' as const,    icon: AlertTriangle }
    : warnings >= 2 || challenge.promotionProbability >= 0.6
    ? { label: 'Watch Closely',       tone: 'warning' as const, icon: Eye }
    : { label: 'Continue Observation',tone: 'profit' as const,  icon: CheckCircle2 };

const weeklyMessage = {
  changed: [
    'Champion Net PnL improved +1.4pp week-over-week, driven by Trend Rider v1 contribution.',
    'Challenger closed 0.3pp on the margin but remains behind Champion.',
    'Low-Vol Coiler v2 maintained 74% PnL share inside the Low Volatility regime.',
  ],
  attention: [
    'Capital Efficiency drifted to 0.71 (target 0.75) — idle cash during a 36-hour Sideways stretch.',
    'Challenger stability dipped from 81 → 78 after one losing session on SOL.',
  ],
  action:
    verdict.label === 'Review Required'
      ? 'Operator review required: address critical health items before next trial day rolls forward.'
      : verdict.label === 'Watch Closely'
      ? 'No action required. Monitor flagged items daily until next weekly review.'
      : 'No action required. Continue long-term observation per current cadence.',
};

export default function ObservationCenter() {
  const trialPct = Math.round((program.daysCompleted / program.daysTotal) * 100);
  const VerdictIcon = verdict.icon;

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Observation Center</h1>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            <Lock className="mr-1 h-3 w-3" /> Observation Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Long-term monitoring dashboard for the CryptoTrader program. No strategy, allocation, or promotion actions.
        </p>
      </div>

      {/* Section 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" /> Section 1 — Program Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <Stat label="Current Stage" value={program.stage} tone="primary" />
            <Stat label="Champion" value={program.champion} />
            <Stat label="Challenger" value={program.challenger} />
            <Stat label="Trial Progress" value={`${trialPct}%`} />
            <Stat label="Days Remaining" value={String(program.daysTotal - program.daysCompleted)} />
          </div>
          <Progress value={trialPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Section 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" /> Section 2 — Architecture Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Stat label="Portfolio Readiness" value={String(architecture.readiness)} />
            <Stat label="Coverage Score"      value={String(architecture.coverage)} />
            <Stat label="Diversity Score"     value={String(architecture.diversity)} />
            <Stat label="Architecture Maturity" value={architecture.maturity} tone="profit" />
            <Stat label="Composite Score"     value={String(architecture.composite)} tone="profit" />
          </div>
        </CardContent>
      </Card>

      {/* Section 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-trading-profit" /> Section 3 — Champion Health
          </CardTitle>
          <CardDescription>{program.champion}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {championHealth.map((r) => (
                <TableRow key={r.metric}>
                  <TableCell className="font-medium">{r.metric}</TableCell>
                  <TableCell className="font-mono">{r.value}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={healthClass(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Swords className="h-4 w-4 text-primary" /> Section 4 — Challenge Monitor
          </CardTitle>
          <CardDescription>{program.challenger}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <Stat label="Lead Margin"          value={challenge.leadMargin} />
            <Stat label="Stability Score"      value={String(challenge.stability)} />
            <Stat label="Consecutive Lead Days" value={String(challenge.consecutiveLeadDays)} />
            <Stat label="Confidence Interval"  value={challenge.confidenceInterval} />
            <Stat label="Promotion Probability" value={`${Math.round(challenge.promotionProbability * 100)}%`} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Promotion Probability</span>
              <span className="font-mono">{Math.round(challenge.promotionProbability * 100)}%</span>
            </div>
            <Progress value={challenge.promotionProbability * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Section 5 */}
      <Alert
        className={
          verdict.tone === 'profit'
            ? 'border-trading-profit/40 bg-trading-profit/5'
            : verdict.tone === 'warning'
            ? 'border-trading-warning/40 bg-trading-warning/5'
            : 'border-trading-loss/40 bg-trading-loss/5'
        }
      >
        <VerdictIcon
          className={
            verdict.tone === 'profit'
              ? 'h-5 w-5 text-trading-profit'
              : verdict.tone === 'warning'
              ? 'h-5 w-5 text-trading-warning'
              : 'h-5 w-5 text-trading-loss'
          }
        />
        <AlertTitle className="text-base font-semibold">
          Section 5 — Executive Message: {verdict.label}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3 text-sm">
          <Block icon={MessageSquare} title="What changed this week" items={weeklyMessage.changed} />
          <Block icon={AlertTriangle} title="What requires attention" items={weeklyMessage.attention} />
          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Action
            </div>
            <p>{weeklyMessage.action}</p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'profit' | 'loss' | 'primary' }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={
          'mt-1 text-lg font-bold ' +
          (tone === 'profit'
            ? 'text-trading-profit'
            : tone === 'loss'
            ? 'text-trading-loss'
            : tone === 'primary'
            ? 'text-primary'
            : '')
        }
      >
        {value}
      </p>
    </div>
  );
}

function Block({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
