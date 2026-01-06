import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trade } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { format } from 'date-fns';
import { BookOpen, Save, X, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TradeNote {
  tradeId: string;
  note: string;
  updatedAt: number;
}

const STORAGE_KEY = 'trading-journal-notes';

function loadNotes(): Record<string, TradeNote> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, TradeNote>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

interface TradeJournalProps {
  trades: Trade[];
}

export function TradeJournal({ trades }: TradeJournalProps) {
  const [notes, setNotes] = useState<Record<string, TradeNote>>(() => loadNotes());
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const tradesWithNotes = trades.filter(t => notes[t.id]);
  const sortedTrades = [...trades].sort((a, b) => b.exitTime - a.exitTime);

  const startEditing = (trade: Trade) => {
    setEditingTradeId(trade.id);
    setEditText(notes[trade.id]?.note || '');
  };

  const saveNote = () => {
    if (editingTradeId && editText.trim()) {
      setNotes(prev => ({
        ...prev,
        [editingTradeId]: {
          tradeId: editingTradeId,
          note: editText.trim(),
          updatedAt: Date.now(),
        },
      }));
    }
    setEditingTradeId(null);
    setEditText('');
  };

  const deleteNote = (tradeId: string) => {
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[tradeId];
      return updated;
    });
  };

  const cancelEditing = () => {
    setEditingTradeId(null);
    setEditText('');
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Trading Journal
          <Badge variant="secondary" className="ml-auto">
            {tradesWithNotes.length} notes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {sortedTrades.length === 0 ? (
            <div className="flex h-full items-center justify-center py-8">
              <p className="text-muted-foreground">No trades to journal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTrades.map((trade) => {
                const info = ASSET_INFO[trade.asset];
                const hasNote = !!notes[trade.id];
                const isEditing = editingTradeId === trade.id;

                return (
                  <div
                    key={trade.id}
                    className="rounded-lg border border-border/50 bg-secondary/20 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{info.symbol}</span>
                        <Badge
                          variant="outline"
                          className={
                            trade.type === 'win'
                              ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                              : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
                          }
                        >
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(trade.exitTime), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => startEditing(trade)}
                          >
                            {hasNote ? (
                              <Edit2 className="h-3 w-3" />
                            ) : (
                              <>
                                <Edit2 className="h-3 w-3 mr-1" />
                                <span className="text-xs">Add Note</span>
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Trade Note - {info.symbol}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {format(new Date(trade.exitTime), 'PPp')}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  trade.type === 'win'
                                    ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                                    : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
                                }
                              >
                                {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                              </Badge>
                            </div>
                            <Textarea
                              placeholder="What did you learn from this trade? What was your strategy? Any emotions or market conditions worth noting?"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[150px] resize-none"
                            />
                            <div className="flex justify-between">
                              {hasNote && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    deleteNote(trade.id);
                                    cancelEditing();
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              )}
                              <div className="flex gap-2 ml-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={saveNote}
                                  disabled={!editText.trim()}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {hasNote && (
                      <div className="mt-2 rounded bg-muted/50 p-2">
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-2">
                          {notes[trade.id].note}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          Updated {format(new Date(notes[trade.id].updatedAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    )}
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
