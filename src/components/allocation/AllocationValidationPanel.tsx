import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, XCircle, AlertTriangle, CircleDashed, ShieldCheck, ClipboardCheck,
} from 'lucide-react';
import {
  VALIDATION_SUITES, VALIDATION_SUMMARY, suiteStatus, type ValStatus,
} from '@/lib/allocationLabValidation';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC';

export function StatusBadge({ status }: { status: ValStatus }) {
  const map: Record<ValStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
    PASS: { cls: 'text-trading-profit border-trading-profit/40', Icon: CheckCircle2 },
    FAIL: { cls: 'text-trading-loss border-trading-loss/40', Icon: XCircle },
    WARNING: { cls: 'text-trading-warning border-trading-warning/40', Icon: AlertTriangle },
    'NOT TESTED': { cls: 'text-muted-foreground border-border', Icon: CircleDashed },
  };
  const { cls, Icon } = map[status];
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] whitespace-nowrap ${cls}`}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {status}
    </Badge>
  );
}

export default function AllocationValidationPanel() {
  const s = VALIDATION_SUMMARY;
  const tiles = [
    { label: 'PASS', value: s.pass, cls: 'text-trading-profit' },
    { label: 'FAIL', value: s.fail, cls: 'text-trading-loss' },
    { label: 'WARNING', value: s.warning, cls: 'text-trading-warning' },
    { label: 'NOT TESTED', value: s.notTested, cls: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-3">
      {/* Summary */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" /> Validation Suite — {s.verdict}
          </CardTitle>
          <CardDescription className="text-xs">
            9 suites · {s.total} checks · last run {fmt(s.lastRun)} · registered in the ATLAS Test &amp; Validation Centre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-md border bg-card p-3">
                <div className={`text-xl font-bold ${t.cls}`}>{t.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.label}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Evidence Score</span>
              <span className="font-medium">{s.evidenceScore}/100</span>
            </div>
            <Progress value={s.evidenceScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Suites */}
      {VALIDATION_SUITES.map((suite) => (
        <Card key={suite.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> {suite.name}
              </CardTitle>
              <StatusBadge status={suiteStatus(suite)} />
            </div>
            <CardDescription className="text-xs">{suite.purpose}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">ID</TableHead>
                  <TableHead className="min-w-[180px]">Check</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead className="w-[160px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suite.checks.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{c.id}</TableCell>
                    <TableCell className="font-medium text-xs">{c.name}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground leading-relaxed">{c.evidence}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">{fmt(c.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
