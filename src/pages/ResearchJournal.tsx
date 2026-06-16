import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, Sparkles, ShieldCheck, Crown, Archive, GitCompare, Gavel,
  Trophy, Briefcase, FileText, Calendar, Filter,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Research Journal
// Permanent timeline of every strategy creation, approval, promotion, retirement,
// leadership change, board decision, championship result and portfolio move.
// ─────────────────────────────────────────────────────────────────────────────

type EventType =
  | 'created'
  | 'approved'
  | 'promoted'
  | 'retired'
  | 'leadership'
  | 'board'
  | 'championship'
  | 'portfolio';

type Impact = 'High' | 'Medium' | 'Low';

type Entry = {
  date: string;        // YYYY-MM-DD
  type: EventType;
  title: string;
  body: string;
  impact: Impact;
  author: 'System' | 'Operator' | 'Committee' | 'Promotion Board';
  refs?: string[];
};

const TYPE_META: Record<EventType, { label: string; icon: React.ReactNode; tone: string }> = {
  created:      { label: 'Created',          icon: <Sparkles className="h-3.5 w-3.5" />,    tone: 'text-muted-foreground border-border' },
  approved:     { label: 'Approved',         icon: <ShieldCheck className="h-3.5 w-3.5" />, tone: 'text-trading-profit border-trading-profit/40' },
  promoted:     { label: 'Promoted',         icon: <Crown className="h-3.5 w-3.5" />,       tone: 'text-primary border-primary/40' },
  retired:      { label: 'Retired',          icon: <Archive className="h-3.5 w-3.5" />,     tone: 'text-trading-loss border-trading-loss/40' },
  leadership:   { label: 'Leadership',       icon: <GitCompare className="h-3.5 w-3.5" />,  tone: 'text-trading-warning border-trading-warning/40' },
  board:        { label: 'Board Decision',   icon: <Gavel className="h-3.5 w-3.5" />,       tone: 'text-primary border-primary/40' },
  championship: { label: 'Championship',     icon: <Trophy className="h-3.5 w-3.5" />,      tone: 'text-trading-warning border-trading-warning/40' },
  portfolio:    { label: 'Portfolio',        icon: <Briefcase className="h-3.5 w-3.5" />,   tone: 'text-trading-profit border-trading-profit/40' },
};

const IMPACT_TONE: Record<Impact, string> = {
  High:   'text-trading-loss border-trading-loss/40',
  Medium: 'text-trading-warning border-trading-warning/40',
  Low:    'text-muted-foreground border-border',
};

const ENTRIES: Entry[] = [
  { date: '2026-06-16', type: 'created',      title: 'Router v2.1 forked from Router v2',                       body: 'Router v2.1 forked from Router v2 following Trade Frequency Opportunity Audit recommendation (-10% threshold adjustment). Routing logic, MPC v2, governance, sizing, risk and strategy selection are inherited unchanged. Status: Research. Promotion locked until 30 days runtime and 20 trades minimum. Router v2 remains the control version.', impact: 'Medium', author: 'Operator', refs: ['Router v2', 'Router v2.1'] },
  { date: '2026-06-12', type: 'portfolio',    title: 'Trend Rider raised to 22%, Mean Reversion trimmed to 10%', body: 'Investment Committee voted to lean into the trending regime after 5 consecutive sessions of ADX > 25. Mean Reversion reduced as sideways opportunity score fell from 64 to 48.', impact: 'Medium', author: 'Committee', refs: ['Trend Rider v1', 'Mean Reversion v1'] },
  { date: '2026-06-11', type: 'championship', title: 'Router v2 overtook Router v1 in Championship Arena',        body: 'Router v2 reached the top of the Best Overall leaderboard with PF 2.10 and DD 2.3% on Day 21. Promotion remains locked behind the 30-day gate.', impact: 'High', author: 'System', refs: ['Router v1', 'Router v2'] },
  { date: '2026-06-10', type: 'board',        title: 'Promotion Board recommended Approved for 4 candidates',    body: 'Candidate 25, Trend Rider v1, Mean Reversion v1 and Router v1 met the Minimum Gate (30d / 20 trades / PF>1.5 / DD<3%) and were advanced from Candidate to Approved.', impact: 'High', author: 'Promotion Board' },
  { date: '2026-06-10', type: 'promoted',     title: 'Baseline v11 promoted to Champion',                       body: 'Baseline v11 cleared the Gold Standard gate (60d / 50 trades / PF>1.8 / DD<3%) with PF 1.91 and a stability score of 84. Locked under Research Freeze Mode.', impact: 'High', author: 'Promotion Board', refs: ['Baseline v11'] },
  { date: '2026-06-09', type: 'created',      title: 'Router v2 created',                                       body: 'Four-specialist router adding Mean Reversion v1 to the Sideways/Range bucket. Modeled regime distribution 35% trend / 38% moderate / 22% sideways / 5% uncertain.', impact: 'Medium', author: 'Operator', refs: ['Router v2'] },
  { date: '2026-06-08', type: 'leadership',   title: 'Router v1 became Championship leader',                    body: 'Router v1 overtook Trend Rider v1 on overall score after 7 consecutive days of stable PF and DD. First leadership change of the championship.', impact: 'Medium', author: 'System', refs: ['Router v1', 'Trend Rider v1'] },
  { date: '2026-06-07', type: 'created',      title: 'Mean Reversion v1 created',                               body: 'Specialist RSI + Bollinger range strategy. Designed for sideways regimes (ADX<20, stable ATR). Best win-rate of any candidate at 64.7%.', impact: 'Low', author: 'Operator', refs: ['Mean Reversion v1'] },
  { date: '2026-06-06', type: 'created',      title: 'Strategy Router v1 created',                              body: 'Three-way regime-aware router across Baseline v11, Candidate 25 and Trend Rider v1. First router to clear DD < 3% in 30d holdout.', impact: 'Medium', author: 'Operator', refs: ['Router v1'] },
  { date: '2026-06-05', type: 'created',      title: 'Trend Rider v1 created',                                  body: 'EMA 9/21 cross with ADX > 25 and ATR expansion gates. Highest PF (2.06) but lowest win rate (51.2%) among candidates.', impact: 'Low', author: 'Operator', refs: ['Trend Rider v1'] },
  { date: '2026-06-04', type: 'championship', title: 'Championship Arena opened',                               body: 'All six validated strategies started running side-by-side on the same live paper feed. Promotion gate set to 20 trades AND 30 days live.', impact: 'High', author: 'System' },
  { date: '2026-06-02', type: 'created',      title: 'Candidate 25 (Hybrid Active) created',                    body: 'Bridges Baseline v11 quality with Candidate 24 frequency. Kept SMA 8/21, distance scoring only, +10% conviction threshold, HTF alignment ≥ 60.', impact: 'Medium', author: 'Operator', refs: ['Candidate 25'] },
  { date: '2026-05-30', type: 'retired',      title: 'Candidate 24 archived',                                   body: 'Hit 4.4× baseline frequency but PF fell to 1.52. Replaced by Candidate 25 which keeps the activity boost without the PF degradation.', impact: 'Medium', author: 'Operator', refs: ['Candidate 24'] },
  { date: '2026-05-22', type: 'approved',     title: 'MPC v2 Confidence Recovery activated',                    body: 'Market Participation Controller v2 became the active controller. v1 archived. Tighter recovery curve after drawdown shocks.', impact: 'High', author: 'System' },
  { date: '2026-03-12', type: 'created',      title: 'Baseline v11 created',                                    body: 'SMA 10/30 with adaptive 70/30 allocation between SMA and Mean Reversion. Conservative thresholds (1% SL on BTC, 2%/5% on XRP). Reference benchmark for the system.', impact: 'High', author: 'Operator', refs: ['Baseline v11'] },
];

