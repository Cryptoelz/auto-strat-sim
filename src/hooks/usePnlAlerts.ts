import { useEffect, useRef } from 'react';
import { TradingState } from '@/types/trading';
import { toast } from 'sonner';

interface UsePnlAlertsOptions {
  state: TradingState;
  profitTarget: number | null;
  lossLimit: number | null;
}

export function usePnlAlerts({ state, profitTarget, lossLimit }: UsePnlAlertsOptions) {
  const totalPnl = state.trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const profitAlertShownRef = useRef(false);
  const lossAlertShownRef = useRef(false);

  useEffect(() => {
    // Reset alerts if thresholds change
    profitAlertShownRef.current = false;
    lossAlertShownRef.current = false;
  }, [profitTarget, lossLimit]);

  useEffect(() => {
    // Check profit target
    if (profitTarget !== null && totalPnl >= profitTarget && !profitAlertShownRef.current) {
      profitAlertShownRef.current = true;
      toast.success(`🎯 Profit Target Reached! Total P&L: $${totalPnl.toFixed(2)}`, {
        duration: 10000,
      });
      
      // Browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Profit Target Reached! 🎯', {
          body: `Your total P&L of $${totalPnl.toFixed(2)} has reached your target of $${profitTarget.toFixed(2)}`,
          icon: '/favicon.ico',
        });
      }
    }

    // Check loss limit
    if (lossLimit !== null && totalPnl <= -lossLimit && !lossAlertShownRef.current) {
      lossAlertShownRef.current = true;
      toast.error(`⚠️ Loss Limit Reached! Total P&L: -$${Math.abs(totalPnl).toFixed(2)}`, {
        duration: 10000,
      });
      
      // Browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Loss Limit Reached! ⚠️', {
          body: `Your total P&L of -$${Math.abs(totalPnl).toFixed(2)} has reached your loss limit of $${lossLimit.toFixed(2)}`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [totalPnl, profitTarget, lossLimit]);

  return { totalPnl };
}
