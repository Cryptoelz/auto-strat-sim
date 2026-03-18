import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Asset, Candle, Trade, DecisionLogEntry } from '@/types/trading';
import { ASSET_INFO, DEFAULT_CONFIG } from '@/config/trading';
import { calculateSMASeries, calculateATRPercent } from '@/lib/indicators';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
  ReferenceLine,
  Scatter,
} from 'recharts';
import { format } from 'date-fns';
import { Eye, EyeOff, TrendingUp, TrendingDown, Activity, ShieldOff } from 'lucide-react';

interface PriceChartProps {
  asset: Asset;
  candles: Candle[];
  position?: { entryPrice: number; direction?: string } | null;
  fastSMA?: number;
  slowSMA?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  trades?: Trade[];
  blockedSignals?: DecisionLogEntry[];
}

const ASSET_COLORS: Record<Asset, string> = {
  BTCUSDT: 'hsl(43, 96%, 56%)',
  XRPUSDT: 'hsl(220, 100%, 60%)',
  FETUSDT: 'hsl(280, 80%, 55%)',
  XLMUSDT: 'hsl(170, 70%, 50%)',
};

interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  smaFast: number | null;
  smaSlow: number | null;
  atrPercent: number | null;
  isUp: boolean;
  body: number;
  bodyBottom: number;
  // Marker fields
  longEntry?: number;
  longExit?: number;
  shortEntry?: number;
  shortExit?: number;
  crossUp?: number;
  crossDown?: number;
  blocked?: number;
  markerTooltip?: string;
}

