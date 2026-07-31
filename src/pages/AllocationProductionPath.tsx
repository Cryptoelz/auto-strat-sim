import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Rocket, Lock, Shield, CheckCircle2, XCircle, AlertTriangle, Activity,
  Layers, Gauge, Timer, Ban, ArrowRight, Crown,
} from 'lucide-react';

// ── Stage ladder: research → paper capital ────────────────────────────
type Stage = {
  id: number;
  name: string;
  purpose: string;
  duration: string;
  capital: string;
  status: 'Complete' | 'Active' | 'Locked';
  exit: string;
};

const STAGES: Stage[] = [
  { id: 1, name: 'S1 · Research Validation', purpose: 'Isolated 90-day sandbox proof of allocation edge', duration: '90 days', capital: '0% (sim)', status: 'Complete', exit: 'PF > 1.90, DD < 3.0%' },
  { id: 2, name: 'S2 · Forward Trial', purpose: 'Confidence Weighted vs Dynamic v1 head-to-head', duration: '60 days', capital: '0% (sim)', status: 'Active', exit: '60 days + 50 trades, lead held' },
  { id: 3, name: 'S3 · Shadow Allocation', purpose: 'Allocator runs beside Router v2.1, decisions logged not executed', duration: '30 days', capital: '0% (shadow)', status: 'Locked', exit: 'Decision agreement > 90%, zero guard breaches' },
  { id: 4, name: 'S4 · Paper Capital Ramp', purpose: 'Staged simulated capital 25% → 50% → 100%', duration: '45 days', capital: '25–100% (paper)', status: 'Locked', exit: 'PF > 1.80 at each rung, DD < 3.0%' },
  { id: 5, name: 'S5 · Steady-State Operation', purpose: 'Allocator is primary paper allocator, Router v2.1 as fallback', duration: 'Ongoing', capital: '100% (paper)', status: 'Locked', exit: 'Continuous health monitoring' },
];

// ── Promotion gates ───────────────────────────────────────────────────
type Gate = {
  gate: string;
  requirement: string;
  current: string;
  pass: boolean | null;
};

const GATES: Gate[] = [
  { gate: 'Profit Factor',        requirement: '> 1.90 over trial window', current: '2.04',        pass: true },
  { gate: 'Max Drawdown',         requirement: '< 3.0%',                   current: '2.6%',        pass: true },
  { gate: 'Win Rate',             requirement: '> 52%',                    current: '57.4%',       pass: true },
  { gate: 'Move Capture',         requirement: '> 70%',                    current: '76%',         pass: true },
  { gate: 'Trial Duration',       requirement: '60 consecutive days',      current: '23 / 60',     pass: null },
  { gate: 'Trade Count',          requirement: '50 closed trades',         current: '31 / 50',     pass: null },
  { gate: 'Lead Stability Score', requirement: '> 75 / 100',               current: '82',          pass: true },
  { gate: 'Regime Concentration', requirement: 'No regime > 40% of PnL',   current: '42% (Bull)',  pass: false },
  { gate: 'Guardrail Breaches',   requirement: 'Zero hard-stop breaches',  current: '0',           pass: true },
];

// ── Capital ramp rungs ────────────────────────────────────────────────
type Rung = {
  rung: string;
  allocation: string;
  minDays: number;
  holdCriteria: string;
  rollback: string;
  state: 'Locked' | 'Pending' | 'Active';
};

const RAMP: Rung[] = [
  { rung: 'Ramp 0 · Shadow', allocation: '0%',   minDays: 30, holdCriteria: 'Decision agreement > 90%', rollback: 'Return to S2 trial', state: 'Locked' },
  { rung: 'Ramp 1',          allocation: '25%',  minDays: 15, holdCriteria: 'PF > 1.80, DD < 3.0%',     rollback: 'Drop to shadow',     state: 'Locked' },
  { rung: 'Ramp 2',          allocation: '50%',  minDays: 15, holdCriteria: 'PF > 1.80, DD < 3.0%',     rollback: 'Drop to Ramp 1',     state: 'Locked' },
  { rung: 'Ramp 3',          allocation: '100%', minDays: 15, holdCriteria: 'PF > 1.80, DD < 3.0%',     rollback: 'Drop to Ramp 2',     state: 'Locked' },
];

