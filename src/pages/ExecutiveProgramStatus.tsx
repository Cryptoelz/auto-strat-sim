import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ClipboardCheck, Lock, Crown, Swords, GitBranch, CheckCircle2, Clock, Building2, Trophy,
} from 'lucide-react';

const arch = {
  approvedSpecialists: 5,
  regimeCoverage: '5 / 5',
  portfolioReadiness: 94,
  architectureMaturity: 'MATURE',
  composite: 89,
};

const champion = {
  name: 'Dynamic Allocation v1',
  netPnl: '+18.6%',
  pf: 1.82,
  drawdown: '3.4%',
  capture: '67%',
  sharpe: 1.94,
  capitalEfficiency: 0.71,
};

const challenger = {
  name: 'Confidence Weighted Allocation',
  daysCompleted: 12,
  daysTotal: 30,
  currentLead: 'Champion',
  leadMargin: '+1.2%',
  stability: 78,
};

const pipeline = {
  completed: [
    'Specialist Program',
    'Allocation Lab v1',
    'Allocation Lab v2',
    'Forward Validation',
    'Championship Framework',
    'Approval Board',
  ],
  active: ['Champion Trial'],
  future: ['None Required'],
};

const verdictScore = Math.round(
  0.35 * arch.composite + 0.25 * arch.portfolioReadiness + 0.20 * challenger.stability + 0.20 * 80,
);

const verdict =
  verdictScore >= 92
    ? { label: 'READY FOR PAPER CAPITAL', tone: 'profit' as const, text: 'Architecture mature, champion validated, challenger trial concluding. Program meets executive thresholds for paper-capital staging.' }
    : verdictScore >= 85
    ? { label: 'OBSERVING', tone: 'primary' as const, text: 'Architecture mature and stable. Champion in active trial against challenger. Long-horizon observation in progress.' }
    : verdictScore >= 75
    ? { label: 'VALIDATING', tone: 'warning' as const, text: 'Core architecture in place; validation cycles still underway.' }
    : { label: 'BUILDING', tone: 'warning' as const, text: 'Program still under construction. Additional research milestones required.' };

export default function ExecutiveProgramStatus() {
  const trialPct = Math.round((challenger.daysCompleted / challenger.daysTotal) * 100);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Executive Trading Program Status</h1>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            <Lock className="mr-1 h-3 w-3" /> Observation Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Single-page executive summary of the entire CryptoTrader research program.
        </p>
      </div>

      {/* Section 1 - Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" /> Section 1 — Architecture Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Stat label="Approved Specialists" value={String(arch.approvedSpecialists)} />
            <Stat label="Regime Coverage" value={arch.regimeCoverage} />
            <Stat label="Portfolio Readiness" value={String(arch.portfolioReadiness)} />
            <Stat label="Architecture Maturity" value={arch.architectureMaturity} tone="profit" />
            <Stat label="Composite Score" value={String(arch.composite)} tone="profit" />
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Champion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-trading-profit" /> Section 2 — Current Champion
          </CardTitle>
          <CardDescription>{champion.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <Stat label="Net PnL" value={champion.netPnl} tone="profit" />
            <Stat label="Profit Factor" value={String(champion.pf)} />
            <Stat label="Drawdown" value={champion.drawdown} />
            <Stat label="Capture" value={champion.capture} />
            <Stat label="Sharpe-like" value={String(champion.sharpe)} />
            <Stat label="Capital Efficiency" value={String(champion.capitalEfficiency)} />
          </div>
        </CardContent>
      </Card>

      {/* Section 3 - Challenger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Swords className="h-4 w-4 text-primary" /> Section 3 — Active Challenger
          </CardTitle>
          <CardDescription>{challenger.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <Stat label="Days Completed" value={String(challenger.daysCompleted)} />
            <Stat label="Days Remaining" value={String(challenger.daysTotal - challenger.daysCompleted)} />
            <Stat label="Current Lead" value={challenger.currentLead} />
            <Stat label="Lead Margin" value={challenger.leadMargin} tone="profit" />
            <Stat label="Stability Score" value={String(challenger.stability)} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Trial Progress</span>
              <span className="font-mono">{trialPct}%</span>
            </div>
            <Progress value={trialPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Section 4 - Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-primary" /> Section 4 — Research Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-trading-profit" /> Completed
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {pipeline.completed.map((p) => (
                      <Badge key={p} variant="outline" className="border-trading-profit/40 bg-trading-profit/10 text-trading-profit">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-trading-profit">Done</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Active
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {pipeline.active.map((p) => (
                      <Badge key={p} variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-primary">In Progress</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" /> Future
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {pipeline.future.map((p) => (
                      <Badge key={p} variant="outline" className="border-border/60 bg-muted/30 text-muted-foreground">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 5 - Verdict */}
      <Alert
        className={
          verdict.tone === 'profit'
            ? 'border-trading-profit/40 bg-trading-profit/5'
            : verdict.tone === 'primary'
            ? 'border-primary/40 bg-primary/5'
            : 'border-trading-warning/40 bg-trading-warning/5'
        }
      >
        {verdict.tone === 'profit' ? (
          <CheckCircle2 className="h-5 w-5 text-trading-profit" />
        ) : verdict.tone === 'primary' ? (
          <ClipboardCheck className="h-5 w-5 text-primary" />
        ) : (
          <Clock className="h-5 w-5 text-trading-warning" />
        )}
        <AlertTitle className="text-base font-semibold">
          Section 5 — Executive Verdict: {verdict.label}
        </AlertTitle>
        <AlertDescription className="mt-1 text-sm">
          {verdict.text} Composite program score: <span className="font-semibold">{verdictScore}</span>.
          Observation-only output. No strategy, allocation, promotion, or live-trading changes are issued from this summary.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'profit' | 'loss' }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={
          'mt-1 text-lg font-bold ' +
          (tone === 'profit' ? 'text-trading-profit' : tone === 'loss' ? 'text-trading-loss' : '')
        }
      >
        {value}
      </p>
    </div>
  );
}
