/**
 * AI Weekly Review Report
 * Generates contextual weekly performance summaries from archived sessions
 * and per-trade context. Supports week-over-week comparison, drawdown event
 * explanations, plain-English operator recommendations, and an archive store.
 */
import { ArchivedSession } from '@/lib/sessionHistory';
import { Trade, MarketRegime } from '@/types/trading';
import {
  computeAssetMetrics,
  computeRegimeMetrics,
  classifyTradeRegime,
  AssetMetrics,
  RegimeMetrics,
} from '@/lib/analyticsHub';
import {
  strongestRegimes,
  weakestForDirection,
  dangerousConditions,
  detectFailurePatterns,
  ConditionInsight,
  FailurePattern,
} from '@/lib/contextIntelligence';

const ARCHIVE_KEY = 'weekly-review-archive';
const MAX_ARCHIVED = 26; // ~6 months

// ─── Types ──────────────────────────────────────────────────────────

export interface WeekWindow {
  /** ISO week label, e.g. "2026-W19" */
  id: string;
  start: number; // ms (Mon 00:00 local)
  end: number;   // ms (next Mon 00:00, exclusive)
  label: string; // e.g. "May 4 – May 10, 2026"
}

export interface DirectionStats {
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
  avgPnl: number;
}

export interface DrawdownEvent {
  sessionId: string;
  sessionLabel: string;
  drawdownPct: number;
  consecutiveLosses: number;
  startTime: number;
  endTime: number;
  worstAsset?: string;
  dominantRegime?: MarketRegime;
  topExitReason?: string;
  explanation: string;
}

export interface WeeklyReview {
  id: string;            // archive id
  generatedAt: number;
  week: WeekWindow;
  previousWeek?: WeekWindow;
  totalSessions: number;
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  long: DirectionStats;
  short: DirectionStats;
  assets: AssetMetrics[];
  regimes: RegimeMetrics[];
  strongestRegime?: ConditionInsight;
  weakestRegime?: ConditionInsight;
  weakestLongContext?: ConditionInsight;
  weakestShortContext?: ConditionInsight;
  dangerous: string[];
  failurePatterns: FailurePattern[];
  drawdownEvents: DrawdownEvent[];
  comparison?: {
    pnlDelta: number;
    pnlDeltaPct: number;
    winRateDelta: number;
    tradesDelta: number;
    drawdownDelta: number;
    previousPnl: number;
    previousTrades: number;
    previousWinRate: number;
  };
  highlights: string[];
  recommendations: string[];
  emailMarkdown: string;
}

// ─── Week helpers ───────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  out.setDate(out.getDate() + diff);
  return out;
}