export function PriceChart({
  asset,
  candles,
  position,
  fastSMA,
  slowSMA,
  isSelected,
  onSelect,
  trades,
  blockedSignals,
}: PriceChartProps) {
  const info = ASSET_INFO[asset];
  const fastPeriod = fastSMA ?? DEFAULT_CONFIG.indicators.fastSMA;
  const slowPeriod = slowSMA ?? DEFAULT_CONFIG.indicators.slowSMA;

  // Toggle states
  const [showSMA, setShowSMA] = useState(true);
  const [showTradeMarkers, setShowTradeMarkers] = useState(true);
  const [showSignalMarkers, setShowSignalMarkers] = useState(true);
  const [showBlockedSignals, setShowBlockedSignals] = useState(false);

  const chartData = useMemo(() => {
    if (candles.length === 0) return [];

    const fastSMAValues = calculateSMASeries(candles, fastPeriod);
    const slowSMAValues = calculateSMASeries(candles, slowPeriod);

    const data: ChartDataPoint[] = candles.map((candle, index) => {
      // Compute ATR% at this point (using last 14 candles)
      let atrPct: number | null = null;
      if (index >= 15) {
        const slice = candles.slice(0, index + 1);
        atrPct = calculateATRPercent(slice, 14);
      }

      // Detect crossovers for signal markers
      let crossUp: number | undefined;
      let crossDown: number | undefined;
      if (index > 0 && fastSMAValues[index] !== null && slowSMAValues[index] !== null &&
          fastSMAValues[index - 1] !== null && slowSMAValues[index - 1] !== null) {
        const fastCurr = fastSMAValues[index]!;
        const slowCurr = slowSMAValues[index]!;
        const fastPrev = fastSMAValues[index - 1]!;
        const slowPrev = slowSMAValues[index - 1]!;
        if (fastPrev <= slowPrev && fastCurr > slowCurr) {
          crossUp = candle.close;
        }
        if (fastPrev >= slowPrev && fastCurr < slowCurr) {
          crossDown = candle.close;
        }
      }

      return {
        time: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        smaFast: fastSMAValues[index],
        smaSlow: slowSMAValues[index],
        atrPercent: atrPct,
        isUp: candle.close >= candle.open,
        body: Math.abs(candle.close - candle.open),
        bodyBottom: Math.min(candle.open, candle.close),
        crossUp,
        crossDown,
      };
    });

    // Overlay trade markers
    if (trades && trades.length > 0) {
      const assetTrades = trades.filter(t => t.asset === asset);
      for (const trade of assetTrades) {
        // Find entry candle
        const entryIdx = data.findIndex(d => d.time >= trade.entryTime);
        if (entryIdx >= 0) {
          if (trade.direction === 'long') {
            data[entryIdx].longEntry = trade.entryPrice;
            data[entryIdx].markerTooltip = `LONG Entry @ $${trade.entryPrice.toFixed(2)}`;
          } else {
            data[entryIdx].shortEntry = trade.entryPrice;
            data[entryIdx].markerTooltip = `SHORT Entry @ $${trade.entryPrice.toFixed(2)}`;
          }
        }
        // Find exit candle
        const exitIdx = data.findIndex(d => d.time >= trade.exitTime);
        if (exitIdx >= 0) {
          if (trade.direction === 'long') {
            data[exitIdx].longExit = trade.exitPrice;
            data[exitIdx].markerTooltip = `Close LONG @ $${trade.exitPrice.toFixed(2)} | PnL: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)} | ${trade.exitReason}`;
          } else {
            data[exitIdx].shortExit = trade.exitPrice;
            data[exitIdx].markerTooltip = `Close SHORT @ $${trade.exitPrice.toFixed(2)} | PnL: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)} | ${trade.exitReason}`;
          }
        }
      }
    }

    // Overlay blocked signals
    if (blockedSignals && blockedSignals.length > 0) {
      const assetBlocked = blockedSignals.filter(b => b.asset === asset && b.action === 'blocked');
      for (const blocked of assetBlocked) {
        const idx = data.findIndex(d => d.time >= blocked.timestamp);
        if (idx >= 0 && !data[idx].blocked) {
          data[idx].blocked = data[idx].close;
          data[idx].markerTooltip = `Blocked: ${blocked.explanation}`;
        }
      }
    }

    return data;
  }, [candles, fastPeriod, slowPeriod, trades, blockedSignals, asset]);

  const [minPrice, maxPrice] = useMemo(() => {
    if (chartData.length === 0) return [0, 0];
    const lows = chartData.map((d) => d.low);
    const highs = chartData.map((d) => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.05;
    return [min - padding, max + padding];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full bg-${info.color}`}></span>
            {info.name} ({info.symbol})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">Loading chart data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-border/50 bg-card/50 backdrop-blur cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: ASSET_COLORS[asset] }}
          ></span>
          {info.name} ({info.symbol})
          {isSelected && (
            <span className="ml-1 text-xs font-normal text-primary">[Selected]</span>
          )}
          {position && (
            <span className={`ml-2 text-sm font-normal ${position.direction === 'short' ? 'text-trading-loss' : 'text-trading-profit'}`}>
              {position.direction === 'short' ? 'SHORT' : 'LONG'} @ ${position.entryPrice.toFixed(2)}
            </span>
          )}
        </CardTitle>
        {/* Chart controls */}
        <div className="flex flex-wrap items-center gap-1 mt-1">
          <Button
            variant={showSMA ? 'secondary' : 'ghost'}
            size="sm"
            className="h-5 px-1.5 text-[10px] gap-1"
            onClick={(e) => { e.stopPropagation(); setShowSMA(!showSMA); }}
          >
            <Activity className="h-3 w-3" />
            SMA
          </Button>
          <Button
            variant={showTradeMarkers ? 'secondary' : 'ghost'}
            size="sm"
            className="h-5 px-1.5 text-[10px] gap-1"
            onClick={(e) => { e.stopPropagation(); setShowTradeMarkers(!showTradeMarkers); }}
          >
            <TrendingUp className="h-3 w-3" />
            Trades
          </Button>
          <Button
            variant={showSignalMarkers ? 'secondary' : 'ghost'}
            size="sm"
            className="h-5 px-1.5 text-[10px] gap-1"
            onClick={(e) => { e.stopPropagation(); setShowSignalMarkers(!showSignalMarkers); }}
          >
            <TrendingDown className="h-3 w-3" />
            Signals
          </Button>
          <Button
            variant={showBlockedSignals ? 'secondary' : 'ghost'}
            size="sm"
            className="h-5 px-1.5 text-[10px] gap-1"
            onClick={(e) => { e.stopPropagation(); setShowBlockedSignals(!showBlockedSignals); }}
          >
            <ShieldOff className="h-3 w-3" />
            Blocked
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[200px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tickFormatter={(time) => format(new Date(time), 'HH:mm')}
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                  maxWidth: '300px',
                }}
                labelFormatter={(time) => format(new Date(time), 'MMM dd, HH:mm')}
                formatter={(value: number, name: string) => {
                  if (name === 'smaFast' && showSMA) return [`$${value?.toFixed(2)}`, `SMA ${fastPeriod}`];
                  if (name === 'smaSlow' && showSMA) return [`$${value?.toFixed(2)}`, `SMA ${slowPeriod}`];
                  if (name === 'longEntry') return [`$${value?.toFixed(2)}`, '▲ LONG Entry'];
                  if (name === 'longExit') return [`$${value?.toFixed(2)}`, '● Close LONG'];
                  if (name === 'shortEntry') return [`$${value?.toFixed(2)}`, '▼ SHORT Entry'];
                  if (name === 'shortExit') return [`$${value?.toFixed(2)}`, '● Close SHORT'];
                  if (name === 'crossUp') return [`$${value?.toFixed(2)}`, '⬆ Bullish Cross'];
                  if (name === 'crossDown') return [`$${value?.toFixed(2)}`, '⬇ Bearish Cross'];
                  if (name === 'blocked') return [`$${value?.toFixed(2)}`, '⛔ Blocked'];
                  if (name === 'close') return [`$${value?.toFixed(2)}`, 'Close'];
                  return [null, null];
                }}
              />

              {/* Candlestick bodies (transparent placeholder) */}
              <Bar dataKey="body" stackId="candle" fill="transparent" stroke="transparent" />

              {/* SMA lines */}
              {showSMA && (
                <>
                  <Line type="monotone" dataKey="smaFast" stroke="hsl(var(--trading-sma-fast))" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="smaSlow" stroke="hsl(var(--trading-sma-slow))" strokeWidth={2} dot={false} connectNulls />
                </>
              )}

              {/* Close price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke={ASSET_COLORS[asset]}
                strokeWidth={1.5}
                dot={false}
              />

              {/* Trade markers */}
              {showTradeMarkers && (
                <>
                  <Scatter
                    dataKey="longEntry"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (cx == null || cy == null) return null;
                      return <polygon points={`${cx},${cy - 8} ${cx - 5},${cy + 2} ${cx + 5},${cy + 2}`} fill="hsl(142, 76%, 45%)" stroke="hsl(var(--background))" strokeWidth={1} />;
                    }}
                  />
                  <Scatter
                    dataKey="longExit"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (cx == null || cy == null) return null;
                      return <circle cx={cx} cy={cy} r={4} fill="hsl(142, 76%, 45%)" stroke="hsl(var(--background))" strokeWidth={1.5} />;
                    }}
                  />
                  <Scatter
                    dataKey="shortEntry"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (cx == null || cy == null) return null;
                      return <polygon points={`${cx},${cy + 8} ${cx - 5},${cy - 2} ${cx + 5},${cy - 2}`} fill="hsl(0, 84%, 60%)" stroke="hsl(var(--background))" strokeWidth={1} />;
                    }}
                  />
                  <Scatter
                    dataKey="shortExit"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (cx == null || cy == null) return null;
                      return <circle cx={cx} cy={cy} r={4} fill="hsl(0, 84%, 60%)" stroke="hsl(var(--background))" strokeWidth={1.5} />;
                    }}
                  />
                </>
              )}

              {/* Signal crossover markers */}
              {showSignalMarkers && (
                <>
                  <Scatter
                    dataKey="crossUp"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (cx == null || cy == null) return null;
                      return <polygon points={`${cx},${cy - 12} ${cx - 4},${cy - 5} ${cx + 4},${cy - 5}`} fill="hsl(142, 76%, 45%)" fillOpacity={0.5} />;
                    }}
                  />
                  <Scatter
                    dataKey="crossDown"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (cx == null || cy == null) return null;
                      return <polygon points={`${cx},${cy + 12} ${cx - 4},${cy + 5} ${cx + 4},${cy + 5}`} fill="hsl(0, 84%, 60%)" fillOpacity={0.5} />;
                    }}
                  />
                </>
              )}

              {/* Blocked signal markers */}
              {showBlockedSignals && (
                <Scatter
                  dataKey="blocked"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (cx == null || cy == null) return null;
                    return (
                      <g>
                        <circle cx={cx} cy={cy - 10} r={5} fill="hsl(var(--destructive))" fillOpacity={0.3} stroke="hsl(var(--destructive))" strokeWidth={1} />
                        <line x1={cx - 3} y1={cy - 13} x2={cx + 3} y2={cy - 7} stroke="hsl(var(--destructive))" strokeWidth={1.5} />
                        <line x1={cx + 3} y1={cy - 13} x2={cx - 3} y2={cy - 7} stroke="hsl(var(--destructive))" strokeWidth={1.5} />
                      </g>
                    );
                  }}
                />
              )}

              {/* Entry price reference line */}
              {position && (
                <ReferenceLine
                  y={position.entryPrice}
                  stroke={position.direction === 'short' ? 'hsl(var(--trading-loss))' : 'hsl(var(--trading-profit))'}
                  strokeDasharray="5 5"
                  label={{
                    value: `${position.direction === 'short' ? 'SHORT' : 'LONG'}: $${position.entryPrice.toFixed(2)}`,
                    fill: position.direction === 'short' ? 'hsl(var(--trading-loss))' : 'hsl(var(--trading-profit))',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        {(showTradeMarkers || showSignalMarkers) && (
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground justify-center">
            {showTradeMarkers && (
              <>
                <span className="flex items-center gap-1">
                  <svg width="8" height="8"><polygon points="4,0 0,8 8,8" fill="hsl(142, 76%, 45%)" /></svg>
                  Long Entry
                </span>
                <span className="flex items-center gap-1">
                  <svg width="8" height="8"><polygon points="4,8 0,0 8,0" fill="hsl(0, 84%, 60%)" /></svg>
                  Short Entry
                </span>
                <span className="flex items-center gap-1">
                  <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="hsl(142, 76%, 45%)" /></svg>
                  Long Exit
                </span>
                <span className="flex items-center gap-1">
                  <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="hsl(0, 84%, 60%)" /></svg>
                  Short Exit
                </span>
              </>
            )}
            {showBlockedSignals && (
              <span className="flex items-center gap-1">
                <svg width="8" height="8"><line x1="1" y1="1" x2="7" y2="7" stroke="hsl(var(--destructive))" strokeWidth="1.5" /><line x1="7" y1="1" x2="1" y2="7" stroke="hsl(var(--destructive))" strokeWidth="1.5" /></svg>
                Blocked
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
