import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ListTree } from 'lucide-react';
import type { EngineAuditEvent } from '@/lib/audit/types';

const dash = '—';

const TYPE_STYLE: Record<string, string> = {
  blocked: 'border-trading-warning/50 bg-trading-warning/10 text-trading-warning',
  risk_pause: 'border-destructive/50 bg-destructive/10 text-destructive',
  opened_long: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  opened_short: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  closed_long: 'border-primary/50 bg-primary/10 text-primary',
  closed_short: 'border-primary/50 bg-primary/10 text-primary',
  flipped: 'border-primary/50 bg-primary/10 text-primary',
};

export function EngineAuditTable({ events }: { events: EngineAuditEvent[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ListTree className="h-4 w-4 text-primary" aria-hidden="true" />
          Genuine engine events ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No genuine engine events captured yet. Events appear here automatically as the
            simulation engine produces them — nothing is inserted manually.
          </p>
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Asset</TableHead>
                  <TableHead className="text-xs">Event type</TableHead>
                  <TableHead className="text-xs">Decision / signal</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs">Regime</TableHead>
                  <TableHead className="text-xs">Filter</TableHead>
                  <TableHead className="text-xs">CMC context</TableHead>
                  <TableHead className="text-xs">Event ID</TableHead>
                  <TableHead className="text-xs">Provenance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.eventId}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {e.backfilled ? (
                        <Badge variant="outline" className="border-muted-foreground/40 bg-muted/30 text-[10px] text-muted-foreground">
                          BACKFILLED COMPLETED TRADE
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-primary/50 bg-primary/10 text-[10px] text-primary">
                          LIVE LOGGER EVENT
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{e.asset}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${TYPE_STYLE[e.eventType] ?? ''}`}>
                        {e.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{e.signal ?? dash}</TableCell>
                    <TableCell className="max-w-[360px] text-xs text-muted-foreground">{e.explanation}</TableCell>
                    <TableCell className="text-xs">{e.regime ?? dash}</TableCell>
                    <TableCell className="text-xs">{e.filterBlocked ?? dash}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {e.contextContemporaneous === false
                        ? 'CMC CONTEXT: UNAVAILABLE — RETROSPECTIVE'
                        : 'Eligible — contemporaneous'}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{e.eventId}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {e.sourceModule} · observer only · engine modified: NO · backfilled:{' '}
                      {e.backfilled ? 'YES' : 'NO'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
