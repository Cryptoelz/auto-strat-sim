import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditEntry } from '@/lib/backtest-audit';
import { formatCurrency } from '@/lib/performance';
import { format } from 'date-fns';
import { FileSearch, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BacktestAuditPanelProps {
  audit: AuditEntry[];
}

const ACTION_COLORS: Record<string, string> = {
  OPEN_LONG: 'text-trading-profit',
  OPEN_SHORT: 'text-trading-loss',
  CLOSE_LONG: 'text-muted-foreground',
  CLOSE_SHORT: 'text-muted-foreground',
  FLIP_TO_LONG: 'text-primary',
  FLIP_TO_SHORT: 'text-primary',
  STOP_LOSS: 'text-destructive',
  TAKE_PROFIT: 'text-trading-profit',
  BLOCKED: 'text-destructive',
  HOLD: 'text-muted-foreground',
  HOLDING: 'text-muted-foreground',
  NO_SIGNAL: 'text-muted-foreground',
  COOLDOWN: 'text-muted-foreground',
  COOLDOWN_SAME_CANDLE: 'text-muted-foreground',
  INSUFFICIENT_BALANCE: 'text-destructive',
};

const REGIME_COLORS: Record<string, string> = {
  trending_bullish: 'text-trading-profit',
  trending_bearish: 'text-trading-loss',
  sideways: 'text-yellow-500',
};

export function BacktestAuditPanel({ audit }: BacktestAuditPanelProps) {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSignal, setFilterSignal] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const actionOptions = useMemo(() => {
    const actions = new Set(audit.map(a => a.action));
    return Array.from(actions).sort();
  }, [audit]);

  const filteredAudit = useMemo(() => {
    return audit.filter(entry => {
      if (filterAction !== 'all' && entry.action !== filterAction) return false;
      if (filterSignal !== 'all' && entry.signal !== filterSignal) return false;
      if (searchText && !entry.explanation.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [audit, filterAction, filterSignal, searchText]);

  const toggleExpand = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const signalEvents = audit.filter(a => a.action !== 'NO_SIGNAL' && a.action !== 'HOLDING' && a.action !== 'HOLD');
  const blockedCount = audit.filter(a => a.action === 'BLOCKED').length;
  const tradeCount = audit.filter(a => a.action.startsWith('OPEN_') || a.action.startsWith('FLIP_')).length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSearch className="h-4 w-4" />
          Backtest Audit Log
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{tradeCount} entries</Badge>
            <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">{blockedCount} blocked</Badge>
            <Badge variant="outline" className="text-[10px]">{audit.length} candles</Badge>
          </div>
        </CardTitle>
        <CardDescription>Per-candle decision audit with filters, regime, and explanations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[150px] h-7 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionOptions.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSignal} onValueChange={setFilterSignal}>
            <SelectTrigger className="w-[120px] h-7 text-xs">
              <SelectValue placeholder="Signal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Signals</SelectItem>
              <SelectItem value="BUY">BUY</SelectItem>
              <SelectItem value="SELL">SELL</SelectItem>
              <SelectItem value="HOLD">HOLD</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search explanations..."
            className="h-7 text-xs w-[200px]"
          />
          <span className="text-[10px] text-muted-foreground ml-auto">{filteredAudit.length} rows</span>
        </div>

        {/* Table */}
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-8"></TableHead>
                <TableHead className="text-[10px]">Time</TableHead>
                <TableHead className="text-[10px]">Price</TableHead>
                <TableHead className="text-[10px]">Fast SMA</TableHead>
                <TableHead className="text-[10px]">Slow SMA</TableHead>
                <TableHead className="text-[10px]">ATR%</TableHead>
                <TableHead className="text-[10px]">Regime</TableHead>
                <TableHead className="text-[10px]">Signal</TableHead>
                <TableHead className="text-[10px]">Filters</TableHead>
                <TableHead className="text-[10px]">Action</TableHead>
                <TableHead className="text-[10px]">Position</TableHead>
                <TableHead className="text-[10px]">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudit.map((entry, idx) => {
                const isExpanded = expanded.has(idx);
                const isActionRow = entry.action !== 'NO_SIGNAL' && entry.action !== 'HOLDING' && entry.action !== 'HOLD';
                return (
                  <>
                    <TableRow
                      key={`row-${idx}`}
                      className={cn(
                        "text-[10px] cursor-pointer hover:bg-secondary/40",
                        isActionRow && "bg-secondary/20"
                      )}
                      onClick={() => toggleExpand(idx)}
                    >
                      <TableCell className="py-1 px-1">
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="py-1 whitespace-nowrap">{format(new Date(entry.timestamp), 'MM/dd HH:mm')}</TableCell>
                      <TableCell className="py-1">${entry.price.toFixed(2)}</TableCell>
                      <TableCell className="py-1">{entry.fastSMA?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell className="py-1">{entry.slowSMA?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell className="py-1">{entry.atrPercent?.toFixed(2) ?? '—'}%</TableCell>
                      <TableCell className={cn("py-1", REGIME_COLORS[entry.regime] || '')}>
                        {entry.regime === 'trending_bullish' ? '🟢' : entry.regime === 'trending_bearish' ? '🔴' : '🟡'}
                      </TableCell>
                      <TableCell className={cn("py-1 font-medium",
                        entry.signal === 'BUY' ? 'text-trading-profit' : entry.signal === 'SELL' ? 'text-trading-loss' : 'text-muted-foreground'
                      )}>
                        {entry.signal}
                      </TableCell>
                      <TableCell className="py-1">
                        {entry.filtersPass ? (
                          <span className="text-trading-profit">✓</span>
                        ) : (
                          <span className="text-destructive">✗</span>
                        )}
                      </TableCell>
                      <TableCell className={cn("py-1 font-medium", ACTION_COLORS[entry.action] || '')}>
                        {entry.action}
                      </TableCell>
                      <TableCell className="py-1">{entry.positionState}</TableCell>
                      <TableCell className="py-1">{formatCurrency(entry.balance)}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`detail-${idx}`}>
                        <TableCell colSpan={12} className="py-2 px-4 bg-muted/20">
                          <div className="space-y-1 text-[11px]">
                            <p className="font-medium">{entry.explanation}</p>
                            <div className="flex flex-wrap gap-3 text-muted-foreground">
                              <span>SMA Dist: {entry.smaDistance?.toFixed(3) ?? 'N/A'}%</span>
                              <span>ATR: {entry.atr?.toFixed(4) ?? 'N/A'}</span>
                              <span>Realized: {formatCurrency(entry.realizedPnl)}</span>
                              <span>Unrealized: {formatCurrency(entry.unrealizedPnl)}</span>
                              <span>Crossover: {entry.crossover === 1 ? '⬆ Bullish' : entry.crossover === -1 ? '⬇ Bearish' : 'None'}</span>
                            </div>
                            {entry.filtersFailed.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.filtersFailed.map((f, fi) => (
                                  <Badge key={fi} variant="outline" className="text-[9px] border-destructive/50 text-destructive">{f}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
