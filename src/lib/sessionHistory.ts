/**
 * Session History Manager
 * Archives completed paper trading sessions for multi-day evaluation.
 */
import { TradingState, Trade } from '@/types/trading';
import { computeTradeStats } from '@/lib/tradingCalculations';

const HISTORY_KEY = 'paper-trading-session-history';
const MAX_SESSIONS = 50;

export interface ArchivedSession {
  id: string;
  startTime: number;
  endTime: number;
  initialBalance: number;
  finalBalance: number;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  profitFactor: number;
  trades: Trade[];
  longTrades: number;
  shortTrades: number;
  label?: string;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function archiveSession(
  state: TradingState,
  sessionStartTime: number,
  maxDrawdown: number,
  label?: string,
): ArchivedSession | null {
  if (state.trades.length === 0) return null;

  const stats = computeTradeStats(state.trades);
  const session: ArchivedSession = {
    id: generateSessionId(),
    startTime: sessionStartTime,
    endTime: Date.now(),
    initialBalance: state.initialBalance,
    finalBalance: state.balance,
    totalPnl: state.balance - state.initialBalance,
    totalTrades: state.trades.length,
    winRate: stats.winRate,
    maxDrawdown,
    profitFactor: stats.profitFactor,
    trades: state.trades,
    longTrades: state.trades.filter(t => t.direction === 'long').length,
    shortTrades: state.trades.filter(t => t.direction === 'short').length,
    label,
  };

  const history = loadSessionHistory();
  history.unshift(session);
  if (history.length > MAX_SESSIONS) history.length = MAX_SESSIONS;

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save session history:', e);
  }

  return session;
}

export function loadSessionHistory(): ArchivedSession[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load session history:', e);
  }
  return [];
}

export function deleteArchivedSession(sessionId: string): void {
  const history = loadSessionHistory().filter(s => s.id !== sessionId);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to delete session:', e);
  }
}

export function clearSessionHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear session history:', e);
  }
}
