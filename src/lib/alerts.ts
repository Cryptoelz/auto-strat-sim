import { Asset, Trade, TradingState, TradingConfig, DecisionLogEntry } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';

// ─── Alert Types ─────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertCategory = 'trade' | 'blocked' | 'risk' | 'system' | 'summary';

export interface TradingAlert {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  category: AlertCategory;
  asset: Asset | null;
  eventType: string;
  explanation: string;
  actionTaken: boolean;
}

export interface NotificationPreferences {
  tradeAlerts: boolean;
  blockedTradeAlerts: boolean;
  riskAlerts: boolean;
  systemAlerts: boolean;
  dailySummaryAlerts: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  tradeAlerts: true,
  blockedTradeAlerts: true,
  riskAlerts: true,
  systemAlerts: true,
  dailySummaryAlerts: true,
};

// ─── Alert Store (pub/sub) ───────────────────────────────────────────

const MAX_ALERTS = 500;
let alerts: TradingAlert[] = [];
let alertListeners: (() => void)[] = [];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function notify() {
  alertListeners.forEach(l => l());
}

export function addAlert(
  severity: AlertSeverity,
  category: AlertCategory,
  eventType: string,
  explanation: string,
  asset: Asset | null = null,
  actionTaken: boolean = true,
): TradingAlert {
  const alert: TradingAlert = {
    id: generateId(),
    timestamp: Date.now(),
    severity,
    category,
    asset,
    eventType,
    explanation,
    actionTaken,
  };
  alerts = [alert, ...alerts].slice(0, MAX_ALERTS);
  notify();
  return alert;
}

export function getAlerts(): TradingAlert[] {
  return alerts;
}

export function clearAlerts(): void {
  alerts = [];
  notify();
}

export function subscribeToAlerts(listener: () => void): () => void {
  alertListeners.push(listener);
  return () => {
    alertListeners = alertListeners.filter(l => l !== listener);
  };
}

// ─── Alert Generators ────────────────────────────────────────────────

export function alertTradeOpened(asset: Asset, direction: 'long' | 'short', price: number): void {
  const dir = direction.toUpperCase();
  const symbol = ASSET_INFO[asset].symbol;
  addAlert(
    'info', 'trade',
    `${dir}_ENTRY`,
    `Opened ${dir} on ${symbol} at $${price.toFixed(2)} after confirmed ${direction === 'long' ? 'bullish' : 'bearish'} crossover.`,
    asset, true,
  );
}

export function alertTradeClosed(asset: Asset, direction: 'long' | 'short', price: number, pnl: number, reason: string): void {
  const dir = direction.toUpperCase();
  const symbol = ASSET_INFO[asset].symbol;
  const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  addAlert(
    pnl >= 0 ? 'info' : 'warning', 'trade',
    `${dir}_EXIT`,
    `Closed ${dir} on ${symbol} at $${price.toFixed(2)} via ${reason} (P&L: ${pnlText}).`,
    asset, true,
  );
}

export function alertFlip(asset: Asset, fromDir: 'long' | 'short', toDir: 'long' | 'short', price: number): void {
  const symbol = ASSET_INFO[asset].symbol;
  addAlert(
    'info', 'trade',
    'FLIP',
    `Flipped ${fromDir.toUpperCase()}→${toDir.toUpperCase()} on ${symbol} at $${price.toFixed(2)} due to confirmed crossover reversal.`,
    asset, true,
  );
}

export function alertBlocked(asset: Asset, direction: string, reason: string): void {
  const symbol = ASSET_INFO[asset].symbol;
  addAlert(
    'warning', 'blocked',
    'BLOCKED',
    `Blocked ${direction} on ${symbol} because ${reason}.`,
    asset, false,
  );
}

export function alertRiskControl(reason: string, asset?: Asset): void {
  addAlert(
    'critical', 'risk',
    'RISK_CONTROL',
    reason,
    asset ?? null, true,
  );
}

export function alertDailyLossLimit(lossPercent: number): void {
  addAlert(
    'critical', 'risk',
    'DAILY_LOSS_LIMIT',
    `Paused trading because max daily portfolio loss was reached (${lossPercent.toFixed(1)}%).`,
    null, true,
  );
}

export function alertDrawdownProtection(drawdownPercent: number): void {
  addAlert(
    'critical', 'risk',
    'DRAWDOWN_PROTECTION',
    `Drawdown protection triggered at ${drawdownPercent.toFixed(1)}%. Trading paused until conditions improve.`,
    null, true,
  );
}

export function alertReconnect(): void {
  addAlert(
    'warning', 'system',
    'RECONNECT',
    'Data stream reconnected and candle flow restored.',
    null, true,
  );
}

export function alertDataGap(asset: Asset, missedCount: number): void {
  addAlert(
    'warning', 'system',
    'DATA_GAP',
    `Detected ${missedCount} missed candle(s) on ${ASSET_INFO[asset].symbol}. Data gap may affect signal accuracy.`,
    asset, false,
  );
}

export function alertPaused(): void {
  addAlert('info', 'system', 'PAUSED', 'Paper trading paused by user.', null, true);
}

export function alertResumed(): void {
  addAlert('info', 'system', 'RESUMED', 'Paper trading resumed.', null, true);
}

// ─── Notification Preferences Storage ────────────────────────────────

const PREFS_KEY = 'notification-preferences';

export function loadNotificationPrefs(): NotificationPreferences {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_NOTIFICATION_PREFS };
}

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function shouldShowAlert(alert: TradingAlert, prefs: NotificationPreferences): boolean {
  switch (alert.category) {
    case 'trade': return prefs.tradeAlerts;
    case 'blocked': return prefs.blockedTradeAlerts;
    case 'risk': return prefs.riskAlerts;
    case 'system': return prefs.systemAlerts;
    case 'summary': return prefs.dailySummaryAlerts;
    default: return true;
  }
}
