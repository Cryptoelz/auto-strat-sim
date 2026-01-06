import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset, Candle } from '@/types/trading';
import { ASSET_INFO, DEFAULT_CONFIG } from '@/config/trading';
import { calculateSMASeries } from '@/lib/indicators';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface PriceChartProps {
  asset: Asset;
  candles: Candle[];
  position?: { entryPrice: number } | null;
  fastSMA?: number;
  slowSMA?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

const ASSET_COLORS: Record<Asset, string> = {
  BTCUSDT: 'hsl(43, 96%, 56%)',
  XRPUSDT: 'hsl(220, 100%, 60%)',
  FETUSDT: 'hsl(280, 80%, 55%)',
  XLMUSDT: 'hsl(170, 70%, 50%)',
};

export function PriceChart({ asset, candles, position, fastSMA, slowSMA, isSelected, onSelect }: PriceChartProps) {
  const info = ASSET_INFO[asset];
  const fastPeriod = fastSMA ?? DEFAULT_CONFIG.indicators.fastSMA;
  const slowPeriod = slowSMA ?? DEFAULT_CONFIG.indicators.slowSMA;

  const chartData = useMemo(() => {
    if (candles.length === 0) return [];

    const fastSMAValues = calculateSMASeries(candles, fastPeriod);
    const slowSMAValues = calculateSMASeries(candles, slowPeriod);

    return candles.map((candle, index) => ({
      time: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      smaFast: fastSMAValues[index],
      smaSlow: slowSMAValues[index],
      // For candlestick visualization
      isUp: candle.close >= candle.open,
      body: Math.abs(candle.close - candle.open),
      bodyBottom: Math.min(candle.open, candle.close),
    }));
  }, [candles, fastPeriod, slowPeriod]);

  // Calculate domain for Y axis
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
            <span className="ml-2 text-sm font-normal text-trading-profit">
              Position @ ${position.entryPrice.toFixed(2)}
            </span>
          )}
        </CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-trading-sma-fast"></span>
            SMA {fastPeriod}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-trading-sma-slow"></span>
            SMA {slowPeriod}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[200px] w-full sm:h-[280px]">
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
                  fontSize: '12px',
                }}
                labelFormatter={(time) => format(new Date(time), 'MMM dd, HH:mm')}
                formatter={(value: number, name: string) => {
                  if (name === 'smaFast') return [`$${value?.toFixed(2)}`, `SMA ${fastPeriod}`];
                  if (name === 'smaSlow') return [`$${value?.toFixed(2)}`, `SMA ${slowPeriod}`];
                  return [`$${value?.toFixed(2)}`, name];
                }}
              />

              {/* Candlestick bodies as bars */}
              <Bar
                dataKey="body"
                stackId="candle"
                fill="transparent"
                stroke="transparent"
              />

              {/* SMA lines */}
              <Line
                type="monotone"
                dataKey="smaFast"
                stroke="hsl(var(--trading-sma-fast))"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="smaSlow"
                stroke="hsl(var(--trading-sma-slow))"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

              {/* Close price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke={asset === 'BTCUSDT' ? 'hsl(43, 96%, 56%)' : 'hsl(220, 100%, 60%)'}
                strokeWidth={1.5}
                dot={false}
              />

              {/* Entry price reference line */}
              {position && (
                <ReferenceLine
                  y={position.entryPrice}
                  stroke="hsl(var(--trading-profit))"
                  strokeDasharray="5 5"
                  label={{
                    value: `Entry: $${position.entryPrice.toFixed(2)}`,
                    fill: 'hsl(var(--trading-profit))',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
