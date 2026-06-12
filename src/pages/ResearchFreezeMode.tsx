import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Snowflake, Lock, Unlock, GitFork, ShieldAlert, Sparkles, ShieldCheck, Crown,
  AlertTriangle, History, Pencil,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Research Freeze Mode
// Status ladder:
//   Research  → fully editable
//   Approved  → parameter changes require a new version
//   Champion  → locked; must fork into a new candidate
// ─────────────────────────────────────────────────────────────────────────────

type Status = 'Research' | 'Approved' | 'Champion';
type Strategy = {
  id: string;
  name: string;
  status: Status;
  createdAt: string;       // YYYY-MM-DD
  daysRunning: number;
  lastParamChange: string; // YYYY-MM-DD
  lastPromotionReview: string;
  version: string;
};

const STRATS: Strategy[] = [
  { id: 'base',  name: 'Baseline v11',      status: 'Champion',  createdAt: '2026-03-12', daysRunning: 92, lastParamChange: '2026-04-02', lastPromotionReview: '2026-06-10', version: 'v11.0' },
  { id: 'c25',   name: 'Candidate 25',      status: 'Approved',  createdAt: '2026-05-02', daysRunning: 41, lastParamChange: '2026-05-18', lastPromotionReview: '2026-06-08', version: 'v25.2' },
  { id: 'tr1',   name: 'Trend Rider v1',    status: 'Approved',  createdAt: '2026-05-11', daysRunning: 32, lastParamChange: '2026-05-22', lastPromotionReview: '2026-06-09', version: 'v1.1' },
  { id: 'mr1',   name: 'Mean Reversion v1', status: 'Approved',  createdAt: '2026-05-12', daysRunning: 31, lastParamChange: '2026-05-24', lastPromotionReview: '2026-06-09', version: 'v1.0' },
  { id: 'rtr1',  name: 'Router v1',         status: 'Approved',  createdAt: '2026-05-11', daysRunning: 32, lastParamChange: '2026-05-20', lastPromotionReview: '2026-06-10', version: 'v1.1' },
  { id: 'rtr2',  name: 'Router v2',         status: 'Research',  createdAt: '2026-05-22', daysRunning: 21, lastParamChange: '2026-06-09', lastPromotionReview: '—',           version: 'v2.0' },
];

const FREEZE_RULES: Record<Status, {
  icon: React.ReactNode;
  tone: string;
  badge: string;
  policy: string;
  cta: 'edit' | 'version' | 'fork';
}> = {
  Research:  {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    tone: 'text-muted-foreground border-border',
    badge: 'Editable',
    policy: 'Changes allowed. Parameter edits update the working draft.',
    cta: 'edit',
  },
  Approved:  {
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    tone: 'text-trading-warning border-trading-warning/40',
    badge: 'Versioned',
    policy: 'Parameter changes require creating a new version. Live config is frozen on the approved version.',
    cta: 'version',
  },
  Champion:  {
    icon: <Crown className="h-3.5 w-3.5" />,
    tone: 'text-primary border-primary/40',
    badge: 'Locked',
    policy: 'Locked. Direct changes are prohibited. Must fork into a new candidate.',
    cta: 'fork',
  },
};

