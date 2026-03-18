import { useState, useEffect, useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DecisionLogEntry } from '@/types/trading';
import { getLogEntries, clearLog, subscribeToLog } from '@/lib/logger';
import { ASSET_INFO } from '@/config/trading';
import { format } from 'date-fns';
import { MessageSquare, Trash2 } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  opened_long: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  opened_short: 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss',
  closed_long: 'border-muted bg-muted/50 text-muted-foreground',
  closed_short: 'border-muted bg-muted/50 text-muted-foreground',
  flipped: 'border-primary/50 bg-primary/10 text-primary',
  blocked: 'border-destructive/50 bg-destructive/10 text-destructive',
  risk_pause: 'border-destructive/50 bg-destructive/10 text-destructive',
};

const ACTION_LABELS: Record<string, string> = {
  opened_long: 'LONG',
  opened_short: 'SHORT',
  closed_long: 'CLOSED',
  closed_short: 'CLOSED',
  flipped: 'FLIP',
  blocked: 'BLOCKED',
  risk_pause: 'PAUSED',
};

export function DecisionLog() {
  const entries = useSyncExternalStore(subscribeToLog, getLogEntries);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Decision Log
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLog}
              disabled={entries.length === 0}
              className="h-6 px-2"
            >
              <Trash2 className="mr-1 h-3 w-3" />Clear
            </Button>
            <Badge variant="secondary">{entries.length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {entries.length === 0 ? (
            <div className="flex h-full items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">No decisions yet — waiting for signals</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const info = ASSET_INFO[entry.asset];
                const actionClass = ACTION_COLORS[entry.action] || 'border-muted bg-muted/50 text-muted-foreground';
                const actionLabel = ACTION_LABELS[entry.action] || entry.action;

                return (
                  <div key={entry.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{info?.symbol || entry.asset}</span>
                      <Badge variant="outline" className={`${actionClass} text-[10px]`}>
                        {actionLabel}
                      </Badge>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {format(new Date(entry.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/80 leading-relaxed">
                      {entry.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