function isoWeekId(d: Date): string {
  // Simple year-week label using local time
  const start = startOfWeek(d);
  const yearStart = new Date(start.getFullYear(), 0, 1);
  const week = Math.ceil(((start.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${start.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function weekWindowFor(reference: number = Date.now(), offset = 0): WeekWindow {
  const start = startOfWeek(new Date(reference));
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return {
    id: isoWeekId(start),
    start: start.getTime(),
    end: end.getTime(),
    label: `${fmtDate(start.getTime())} – ${fmtDate(end.getTime() - 1)}, ${start.getFullYear()}`,
  };
}

// ─── Slicing ────────────────────────────────────────────────────────

function sessionsInWindow(all: ArchivedSession[], w: WeekWindow): ArchivedSession[] {
  return all.filter(s => s.endTime >= w.start && s.endTime < w.end);
}

function directionStats(trades: Trade[], dir: 'long' | 'short'): DirectionStats {
  const subset = trades.filter(t => t.direction === dir);
  const wins = subset.filter(t => t.pnl > 0).length;
  const pnl = subset.reduce((s, t) => s + t.pnl, 0);
  return {
    trades: subset.length,
    wins,
    winRate: subset.length ? (wins / subset.length) * 100 : 0,
    pnl,
    avgPnl: subset.length ? pnl / subset.length : 0,
  };
}

function aggregateMetrics(sessions: ArchivedSession[]) {
  const trades: Trade[] = sessions.flatMap(s => s.trades);
  const wins = trades.filter(t => t.pnl > 0).length;
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0));
  const totalPnl = sessions.reduce((s, x) => s + x.totalPnl, 0);
  const maxDd = sessions.reduce((m, x) => Math.max(m, x.maxDrawdown), 0);
  return {
    trades,
    totalTrades: trades.length,
    totalPnl,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    maxDrawdown: maxDd,
  };
}

// ─── Drawdown event explanations ────────────────────────────────────

function explainDrawdownEvent(s: ArchivedSession): DrawdownEvent | null {
  if (s.maxDrawdown < 1.5 && s.totalPnl >= 0) return null;

  // Find worst losing streak window
  const sorted = [...s.trades].sort((a, b) => a.exitTime - b.exitTime);
  let maxStreak = 0, curStreak = 0;
  let streakStart = 0, streakEnd = 0;
  let curStart = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].pnl < 0) {
      if (curStreak === 0) curStart = sorted[i].entryTime;
      curStreak++;
      if (curStreak > maxStreak) {
        maxStreak = curStreak;
        streakStart = curStart;
        streakEnd = sorted[i].exitTime;
      }
    } else {
      curStreak = 0;
    }
  }

  const losers = sorted.filter(t => t.pnl < 0);
  // Worst asset by loss
  const assetLoss = new Map<string, number>();
  losers.forEach(t => assetLoss.set(t.asset, (assetLoss.get(t.asset) ?? 0) + t.pnl));
  const worstAsset = [...assetLoss.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];

  // Dominant regime among losers
  const regimeCount = new Map<MarketRegime, number>();
  losers.forEach(t => {
    const r = classifyTradeRegime(t);
    regimeCount.set(r, (regimeCount.get(r) ?? 0) + 1);
  });
  const dominantRegime = [...regimeCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  // Top exit reason
  const reasonCount = new Map<string, number>();
  losers.forEach(t => reasonCount.set(t.exitReason, (reasonCount.get(t.exitReason) ?? 0) + 1));
  const topExitReason = [...reasonCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const regimeLabel = dominantRegime === 'trending_bullish' ? 'bullish'
    : dominantRegime === 'trending_bearish' ? 'bearish'
    : dominantRegime === 'sideways' ? 'sideways' : 'mixed';

  const parts: string[] = [];
  parts.push(`${s.maxDrawdown.toFixed(2)}% drawdown driven by ${losers.length} losing trades`);
  if (maxStreak >= 2) parts.push(`including a ${maxStreak}-trade losing streak`);
  if (worstAsset) parts.push(`${worstAsset} accounted for the largest share of losses`);
  if (dominantRegime) parts.push(`most losses occurred in ${regimeLabel} conditions`);
  if (topExitReason) parts.push(`primary exit reason was ${topExitReason.replaceAll('_', ' ')}`);

  return {
    sessionId: s.id,
    sessionLabel: s.label ?? new Date(s.endTime).toLocaleString(),
    drawdownPct: s.maxDrawdown,
    consecutiveLosses: maxStreak,
    startTime: streakStart || s.startTime,
    endTime: streakEnd || s.endTime,
    worstAsset,
    dominantRegime,
    topExitReason,
    explanation: parts.join('; ') + '.',
  };
}

// ─── Insights & recommendations ─────────────────────────────────────

function buildHighlights(r: Omit<WeeklyReview, 'highlights' | 'recommendations' | 'emailMarkdown'>): string[] {
  const h: string[] = [];
  if (r.totalSessions === 0) {
    return ['No sessions completed this week.'];
  }
  h.push(
    r.totalPnl >= 0
      ? `Net profit of $${r.totalPnl.toFixed(2)} across ${r.totalSessions} session${r.totalSessions === 1 ? '' : 's'} and ${r.totalTrades} trades (${r.winRate.toFixed(0)}% WR).`
      : `Net loss of $${r.totalPnl.toFixed(2)} across ${r.totalSessions} session${r.totalSessions === 1 ? '' : 's'} and ${r.totalTrades} trades (${r.winRate.toFixed(0)}% WR).`
  );
  if (Number.isFinite(r.profitFactor)) {
    h.push(`Profit factor ${r.profitFactor.toFixed(2)}, max drawdown ${r.maxDrawdown.toFixed(2)}%.`);
  }
  if (r.strongestRegime) {
    h.push(`Strongest regime: ${r.strongestRegime.label} (avg $${r.strongestRegime.avgPnl.toFixed(2)}/trade, ${r.strongestRegime.winRate.toFixed(0)}% WR).`);
  }
  if (r.weakestRegime && r.weakestRegime.label !== r.strongestRegime?.label) {
    h.push(`Weakest regime: ${r.weakestRegime.label} (avg $${r.weakestRegime.avgPnl.toFixed(2)}/trade).`);
  }
  if (r.long.trades > 0 && r.short.trades > 0) {
    h.push(`Longs: ${r.long.trades} trades, $${r.long.pnl.toFixed(2)} (${r.long.winRate.toFixed(0)}% WR). Shorts: ${r.short.trades} trades, $${r.short.pnl.toFixed(2)} (${r.short.winRate.toFixed(0)}% WR).`);
  } else if (r.long.trades > 0) {
    h.push(`Long-only week: ${r.long.trades} trades, $${r.long.pnl.toFixed(2)} (${r.long.winRate.toFixed(0)}% WR).`);
  } else if (r.short.trades > 0) {
    h.push(`Short-only week: ${r.short.trades} trades, $${r.short.pnl.toFixed(2)} (${r.short.winRate.toFixed(0)}% WR).`);
  }
  const best = r.assets[0];
  const worst = r.assets[r.assets.length - 1];
  if (best && worst && best.asset !== worst.asset) {
    h.push(`${best.asset} led the book (+$${best.pnl.toFixed(2)}); ${worst.asset} lagged ($${worst.pnl.toFixed(2)}).`);
  }
  if (r.comparison) {
    const c = r.comparison;
    const arrow = c.pnlDelta >= 0 ? '▲' : '▼';
    h.push(`Week-over-week: ${arrow} $${c.pnlDelta.toFixed(2)} PnL (${c.pnlDeltaPct >= 0 ? '+' : ''}${c.pnlDeltaPct.toFixed(0)}%), ${c.winRateDelta >= 0 ? '+' : ''}${c.winRateDelta.toFixed(0)} pp win rate, ${c.tradesDelta >= 0 ? '+' : ''}${c.tradesDelta} trades.`);
  }
  return h;
}

function buildRecommendations(r: Omit<WeeklyReview, 'highlights' | 'recommendations' | 'emailMarkdown'>): string[] {
  const recs: string[] = [];
  if (r.totalSessions === 0) {
    recs.push('Run at least one paper trading session next week to populate the review.');
    return recs;
  }
  if (r.maxDrawdown >= 3) {
    recs.push(`Max drawdown of ${r.maxDrawdown.toFixed(2)}% breached the 3% safety target — reduce position sizing or tighten entry filters.`);
  }
  if (r.weakestRegime && r.weakestRegime.avgPnl < 0 && r.weakestRegime.trades >= 3) {
    recs.push(`Bias allocation away from ${r.weakestRegime.label.toLowerCase()} conditions — they cost $${r.weakestRegime.avgPnl.toFixed(2)} per trade this week.`);
  }
  if (r.weakestLongContext && r.weakestLongContext.avgPnl < 0) {
    recs.push(`Long entries underperform in ${r.weakestLongContext.label.toLowerCase()} — gate longs out of this context.`);
  }
  if (r.weakestShortContext && r.weakestShortContext.avgPnl < 0) {
    recs.push(`Short entries underperform in ${r.weakestShortContext.label.toLowerCase()} — gate shorts out of this context.`);
  }
  if (r.long.trades > 0 && r.short.trades > 0) {
    if (r.long.pnl < 0 && r.short.pnl > 0) {
      recs.push(`Longs lost $${r.long.pnl.toFixed(2)} while shorts made $${r.short.pnl.toFixed(2)} — review long-side entry confirmation.`);
    } else if (r.short.pnl < 0 && r.long.pnl > 0) {
      recs.push(`Shorts lost $${r.short.pnl.toFixed(2)} while longs made $${r.long.pnl.toFixed(2)} — review short-side HTF trend and ATR thresholds.`);
    }
  }
  if (r.failurePatterns[0]) {
    const f = r.failurePatterns[0];
    recs.push(`Highest-priority failure pattern to filter: "${f.description}" (${f.lossRate.toFixed(0)}% loss rate, $${f.pnl.toFixed(2)} cumulative).`);
  }
  if (r.drawdownEvents.length > 0) {
    recs.push(`Review ${r.drawdownEvents.length} drawdown event${r.drawdownEvents.length === 1 ? '' : 's'} in the audit section before next deployment.`);
  }
  if (r.comparison) {
    if (r.comparison.pnlDelta < 0 && r.comparison.previousPnl > 0) {
      recs.push('Performance regressed vs. last week — investigate regime shift or recent config changes before scaling allocation.');
    } else if (r.comparison.pnlDelta > 0 && r.totalPnl > 0) {
      recs.push('Performance improved vs. last week. Maintain current configuration and continue monitoring.');
    }
  }
  if (recs.length === 0) {
    recs.push('System operating within target envelope — continue monitoring and accumulate sample size before any config changes.');
  }
  return recs;
}

function buildEmailMarkdown(r: Omit<WeeklyReview, 'emailMarkdown'>): string {
  const lines: string[] = [];
  lines.push(`# Weekly Trading Review — ${r.week.label}`);
  lines.push('');
  lines.push(`**Generated:** ${new Date(r.generatedAt).toLocaleString()}`);
  lines.push('');
  lines.push('## Headline');
  for (const h of r.highlights) lines.push(`- ${h}`);
  lines.push('');
  lines.push('## Key Metrics');
  lines.push(`- Sessions: ${r.totalSessions}`);
  lines.push(`- Trades: ${r.totalTrades}`);
  lines.push(`- Net PnL: $${r.totalPnl.toFixed(2)}`);
  lines.push(`- Win Rate: ${r.winRate.toFixed(1)}%`);
  lines.push(`- Profit Factor: ${Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : '∞'}`);
  lines.push(`- Max Drawdown: ${r.maxDrawdown.toFixed(2)}%`);
  lines.push('');
  if (r.comparison) {
    lines.push('## Week-over-Week');
    lines.push(`- Previous PnL: $${r.comparison.previousPnl.toFixed(2)} → Current: $${r.totalPnl.toFixed(2)} (${r.comparison.pnlDelta >= 0 ? '+' : ''}$${r.comparison.pnlDelta.toFixed(2)})`);
    lines.push(`- Win rate change: ${r.comparison.winRateDelta >= 0 ? '+' : ''}${r.comparison.winRateDelta.toFixed(1)} pp`);
    lines.push(`- Trade count change: ${r.comparison.tradesDelta >= 0 ? '+' : ''}${r.comparison.tradesDelta}`);
    lines.push('');
  }
  if (r.dangerous.length > 0) {
    lines.push('## Dangerous Conditions Detected');
    for (const d of r.dangerous) lines.push(`- ${d}`);
    lines.push('');
  }
  if (r.drawdownEvents.length > 0) {
    lines.push('## Drawdown Events');
    for (const d of r.drawdownEvents) {
      lines.push(`- **${d.sessionLabel}** — ${d.explanation}`);
    }
    lines.push('');
  }
  lines.push('## Recommendations');
  for (const rec of r.recommendations) lines.push(`- ${rec}`);
  lines.push('');
  lines.push('_Generated by CryptoTrader AI Weekly Review. Simulation only._');
  return lines.join('\n');
}

// ─── Public API ─────────────────────────────────────────────────────

export function generateWeeklyReview(
  allSessions: ArchivedSession[],
  reference: number = Date.now(),
): WeeklyReview {
  const week = weekWindowFor(reference, 0);
  const previousWeek = weekWindowFor(reference, -1);

  const weekSessions = sessionsInWindow(allSessions, week);
  const prevSessions = sessionsInWindow(allSessions, previousWeek);

  const agg = aggregateMetrics(weekSessions);
  const prevAgg = aggregateMetrics(prevSessions);

  const assets = computeAssetMetrics(weekSessions);
  const regimes = computeRegimeMetrics(weekSessions);

  const strongest = strongestRegimes(weekSessions, 2);
  const strongestRegime = strongest[0];
  const weakestRegime = strongest[strongest.length - 1];

  const weakestLongContext = weakestForDirection(weekSessions, 'long', 2)[0];
  const weakestShortContext = weakestForDirection(weekSessions, 'short', 2)[0];

  const dangerous = dangerousConditions(weekSessions);
  const failurePatterns = detectFailurePatterns(weekSessions, 2);

  const drawdownEvents = weekSessions
    .map(explainDrawdownEvent)
    .filter((d): d is DrawdownEvent => d != null)
    .sort((a, b) => b.drawdownPct - a.drawdownPct);

  const comparison = prevSessions.length > 0 ? {
    pnlDelta: agg.totalPnl - prevAgg.totalPnl,
    pnlDeltaPct: prevAgg.totalPnl !== 0 ? ((agg.totalPnl - prevAgg.totalPnl) / Math.abs(prevAgg.totalPnl)) * 100 : 0,
    winRateDelta: agg.winRate - prevAgg.winRate,
    tradesDelta: agg.totalTrades - prevAgg.totalTrades,
    drawdownDelta: agg.maxDrawdown - prevAgg.maxDrawdown,
    previousPnl: prevAgg.totalPnl,
    previousTrades: prevAgg.totalTrades,
    previousWinRate: prevAgg.winRate,
  } : undefined;

  const base = {
    id: `review-${week.id}-${Date.now()}`,
    generatedAt: Date.now(),
    week,
    previousWeek: prevSessions.length > 0 ? previousWeek : undefined,
    totalSessions: weekSessions.length,
    totalTrades: agg.totalTrades,
    totalPnl: agg.totalPnl,
    winRate: agg.winRate,
    profitFactor: agg.profitFactor,
    maxDrawdown: agg.maxDrawdown,
    long: directionStats(agg.trades, 'long'),
    short: directionStats(agg.trades, 'short'),
    assets,
    regimes,
    strongestRegime,
    weakestRegime,
    weakestLongContext,
    weakestShortContext,
    dangerous,
    failurePatterns,
    drawdownEvents,
    comparison,
  };

  const highlights = buildHighlights(base);
  const recommendations = buildRecommendations(base);
  const emailMarkdown = buildEmailMarkdown({ ...base, highlights, recommendations });

  return { ...base, highlights, recommendations, emailMarkdown };
}

// ─── Archive ────────────────────────────────────────────────────────

export function loadArchivedReviews(): WeeklyReview[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load weekly review archive:', e);
  }
  return [];
}

export function saveArchivedReview(review: WeeklyReview): WeeklyReview[] {
  const list = loadArchivedReviews().filter(r => r.week.id !== review.week.id);
  list.unshift(review);
  if (list.length > MAX_ARCHIVED) list.length = MAX_ARCHIVED;
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save weekly review:', e);
  }
  return list;
}

export function deleteArchivedReview(id: string): WeeklyReview[] {
  const list = loadArchivedReviews().filter(r => r.id !== id);
  try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list)); } catch {}
  return list;
}
