/**
 * Live session alerts for paper trading.
 * Monitors drawdown, consecutive losses, and unusual behavior.
 */
import { useEffect, useRef } from 'react';
import { TradingState } from '@/types/trading';
import { SESSION_ALERT_THRESHOLDS } from '@/config/trading';
import { toast } from 'sonner';

interface UseSessionAlertsOptions {
  state: TradingState;
  drawdown: number;
  sessionStartTime: number;
  isRunning: boolean;
}

export function useSessionAlerts({ state, drawdown, sessionStartTime, isRunning }: UseSessionAlertsOptions) {
  const drawdownAlertRef = useRef(false);
  const consecutiveLossAlertRef = useRef(false);
  const tradeFrequencyAlertRef = useRef(false);
  const lastTradeCountRef = useRef(state.trades.length);
  const lastCheckTimeRef = useRef(Date.now());

  // Reset alerts on session reset
  useEffect(() => {
    drawdownAlertRef.current = false;
    consecutiveLossAlertRef.current = false;
    tradeFrequencyAlertRef.current = false;
    lastTradeCountRef.current = 0;
    lastCheckTimeRef.current = Date.now();
  }, [sessionStartTime]);

  useEffect(() => {
    if (!isRunning) return;

    const { maxDrawdownPercent, maxConsecutiveLosses, unusualTradeFrequencyPerHour } = SESSION_ALERT_THRESHOLDS;

    // Drawdown alert
    if (drawdown >= maxDrawdownPercent && !drawdownAlertRef.current) {
      drawdownAlertRef.current = true;
      toast.error(`🚨 Drawdown Alert: ${drawdown.toFixed(2)}% exceeds ${maxDrawdownPercent}% threshold`, { duration: 15000 });
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ Drawdown Alert', {
          body: `Drawdown of ${drawdown.toFixed(2)}% exceeds the ${maxDrawdownPercent}% safety threshold.`,
          icon: '/favicon.ico',
        });
      }
    } else if (drawdown < maxDrawdownPercent * 0.8) {
      drawdownAlertRef.current = false; // Reset when recovered
    }

    // Consecutive losses alert
    if (state.consecutiveLosses >= maxConsecutiveLosses && !consecutiveLossAlertRef.current) {
      consecutiveLossAlertRef.current = true;
      toast.error(`🚨 ${state.consecutiveLosses} consecutive losses detected — review strategy performance`, { duration: 15000 });
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ Consecutive Losses', {
          body: `${state.consecutiveLosses} consecutive losses detected. Strategy may be underperforming.`,
          icon: '/favicon.ico',
        });
      }
    } else if (state.consecutiveLosses === 0) {
      consecutiveLossAlertRef.current = false;
    }

    // Unusual trade frequency (behavior anomaly)
    const now = Date.now();
    const hoursSinceLastCheck = (now - lastCheckTimeRef.current) / 3600000;
    if (hoursSinceLastCheck >= 0.5) {
      const newTrades = state.trades.length - lastTradeCountRef.current;
      const tradesPerHour = newTrades / hoursSinceLastCheck;
      if (tradesPerHour > unusualTradeFrequencyPerHour && !tradeFrequencyAlertRef.current) {
        tradeFrequencyAlertRef.current = true;
        toast.warning(`⚠️ Unusual Activity: ${tradesPerHour.toFixed(0)} trades/hr — possible signal noise`, { duration: 10000 });
      } else if (tradesPerHour <= unusualTradeFrequencyPerHour * 0.5) {
        tradeFrequencyAlertRef.current = false;
      }
      lastTradeCountRef.current = state.trades.length;
      lastCheckTimeRef.current = now;
    }
  }, [state.trades.length, state.consecutiveLosses, drawdown, isRunning, sessionStartTime]);
}