// ── Operational guardrails ────────────────────────────────────────────
type Guard = {
  guard: string;
  threshold: string;
  action: string;
  severity: 'Hard Stop' | 'Throttle' | 'Alert';
};

const GUARDS: Guard[] = [
  { guard: 'Portfolio drawdown',        threshold: '≥ 3.0% peak-to-trough', action: 'Halt all specialists, revert to Router v2.1', severity: 'Hard Stop' },
  { guard: 'Rolling 14d PF',            threshold: '< 1.50',                action: 'Drop one ramp rung',                          severity: 'Throttle' },
  { guard: 'Consecutive losing days',   threshold: '5 days',                action: 'Halve allocation until PF recovers',          severity: 'Throttle' },
  { guard: 'Specialist PF collapse',    threshold: 'Any specialist < 1.00 over 30d', action: 'Deactivate that specialist only',    severity: 'Throttle' },
  { guard: 'Regime detector disagreement', threshold: '> 15% of sessions',  action: 'Freeze allocation weights at last stable set', severity: 'Alert' },
  { guard: 'Data feed gap',             threshold: '> 3 missed candles',    action: 'Suspend new entries until feed restored',     severity: 'Hard Stop' },
];

// ── Rollout owner checklist ───────────────────────────────────────────
const CHECKLIST = [
  { item: 'Allocation weights snapshotted and version-tagged', done: true },
  { item: 'Regime detector confidence logging enabled', done: true },
  { item: 'Per-specialist kill switch wired into allocator', done: true },
  { item: 'Shadow decision log schema defined', done: true },
  { item: 'Bull-regime concentration mitigation designed', done: false },
  { item: 'Ramp rollback runbook signed off', done: false },
  { item: '60-day trial completion', done: false },
];

const statusBadge = (s: Stage['status']) =>
  s === 'Complete' ? <Badge className="bg-primary/15 text-primary border-primary/30">Complete</Badge>
  : s === 'Active' ? <Badge className="bg-accent/15 text-accent-foreground border-accent/40">Active</Badge>
  : <Badge variant="outline" className="text-muted-foreground"><Lock className="h-3 w-3 mr-1" />Locked</Badge>;

const gateIcon = (p: boolean | null) =>
  p === true ? <CheckCircle2 className="h-4 w-4 text-primary" />
  : p === false ? <XCircle className="h-4 w-4 text-destructive" />
  : <Timer className="h-4 w-4 text-muted-foreground" />;

