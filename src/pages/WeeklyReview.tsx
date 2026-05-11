import { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Archive, Copy, Trash2, RefreshCw, Mail, Sparkles, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { loadSessionHistory } from '@/lib/sessionHistory';
import {
  generateWeeklyReview,
  loadArchivedReviews,
  saveArchivedReview,
  deleteArchivedReview,
  WeeklyReview,
} from '@/lib/weeklyReview';
import { exportWeeklyReviewPdf, downloadMarkdown, downloadJson } from '@/lib/weeklyReviewPdf';

export default function WeeklyReviewPage() {
  const { toast } = useToast();
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [archive, setArchive] = useState<WeeklyReview[]>([]);
  const [viewing, setViewing] = useState<WeeklyReview | null>(null);

  const sessions = useMemo(() => loadSessionHistory(), []);

  const regenerate = () => {
    const fresh = generateWeeklyReview(loadSessionHistory());
    setReview(fresh);
    setViewing(fresh);
  };

  useEffect(() => {
    regenerate();
    setArchive(loadArchivedReviews());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = viewing ?? review;

  const handleArchive = () => {
    if (!review) return;
    const list = saveArchivedReview(review);
    setArchive(list);
    toast({ title: 'Review archived', description: `Saved ${review.week.label}.` });
  };

  const handleDelete = (id: string) => {
    const list = deleteArchivedReview(id);
    setArchive(list);
    if (viewing?.id === id) setViewing(review);
  };

  const handleCopyEmail = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.emailMarkdown);
    toast({ title: 'Copied', description: 'Email-ready markdown copied to clipboard.' });
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            AI Weekly Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Auto-generated operator review of paper trading sessions, regimes, drawdowns and recommendations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={regenerate}>
            <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={!review || review.totalSessions === 0}>
            <Archive className="h-4 w-4 mr-2" /> Archive
          </Button>
          <Button size="sm" onClick={() => active && exportWeeklyReviewPdf(active)} disabled={!active}>
            <FileText className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
      </header>

      {!active || active.totalSessions === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sessions this week</CardTitle>
            <CardDescription>
              Run at least one paper trading session in the current week window to populate the review.
              {sessions.length > 0 && ` (${sessions.length} archived session${sessions.length === 1 ? '' : 's'} found outside this week.)`}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk & Drawdowns</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="email">Email-Ready</TabsTrigger>
            <TabsTrigger value="archive">Archive ({archive.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <SummaryView r={active} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceView r={active} />
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <RiskView r={active} />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <RecommendationsView r={active} />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email-Ready Markdown</CardTitle>
                  <CardDescription>Paste directly into a weekly status email or operator log.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyEmail}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadMarkdown(active)}>
                    <Download className="h-4 w-4 mr-2" /> .md
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadJson(active)}>
                    <Download className="h-4 w-4 mr-2" /> .json
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea readOnly value={active.emailMarkdown} className="font-mono text-xs h-[480px]" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="space-y-4">
            <ArchiveView
              archive={archive}
              onView={setViewing}
              onDelete={handleDelete}
              activeId={active.id}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ─── Sections ──────────────────────────────────────────────────────

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'positive' | 'negative' | 'neutral' }) {
  const color = tone === 'positive' ? 'text-emerald-500' : tone === 'negative' ? 'text-destructive' : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function SummaryView({ r }: { r: WeeklyReview }) {
  const pfText = Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : '∞';
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Net PnL" value={`$${r.totalPnl.toFixed(2)}`} tone={r.totalPnl >= 0 ? 'positive' : 'negative'} hint={`${r.totalSessions} session${r.totalSessions === 1 ? '' : 's'}`} />
        <StatCard label="Trades" value={String(r.totalTrades)} hint={`${r.winRate.toFixed(0)}% win rate`} />
        <StatCard label="Profit Factor" value={pfText} hint={`Max DD ${r.maxDrawdown.toFixed(2)}%`} tone={r.maxDrawdown >= 3 ? 'negative' : 'neutral'} />
        <StatCard
          label="Week"
          value={r.week.id}
          hint={r.week.label}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Highlights</CardTitle>
          <CardDescription>Plain-English summary of the week.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {r.highlights.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-1">▸</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {r.comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {r.comparison.pnlDelta >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              Week-over-Week
            </CardTitle>
            <CardDescription>Compared to {r.previousWeek?.label}.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">PnL change</p>
              <p className={`text-lg font-semibold ${r.comparison.pnlDelta >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {r.comparison.pnlDelta >= 0 ? '+' : ''}${r.comparison.pnlDelta.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{r.comparison.pnlDeltaPct >= 0 ? '+' : ''}{r.comparison.pnlDeltaPct.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Win rate change</p>
              <p className="text-lg font-semibold">{r.comparison.winRateDelta >= 0 ? '+' : ''}{r.comparison.winRateDelta.toFixed(1)} pp</p>
              <p className="text-xs text-muted-foreground">prev {r.comparison.previousWinRate.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Trade volume</p>
              <p className="text-lg font-semibold">{r.comparison.tradesDelta >= 0 ? '+' : ''}{r.comparison.tradesDelta}</p>
              <p className="text-xs text-muted-foreground">prev {r.comparison.previousTrades}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Drawdown change</p>
              <p className={`text-lg font-semibold ${r.comparison.drawdownDelta <= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {r.comparison.drawdownDelta >= 0 ? '+' : ''}{r.comparison.drawdownDelta.toFixed(2)} pp
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function PerformanceView({ r }: { r: WeeklyReview }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Long vs Short</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(['long', 'short'] as const).map(side => {
            const d = r[side];
            return (
              <div key={side} className="flex items-center justify-between rounded-md border border-border/50 p-3">
                <div>
                  <p className="font-medium capitalize">{side}</p>
                  <p className="text-xs text-muted-foreground">{d.trades} trades · {d.winRate.toFixed(0)}% WR</p>
                </div>
                <div className={`text-lg font-semibold ${d.pnl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  ${d.pnl.toFixed(2)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {r.assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trades this week.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {r.assets.map(a => (
                <div key={a.asset} className="flex items-center justify-between rounded-md border border-border/50 p-2.5">
                  <div>
                    <p className="font-medium">{a.asset}</p>
                    <p className="text-xs text-muted-foreground">{a.trades} trades · {a.winRate.toFixed(0)}% WR · PF {Number.isFinite(a.profitFactor) ? a.profitFactor.toFixed(2) : '∞'}</p>
                  </div>
                  <div className={`font-semibold ${a.pnl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>${a.pnl.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Regime Performance</CardTitle>
          <CardDescription>Strongest and weakest contexts this week (uses archived per-trade regime when available).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            {r.regimes.map(rg => (
              <div key={rg.regime} className="rounded-md border border-border/50 p-3">
                <p className="font-medium">{rg.label}</p>
                <p className="text-xs text-muted-foreground">{rg.trades} trades · {rg.winRate.toFixed(0)}% WR</p>
                <p className={`text-lg font-semibold mt-1 ${rg.pnl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>${rg.pnl.toFixed(2)}</p>
              </div>
            ))}
          </div>
          {(r.strongestRegime || r.weakestRegime) && (
            <>
              <Separator className="my-4" />
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                {r.strongestRegime && (
                  <div>
                    <Badge variant="secondary" className="mb-1">Strongest</Badge>
                    <p>{r.strongestRegime.label} — avg ${r.strongestRegime.avgPnl.toFixed(2)}/trade ({r.strongestRegime.winRate.toFixed(0)}% WR over {r.strongestRegime.trades} trades).</p>
                  </div>
                )}
                {r.weakestRegime && r.weakestRegime.label !== r.strongestRegime?.label && (
                  <div>
                    <Badge variant="destructive" className="mb-1">Weakest</Badge>
                    <p>{r.weakestRegime.label} — avg ${r.weakestRegime.avgPnl.toFixed(2)}/trade ({r.weakestRegime.winRate.toFixed(0)}% WR over {r.weakestRegime.trades} trades).</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RiskView({ r }: { r: WeeklyReview }) {
  return (
    <>
      {r.dangerous.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Dangerous Conditions Detected
            </CardTitle>
            <CardDescription>Context combinations producing repeated losses this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {r.dangerous.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Drawdown Events</CardTitle>
          <CardDescription>Major equity drawdowns explained.</CardDescription>
        </CardHeader>
        <CardContent>
          {r.drawdownEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drawdown events worth flagging this week.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {r.drawdownEvents.map(d => (
                <div key={d.sessionId} className="rounded-md border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{d.sessionLabel}</p>
                    <Badge variant={d.drawdownPct >= 3 ? 'destructive' : 'secondary'}>
                      {d.drawdownPct.toFixed(2)}% DD
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">{d.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {r.failurePatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recurring Failure Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {r.failurePatterns.map((f, i) => (
                <div key={i} className="rounded-md border border-border/50 p-2.5 flex justify-between gap-3">
                  <span>{f.description}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {f.trades} trades · {f.lossRate.toFixed(0)}% loss · ${f.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function RecommendationsView({ r }: { r: WeeklyReview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Operator Recommendations</CardTitle>
        <CardDescription>Plain-English next actions derived from this week's trade context.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm list-decimal pl-5">
          {r.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
        </ol>
      </CardContent>
    </Card>
  );
}

function ArchiveView({
  archive, onView, onDelete, activeId,
}: { archive: WeeklyReview[]; onView: (r: WeeklyReview) => void; onDelete: (id: string) => void; activeId: string }) {
  if (archive.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No archived reviews yet</CardTitle>
          <CardDescription>Click "Archive" in the header to save the current week for later reference.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Archived Weekly Reviews</CardTitle>
        <CardDescription>{archive.length} saved review{archive.length === 1 ? '' : 's'}.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[480px] pr-3">
          <div className="space-y-2">
            {archive.map(a => (
              <div key={a.id} className={`rounded-md border p-3 flex items-center justify-between gap-3 ${a.id === activeId ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                <div className="text-sm">
                  <p className="font-medium">{a.week.label} <span className="text-muted-foreground">· {a.week.id}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {a.totalSessions} sessions · {a.totalTrades} trades · ${a.totalPnl.toFixed(2)} PnL · {a.winRate.toFixed(0)}% WR
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onView(a)}>View</Button>
                  <Button variant="ghost" size="sm" onClick={() => exportWeeklyReviewPdf(a)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