function statusBadge(status: Status) {
  const cfg = FREEZE_RULES[status];
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${cfg.tone}`}>
      {cfg.icon}{status} · {cfg.badge}
    </Badge>
  );
}

function freezeIcon(status: Status) {
  if (status === 'Champion') return <Lock className="h-3.5 w-3.5 text-primary inline" />;
  if (status === 'Approved') return <Snowflake className="h-3.5 w-3.5 text-trading-warning inline" />;
  return <Unlock className="h-3.5 w-3.5 text-muted-foreground inline" />;
}

export default function ResearchFreezeMode() {
  const [target, setTarget] = useState<Strategy | null>(null);
  const counts = useMemo(() => ({
    Research: STRATS.filter((s) => s.status === 'Research').length,
    Approved: STRATS.filter((s) => s.status === 'Approved').length,
    Champion: STRATS.filter((s) => s.status === 'Champion').length,
  }), []);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-primary" /> Research Freeze Mode
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Prevents drift and over-optimization on validated strategies. Editing rules tighten as a strategy moves up the ladder.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <Badge variant="outline" className="gap-1"><Unlock className="h-3 w-3" /> {counts.Research} editable</Badge>
          <Badge variant="outline" className="gap-1 text-trading-warning border-trading-warning/40"><Snowflake className="h-3 w-3" /> {counts.Approved} versioned</Badge>
          <Badge variant="outline" className="gap-1 text-primary border-primary/40"><Lock className="h-3 w-3" /> {counts.Champion} locked</Badge>
        </div>
      </div>

      {/* Rule cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['Research', 'Approved', 'Champion'] as Status[]).map((s) => {
          const cfg = FREEZE_RULES[s];
          return (
            <Card key={s}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {cfg.icon} {s}
                </CardTitle>
                <CardDescription className="text-[11px]">{cfg.badge}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                {cfg.policy}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Strategy table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategy Freeze Status</CardTitle>
          <CardDescription className="text-xs">
            Edit actions enforce the freeze policy. Champion strategies must be forked; Approved strategies open a new version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Strategy</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Freeze</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Days Running</TableHead>
                  <TableHead>Last Param Change</TableHead>
                  <TableHead>Last Promotion Review</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {STRATS.map((s) => {
                  const cfg = FREEZE_RULES[s.status];
                  const actionLabel =
                    cfg.cta === 'edit' ? 'Edit' : cfg.cta === 'version' ? 'New Version' : 'Fork';
                  const ActionIcon = cfg.cta === 'edit' ? Pencil : cfg.cta === 'version' ? History : GitFork;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{s.version}</TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell className="text-center">{freezeIcon(s.status)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{s.createdAt}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.daysRunning}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{s.lastParamChange}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{s.lastPromotionReview}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={cfg.cta === 'edit' ? 'outline' : 'secondary'}
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setTarget(s)}
                        >
                          <ActionIcon className="h-3 w-3" />
                          {actionLabel}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit-attempt guard dialog */}
      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          {target && (() => {
            const cfg = FREEZE_RULES[target.status];
            const isLocked = target.status === 'Champion';
            const needsVersion = target.status === 'Approved';
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isLocked
                      ? <ShieldAlert className="h-4 w-4 text-trading-loss" />
                      : needsVersion
                      ? <AlertTriangle className="h-4 w-4 text-trading-warning" />
                      : <Pencil className="h-4 w-4 text-muted-foreground" />}
                    {isLocked ? 'Strategy is Locked' : needsVersion ? 'Validated Strategy' : 'Edit Strategy'}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {target.name} · {target.version} · {target.status}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs">
                  {(isLocked || needsVersion) && (
                    <div className="rounded-md border border-trading-warning/40 bg-trading-warning/5 p-3 leading-relaxed text-trading-warning">
                      <div className="font-semibold mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        You are attempting to modify a validated strategy.
                      </div>
                      <div className="text-foreground/80">
                        {isLocked
                          ? 'Champion strategies are locked to preserve historical validity. Create a fork to experiment with changes.'
                          : 'Approved strategies are frozen on their live version. Open a new version to safely make parameter changes.'}
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border border-border/60 bg-muted/30 p-3 leading-relaxed text-muted-foreground">
                    <div className="text-foreground font-medium mb-1">Freeze Policy</div>
                    {cfg.policy}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <Field label="Created" value={target.createdAt} />
                    <Field label="Days running" value={String(target.daysRunning)} />
                    <Field label="Last param change" value={target.lastParamChange} />
                    <Field label="Last review" value={target.lastPromotionReview} />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>Cancel</Button>
                  {cfg.cta === 'edit' && (
                    <Button size="sm" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> Edit Draft
                    </Button>
                  )}
                  {cfg.cta === 'version' && (
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <History className="h-3.5 w-3.5" /> Create New Version
                    </Button>
                  )}
                  {cfg.cta === 'fork' && (
                    <Button size="sm" className="gap-1.5">
                      <GitFork className="h-3.5 w-3.5" /> Fork into Candidate
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="tabular-nums">{value}</div>
    </div>
  );
}
