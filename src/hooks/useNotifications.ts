import { useState, useCallback, useEffect } from 'react';
import { Signal, Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const sendSignalNotification = useCallback((signal: Signal) => {
    if (permission !== 'granted') return;
    if (signal.type === 'HOLD') return;

    const info = ASSET_INFO[signal.asset];
    const title = `${signal.type} Signal: ${info.symbol}`;
    const body = `${signal.type === 'BUY' ? '📈' : '📉'} ${signal.type} ${info.name} at $${signal.price.toLocaleString()}`;

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `signal-${signal.asset}-${signal.timestamp}`,
        requireInteraction: false,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [permission]);

  return {
    permission,
    isSupported: 'Notification' in window,
    requestPermission,
    sendSignalNotification,
  };
}
