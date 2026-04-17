/**
 * Live market data module with Binance WebSocket streaming.
 * Streams kline data and detects confirmed candle closes for signal execution.
 * Falls back to polling if WebSocket fails.
 */

import { Asset, Candle } from '@/types/trading';

export type CandleCloseCallback = (asset: Asset, candle: Candle) => void;
export type PriceUpdateCallback = (asset: Asset, price: number) => void;
export type StatusCallback = (status: ConnectionStatus) => void;

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastMessage: number;
  missedCandles: number;
  error: string | null;
}

interface KlineMessage {
  e: string;
  s: string;
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    o: string; // Open
    h: string; // High
    l: string; // Low
    c: string; // Close
    v: string; // Volume
    x: boolean; // Is this kline closed?
  };
}

const WS_BASE = 'wss://stream.binance.com:9443/ws';
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;
// Only count missed-candle errors that occurred within this rolling window.
// Anything older decays away so governance reflects CURRENT data quality.
const ERROR_ROLLING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const ERROR_DECAY_TICK_MS = 15_000;

export class LiveMarketDataManager {
  private ws: WebSocket | null = null;
  private assets: Asset[];
  private interval: string;
  private onCandleClose: CandleCloseCallback;
  private onPriceUpdate: PriceUpdateCallback;
  private onStatusChange: StatusCallback;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private status: ConnectionStatus = {
    connected: false,
    reconnecting: false,
    lastMessage: 0,
    missedCandles: 0,
    error: null,
  };
  private lastCandleTime: Record<string, number> = {};
  private destroyed = false;
  // Rolling timestamps of recent missed-candle events. Only entries within
  // ERROR_ROLLING_WINDOW_MS contribute to `missedCandles`.
  private recentErrorTimestamps: number[] = [];
  private decayTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    assets: Asset[],
    interval: string,
    onCandleClose: CandleCloseCallback,
    onPriceUpdate: PriceUpdateCallback,
    onStatusChange: StatusCallback,
  ) {
    this.assets = assets;
    this.interval = interval;
    this.onCandleClose = onCandleClose;
    this.onPriceUpdate = onPriceUpdate;
    this.onStatusChange = onStatusChange;
  }

  connect(): void {
    if (this.destroyed) return;
    this.cleanup();

    const streams = this.assets
      .map(a => `${a.toLowerCase()}@kline_${this.interval}`)
      .join('/');

    const url = `${WS_BASE}/${streams}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectDelay = INITIAL_RECONNECT_DELAY;
        // Successful (re)connection clears recent error history so governance
        // does not stay RESTRICTED based on stale failures.
        this.recentErrorTimestamps = [];
        this.updateStatus({
          connected: true,
          reconnecting: false,
          error: null,
          missedCandles: 0,
        });
        this.startHeartbeat();
        this.startDecayTimer();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: KlineMessage = JSON.parse(event.data);
          if (data.e !== 'kline') return;

          this.updateStatus({ lastMessage: Date.now() });

          const asset = data.s as Asset;
          const kline = data.k;
          const currentPrice = parseFloat(kline.c);

          // Always emit price updates for live display
          this.onPriceUpdate(asset, currentPrice);

          // Only process confirmed candle closes
          if (kline.x) {
            const candle: Candle = {
              timestamp: kline.t,
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v),
            };

            // Check for missed candles
            const key = `${asset}-${this.interval}`;
            if (this.lastCandleTime[key]) {
              const expectedInterval = this.getIntervalMs();
              const gap = kline.t - this.lastCandleTime[key];
              if (gap > expectedInterval * 1.5) {
                const missed = Math.round(gap / expectedInterval) - 1;
                const now = Date.now();
                for (let i = 0; i < missed; i++) {
                  this.recentErrorTimestamps.push(now);
                }
                this.refreshErrorWindow();
              }
            }
            this.lastCandleTime[key] = kline.t;

            this.onCandleClose(asset, candle);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onerror = () => {
        this.updateStatus({ error: 'WebSocket connection error' });
      };

      this.ws.onclose = () => {
        this.updateStatus({ connected: false });
        this.stopHeartbeat();
        if (!this.destroyed) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      this.updateStatus({
        connected: false,
        error: `Failed to connect: ${err instanceof Error ? err.message : 'unknown error'}`,
      });
      if (!this.destroyed) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    this.updateStatus({ reconnecting: true });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
      this.connect();
    }, this.reconnectDelay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      // If no message in 60s, reconnect
      if (this.status.lastMessage > 0 && Date.now() - this.status.lastMessage > 60000) {
        this.connect();
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private updateStatus(partial: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...partial };
    this.onStatusChange({ ...this.status });
  }

  private getIntervalMs(): number {
    const map: Record<string, number> = {
      '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000,
    };
    return map[this.interval] || 900000;
  }

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  updateAssets(assets: Asset[]): void {
    this.assets = assets;
    if (this.status.connected) {
      this.connect(); // Reconnect with new streams
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.cleanup();
    this.updateStatus({ connected: false, reconnecting: false });
  }
}