const WEEKLY = [
  {
    week: 'Week of Jun 9 — 2026',
    body: 'Major week for the system. Baseline v11 cleared the Gold Standard and was promoted to Champion under Research Freeze. The Promotion Board recommended four strategies (Candidate 25, Trend Rider v1, Mean Reversion v1, Router v1) for Approved. Router v2 was created and immediately overtook Router v1 at the top of the championship leaderboard, but promotion stays locked behind the 30-day gate. Committee leaned the portfolio toward Trend Rider after a sustained trending regime.',
  },
  {
    week: 'Week of Jun 2 — 2026',
    body: 'Specialist build-out week. Trend Rider v1, Mean Reversion v1 and Strategy Router v1 were all created and validated. Championship Arena went live with all six candidates. Candidate 25 took shape as the hybrid balancing Baseline v11 PF with Candidate 24 frequency. First leadership change observed when Router v1 overtook Trend Rider v1 on overall score.',
  },
  {
    week: 'Week of May 26 — 2026',
    body: 'Cleanup week. Candidate 24 retired after PF degradation. MPC v2 Confidence Recovery promoted to the active controller, archiving v1. Risk profile across the system tightened ahead of the championship.',
  },
];

const ALL_FILTERS: { id: 'all' | EventType; label: string }[] = [
  { id: 'all', label: 'All' },
  ...(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([id, m]) => ({ id, label: m.label })),
];

export default function ResearchJournal() {
  const [filter, setFilter] = useState<'all' | EventType>('all');
  const entries = useMemo(
    () => (filter === 'all' ? ENTRIES : ENTRIES.filter((e) => e.type === filter)),
    [filter],
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Research Journal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Permanent timeline of every major event in the trading ecosystem. Filter by event type or read the weekly summary.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Calendar className="h-3 w-3" /> {ENTRIES.length} entries · {new Set(ENTRIES.map((e) => e.date)).size} active days
        </Badge>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Summaries</TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {ALL_FILTERS.map((f) => {
                  const active = filter === f.id;
                  return (
                    <Button
                      key={f.id}
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      className="h-7 text-[11px] px-2"
                      onClick={() => setFilter(f.id)}
                    >
                      {f.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
              <CardDescription className="text-xs">
                Newest first. Each entry is permanent — edits are tracked but never overwritten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-border/60 ml-2 space-y-4">
                {entries.map((e, i) => {
                  const meta = TYPE_META[e.type];
                  return (
                    <li key={i} className="ml-4 pl-3">
                      <span
                        className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border bg-background"
                        aria-hidden
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <time className="text-[10px] tabular-nums text-muted-foreground">{e.date}</time>
                        <Badge variant="outline" className={`gap-1 text-[10px] ${meta.tone}`}>
                          {meta.icon}{meta.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${IMPACT_TONE[e.impact]}`}>
                          {e.impact} impact
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">· {e.author}</span>
                      </div>
                      <div className="text-sm font-medium">{e.title}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{e.body}</p>
                      {e.refs && e.refs.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          {e.refs.map((r) => (
                            <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
                {entries.length === 0 && (
                  <li className="text-xs text-muted-foreground ml-4">No entries match this filter.</li>
                )}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly summaries */}
        <TabsContent value="weekly" className="space-y-3">
          {WEEKLY.map((w) => (
            <Card key={w.week}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {w.week}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                {w.body}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
