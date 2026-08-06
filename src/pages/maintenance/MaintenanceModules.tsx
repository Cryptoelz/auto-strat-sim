import { MaintenancePage, StatusPill, StatCard } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { getModules } from '@/lib/maintenance';
import { ExternalLink } from 'lucide-react';

export default function MaintenanceModules() {
  const modules = getModules();
  const green = modules.filter((m) => m.status === 'healthy').length;
  const amber = modules.filter((m) => m.status === 'watch').length;
  const red = modules.filter((m) => m.status === 'warning' || m.status === 'critical').length;

  return (
    <MaintenancePage
      title="Module Health Monitor"
      subtitle="Every ATLAS OS module is automatically inspected each cycle for health, performance, errors, warnings, broken links and dependency integrity."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Modules Inspected" value={modules.length} />
        <StatCard label="Green" value={green} tone="good" />
        <StatCard label="Amber" value={amber} tone="warn" />
        <StatCard label="Red" value={red} tone={red ? 'bad' : 'good'} />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Module Status Board</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Module</TableHead>
                <TableHead className="text-[10px]">Health</TableHead>
                <TableHead className="text-[10px]">Perf</TableHead>
                <TableHead className="text-[10px]">Errors</TableHead>
                <TableHead className="text-[10px]">Warnings</TableHead>
                <TableHead className="text-[10px]">Broken Links</TableHead>
                <TableHead className="text-[10px]">Last Checked</TableHead>
                <TableHead className="text-[10px]">Dependencies</TableHead>
                <TableHead className="text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs font-medium">
                    <Link to={m.route} className="inline-flex items-center gap-1 hover:text-primary">
                      {m.name}<ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                    <p className="text-[10px] font-normal text-muted-foreground">{m.group}</p>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{m.health}</TableCell>
                  <TableCell className="text-xs tabular-nums">{m.performance}</TableCell>
                  <TableCell className={`text-xs tabular-nums ${m.errors ? 'text-trading-loss' : ''}`}>{m.errors}</TableCell>
                  <TableCell className={`text-xs tabular-nums ${m.warnings ? 'text-trading-warning' : ''}`}>{m.warnings}</TableCell>
                  <TableCell className="text-xs tabular-nums">{m.brokenLinks}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{m.lastChecked}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{m.dependencies.join(', ')}</TableCell>
                  <TableCell><StatusPill status={m.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Inspector Notes</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {modules.map((m) => (
            <div key={m.id} className="rounded-md border border-border/50 bg-card/30 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{m.name}</span>
                <StatusPill status={m.status} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{m.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