export default function AllocationProductionPath() {
  const passed = GATES.filter(g => g.pass === true).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            Allocation Production Path
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Governance route that takes Dynamic / Confidence Weighted Allocation from the Specialist
            Allocation Lab to a primary paper-capital allocator — staged, gated and reversible.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Shield className="h-3 w-3 mr-1" /> Simulation Only · No Live Capital
          </Badge>
          <Badge variant="outline">Stage 2 of 5 · Forward Trial</Badge>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Current Stage</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S2 · Forward Trial</div>
            <Progress value={38} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">Day 23 of 60 · 31 of 50 trades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Promotion Gates</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passed} / {GATES.length}</div>
            <p className="text-xs text-muted-foreground mt-2">1 failing · 2 time-based pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Paper Capital Engaged</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground mt-2">Ramp locked until S3 clears</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Earliest Ramp 1 Date</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+67 days</div>
            <p className="text-xs text-muted-foreground mt-2">37d trial remaining + 30d shadow</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stages">
        <TabsList>
          <TabsTrigger value="stages">Stage Ladder</TabsTrigger>
          <TabsTrigger value="gates">Promotion Gates</TabsTrigger>
          <TabsTrigger value="ramp">Capital Ramp</TabsTrigger>
          <TabsTrigger value="guards">Guardrails</TabsTrigger>
          <TabsTrigger value="checklist">Readiness</TabsTrigger>
        </TabsList>

        {/* Stages */}
        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Five-Stage Promotion Ladder</CardTitle>
              <CardDescription>Each stage has a fixed exit condition. No stage can be skipped or shortened.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {STAGES.map(s => (
                <div key={s.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold">{s.name}</div>
                    {statusBadge(s.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.purpose}</p>
                  <div className="grid gap-2 sm:grid-cols-3 mt-3 text-xs">
                    <div><span className="text-muted-foreground">Duration: </span>{s.duration}</div>
                    <div><span className="text-muted-foreground">Capital: </span>{s.capital}</div>
                    <div className="flex items-center gap-1"><ArrowRight className="h-3 w-3 text-muted-foreground" />{s.exit}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gates */}
        <TabsContent value="gates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" /> Stage 2 → Stage 3 Gates</CardTitle>
              <CardDescription>All gates must read pass simultaneously on the final trial day.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gate</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GATES.map(g => (
                    <TableRow key={g.gate}>
                      <TableCell className="font-medium">{g.gate}</TableCell>
                      <TableCell className="text-muted-foreground">{g.requirement}</TableCell>
                      <TableCell className="font-mono">{g.current}</TableCell>
                      <TableCell className="flex justify-end">{gateIcon(g.pass)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-destructive" /> Blocking Finding</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Bull Trend contributes 42% of challenger PnL, above the 40% concentration ceiling. Promotion to
              Shadow Allocation stays blocked until either the trial rebalances naturally across regimes or the
              allocator caps single-regime weight exposure.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ramp */}
        <TabsContent value="ramp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Paper Capital Ramp Schedule</CardTitle>
              <CardDescription>Each rung holds a minimum period and can only step down, never skip up.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rung</TableHead>
                    <TableHead>Allocation</TableHead>
                    <TableHead>Min Days</TableHead>
                    <TableHead>Hold Criteria</TableHead>
                    <TableHead>Rollback</TableHead>
                    <TableHead className="text-right">State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RAMP.map(r => (
                    <TableRow key={r.rung}>
                      <TableCell className="font-medium">{r.rung}</TableCell>
                      <TableCell className="font-mono">{r.allocation}</TableCell>
                      <TableCell>{r.minDays}</TableCell>
                      <TableCell className="text-muted-foreground">{r.holdCriteria}</TableCell>
                      <TableCell className="text-muted-foreground">{r.rollback}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-muted-foreground"><Lock className="h-3 w-3 mr-1" />{r.state}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guards */}
        <TabsContent value="guards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ban className="h-5 w-5" /> Operational Guardrails</CardTitle>
              <CardDescription>Automatic responses once the allocator holds paper capital.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guardrail</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Automatic Action</TableHead>
                    <TableHead className="text-right">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GUARDS.map(g => (
                    <TableRow key={g.guard}>
                      <TableCell className="font-medium">{g.guard}</TableCell>
                      <TableCell className="font-mono text-xs">{g.threshold}</TableCell>
                      <TableCell className="text-muted-foreground">{g.action}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={g.severity === 'Hard Stop' ? 'destructive' : 'outline'}>{g.severity}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Rollout Readiness Checklist</CardTitle>
              <CardDescription>{CHECKLIST.filter(c => c.done).length} of {CHECKLIST.length} items complete.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {CHECKLIST.map(c => (
                <div key={c.item} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  {c.done ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Timer className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className={c.done ? '' : 'text-muted-foreground'}>{c.item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Crown className="h-4 w-4 text-primary" /> Executive Verdict</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">On Track — Promotion Blocked (time + concentration).</span>{' '}
              The allocator clears every performance gate but cannot advance to Shadow Allocation before
              day 60 of the trial and resolution of the Bull-regime concentration finding. No paper capital
              is engaged and all execution remains simulated.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
