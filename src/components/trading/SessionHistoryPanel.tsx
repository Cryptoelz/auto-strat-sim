/**
 * SessionHistoryPanel — displays archived paper trading sessions.
 */
import { useState, useCallback } from 'react';
import { loadSessionHistory, deleteArchivedSession, clearSessionHistory, ArchivedSession } from '@/lib/sessionHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { History, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/performance';

export function SessionHistoryPanel() {
  const [sessions, setSessions] = useState<ArchivedSession[]>(loadSessionHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(() => setSessions(loadSessionHistory()), []);

  const handleDelete = useCallback((id: string) => {
    deleteArchivedSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    clearSessionHistory();
    setSessions([]);
  }, []);

  if (sessions.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No archived sessions yet. Sessions are automatically saved when you reset.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Session History
          <Badge variant="secondary" className="text-[10px]">{sessions.length}</Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={handleClearAll}>
          <Trash2 className="h-3 w-3 mr-1" />
          Clear All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y divide-border/50">
            {sessions.map((session) => {
              const isExpanded = expandedId === session.id;
              const isProfitable = session.totalPnl >= 0;

              return (
                <Collapsible key={session.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : session.id)}>
                  <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          <span className="font-medium">{format(session.startTime, 'MMM d, yyyy HH:mm')}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-muted-foreground">{format(session.endTime, 'MMM d HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn('font-mono font-semibold', isProfitable ? 'text-emerald-500' : 'text-red-500')}>
                            {isProfitable ? '+' : ''}{formatCurrency(session.totalPnl)}
                          </span>
                          <Badge variant={isProfitable ? 'default' : 'destructive'} className="text-[10px] h-5">
                            {session.totalTrades} trades
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Win Rate</span>
                          <span className="font-mono font-semibold">{session.winRate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Max Drawdown</span>
                          <span className="font-mono font-semibold text-red-400">{session.maxDrawdown.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Profit Factor</span>
                          <span className="font-mono font-semibold">{session.profitFactor.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Long / Short</span>
                          <span className="font-mono font-semibold">{session.longTrades} / {session.shortTrades}</span>
                        </div>
                      </div>

                      {session.trades.length > 0 && (
                        <div className="mt-3 border border-border/30 rounded overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="text-[10px]">
                                <TableHead className="h-7 px-2">Asset</TableHead>
                                <TableHead className="h-7 px-2">Dir</TableHead>
                                <TableHead className="h-7 px-2">Entry</TableHead>
                                <TableHead className="h-7 px-2">Exit</TableHead>
                                <TableHead className="h-7 px-2 text-right">PnL</TableHead>
                                <TableHead className="h-7 px-2">Reason</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {session.trades.slice(0, 10).map((trade) => (
                                <TableRow key={trade.id} className="text-[10px]">
                                  <TableCell className="py-1 px-2 font-mono">{trade.asset}</TableCell>
                                  <TableCell className="py-1 px-2">
                                    <Badge variant={trade.direction === 'long' ? 'default' : 'secondary'} className="text-[9px] h-4">
                                      {trade.direction}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-1 px-2 font-mono">${trade.entryPrice.toFixed(2)}</TableCell>
                                  <TableCell className="py-1 px-2 font-mono">${trade.exitPrice.toFixed(2)}</TableCell>
                                  <TableCell className={cn('py-1 px-2 font-mono text-right', trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                                  </TableCell>
                                  <TableCell className="py-1 px-2 text-muted-foreground">{trade.exitReason}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {session.trades.length > 10 && (
                            <p className="text-[10px] text-muted-foreground text-center py-1">
                              +{session.trades.length - 10} more trades
                            </p>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
