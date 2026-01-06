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
import { BookOpen, Save, X, Edit2, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Predefined trade tags with colors
const TRADE_TAGS = [
  { id: 'momentum', label: 'Momentum', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'reversal', label: 'Reversal', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'breakout', label: 'Breakout', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'fomo', label: 'FOMO', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'planned', label: 'Planned', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'scalp', label: 'Scalp', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'swing', label: 'Swing', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'revenge', label: 'Revenge', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
] as const;

type TagId = typeof TRADE_TAGS[number]['id'];

interface TradeNote {
  tradeId: string;
  note: string;
  tags: TagId[];
  updatedAt: number;
}

const STORAGE_KEY = 'trade-journal-notes';

function loadNotes(): TradeNote[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Handle both old format (object) and new format (array)
      if (Array.isArray(parsed)) {
        return parsed.map(note => ({
          ...note,
          tags: note.tags || [],
        }));
      }
      // Convert old object format to array
      return Object.values(parsed).map((note: any) => ({
        ...note,
        tags: note.tags || [],
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveNotes(notes: TradeNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function getNotesMap(notes: TradeNote[]): Record<string, TradeNote> {
  return notes.reduce((acc, note) => {
    acc[note.tradeId] = note;
    return acc;
  }, {} as Record<string, TradeNote>);
}

interface TradeJournalProps {
  trades: Trade[];
}

export function TradeJournal({ trades }: TradeJournalProps) {
  const [notesList, setNotesList] = useState<TradeNote[]>(() => loadNotes());
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState<TagId[]>([]);

  const notes = getNotesMap(notesList);

  useEffect(() => {
    saveNotes(notesList);
  }, [notesList]);

  const tradesWithNotes = trades.filter(t => notes[t.id]);
  const sortedTrades = [...trades].sort((a, b) => b.exitTime - a.exitTime);

  const startEditing = (trade: Trade) => {
    setEditingTradeId(trade.id);
    setEditText(notes[trade.id]?.note || '');
    setEditTags(notes[trade.id]?.tags || []);
  };

  const toggleTag = (tagId: TagId) => {
    setEditTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const saveNote = () => {
    if (editingTradeId && (editText.trim() || editTags.length > 0)) {
      setNotesList(prev => {
        const existingIndex = prev.findIndex(n => n.tradeId === editingTradeId);
        const newNote: TradeNote = {
          tradeId: editingTradeId,
          note: editText.trim(),
          tags: editTags,
          updatedAt: Date.now(),
        };
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newNote;
          return updated;
        }
        return [...prev, newNote];
      });
    }
    setEditingTradeId(null);
    setEditText('');
    setEditTags([]);
  };

  const deleteNote = (tradeId: string) => {
    setNotesList(prev => prev.filter(n => n.tradeId !== tradeId));
  };

  const cancelEditing = () => {
    setEditingTradeId(null);
    setEditText('');
    setEditTags([]);
  };

  const getTagInfo = (tagId: TagId) => TRADE_TAGS.find(t => t.id === tagId);

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
                const tradeNote = notes[trade.id];
                const hasNote = !!tradeNote;

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
                            
                            {/* Tags section */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Tags
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {TRADE_TAGS.map((tag) => (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                                      editTags.includes(tag.id)
                                        ? tag.color + ' ring-1 ring-offset-1 ring-offset-background'
                                        : 'bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary'
                                    }`}
                                  >
                                    {tag.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <Textarea
                              placeholder="What did you learn from this trade? What was your strategy? Any emotions or market conditions worth noting?"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[120px] resize-none"
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
                                  disabled={!editText.trim() && editTags.length === 0}
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
                    
                    {/* Display tags */}
                    {tradeNote?.tags && tradeNote.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tradeNote.tags.map((tagId) => {
                          const tagInfo = getTagInfo(tagId);
                          return tagInfo ? (
                            <span
                              key={tagId}
                              className={`px-2 py-0.5 text-xs rounded-full border ${tagInfo.color}`}
                            >
                              {tagInfo.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    {hasNote && tradeNote.note && (
                      <div className="mt-2 rounded bg-muted/50 p-2">
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-2">
                          {tradeNote.note}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          Updated {format(new Date(tradeNote.updatedAt), 'MMM dd, HH:mm')}
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
