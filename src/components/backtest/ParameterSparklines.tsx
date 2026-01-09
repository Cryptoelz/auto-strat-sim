import React, { useMemo } from 'react';
import { PresetVersion } from '@/types/preset-version';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface ParameterSparklinesProps {
  versions: PresetVersion[];
  className?: string;
}

interface ParamConfig {
  key: keyof PresetVersion['data'];
  label: string;
  suffix?: string;
  color: string;
}

const PARAMS: ParamConfig[] = [
  { key: 'fastSMA', label: 'Fast SMA', color: 'hsl(var(--chart-1))' },
  { key: 'slowSMA', label: 'Slow SMA', color: 'hsl(var(--chart-2))' },
  { key: 'positionSizePercent', label: 'Position', suffix: '%', color: 'hsl(var(--chart-3))' },
  { key: 'stopLossPercent', label: 'Stop Loss', suffix: '%', color: 'hsl(var(--chart-4))' },
  { key: 'takeProfitPercent', label: 'Take Profit', suffix: '%', color: 'hsl(var(--chart-5))' },
];

interface SparklineData {
  index: number;
  value: number;
  versionId: string;
}

function Sparkline({ 
  data, 
  color, 
  label, 
  suffix = '',
  currentValue,
  minValue,
  maxValue,
  changePercent,
}: { 
  data: SparklineData[]; 
  color: string; 
  label: string;
  suffix?: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
  changePercent: number;
}) {
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
    if (!active || !payload || !payload[0]) return null;
    return (
      <div className="bg-popover border border-border rounded px-1.5 py-0.5 text-[10px] shadow-sm">
        {payload[0].value}{suffix}
      </div>
    );
  };

  const isIncreasing = changePercent > 0;
  const isDecreasing = changePercent < 0;
  const hasChange = changePercent !== 0;

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-20 text-[10px] text-muted-foreground truncate">{label}</div>
      <div className="flex-1 h-6 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <RechartsTooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="w-14 text-right">
        <span className="text-xs font-medium">{currentValue}{suffix}</span>
      </div>
      <div className="w-12 text-right">
        {hasChange ? (
          <span className={cn(
            "text-[10px]",
            isIncreasing && "text-green-600",
            isDecreasing && "text-red-600"
          )}>
            {isIncreasing && '+'}
            {changePercent.toFixed(0)}%
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        )}
      </div>
      <div className="w-16 text-right text-[10px] text-muted-foreground">
        {minValue}{suffix}–{maxValue}{suffix}
      </div>
    </div>
  );
}

export function ParameterSparklines({ versions, className }: ParameterSparklinesProps) {
  const sparklineData = useMemo(() => {
    if (versions.length < 2) return null;

    // Sort versions from oldest to newest
    const sortedVersions = [...versions].sort((a, b) => a.savedAt - b.savedAt);

    return PARAMS.map(param => {
      const data: SparklineData[] = sortedVersions.map((v, index) => ({
        index,
        value: v.data[param.key] as number,
        versionId: v.id,
      }));

      const values = data.map(d => d.value);
      const currentValue = values[values.length - 1];
      const firstValue = values[0];
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const changePercent = firstValue !== 0 
        ? ((currentValue - firstValue) / firstValue) * 100 
        : 0;

      return {
        ...param,
        data,
        currentValue,
        minValue,
        maxValue,
        changePercent,
      };
    });
  }, [versions]);

  if (!sparklineData) {
    return (
      <div className="text-center py-2 text-xs text-muted-foreground">
        Need at least 2 versions to show sparklines
      </div>
    );
  }

  return (
    <div className={cn("bg-muted/30 rounded-lg p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Parameter Evolution</span>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Current</span>
          <span>Change</span>
          <span>Range</span>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {sparklineData.map(param => (
          <Sparkline
            key={param.key}
            data={param.data}
            color={param.color}
            label={param.label}
            suffix={param.suffix}
            currentValue={param.currentValue}
            minValue={param.minValue}
            maxValue={param.maxValue}
            changePercent={param.changePercent}
          />
        ))}
      </div>
    </div>
  );
}
