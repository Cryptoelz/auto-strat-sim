import React, { useMemo } from 'react';
import { PresetVersion } from '@/types/preset-version';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface VersionDiffSparklinesProps {
  version1: PresetVersion;
  version2: PresetVersion;
  allVersions: PresetVersion[];
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
  { key: 'positionSizePercent', label: 'Position %', suffix: '%', color: 'hsl(var(--chart-3))' },
  { key: 'stopLossPercent', label: 'Stop Loss %', suffix: '%', color: 'hsl(var(--chart-4))' },
  { key: 'takeProfitPercent', label: 'Take Profit %', suffix: '%', color: 'hsl(var(--chart-5))' },
];

interface ComparisonBarData {
  name: string;
  v1Value: number;
  v2Value: number;
  diff: number;
  diffPercent: number;
  min: number;
  max: number;
  suffix?: string;
}

function ComparisonBar({ 
  data,
  v1Label,
  v2Label,
}: { 
  data: ComparisonBarData;
  v1Label: string;
  v2Label: string;
}) {
  const increased = data.diff > 0;
  const decreased = data.diff < 0;
  const unchanged = data.diff === 0;

  const range = data.max - data.min;
  const v1Position = range > 0 ? ((data.v1Value - data.min) / range) * 100 : 50;
  const v2Position = range > 0 ? ((data.v2Value - data.min) / range) * 100 : 50;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{data.name}</span>
        <div className="flex items-center gap-2">
          {!unchanged && (
            <span className={cn(
              "text-[10px] font-medium",
              increased && "text-green-500",
              decreased && "text-red-500"
            )}>
              {increased ? '+' : ''}{data.diff.toFixed(data.suffix ? 1 : 0)}{data.suffix || ''}
              {data.diffPercent !== 0 && (
                <span className="opacity-70 ml-0.5">
                  ({increased ? '+' : ''}{data.diffPercent.toFixed(0)}%)
                </span>
              )}
            </span>
          )}
          {unchanged && (
            <span className="text-[10px] text-muted-foreground">No change</span>
          )}
        </div>
      </div>
      
      {/* Visual bar comparison */}
      <div className="relative h-6 bg-muted/50 rounded overflow-hidden">
        {/* Range indicator */}
        <div className="absolute inset-0 flex items-center justify-between px-1 text-[8px] text-muted-foreground/50">
          <span>{data.min}{data.suffix || ''}</span>
          <span>{data.max}{data.suffix || ''}</span>
        </div>
        
        {/* Version 1 marker */}
        <div 
          className="absolute top-0 h-full w-1 bg-amber-500/80 transition-all"
          style={{ left: `${v1Position}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 border border-background" />
        </div>
        
        {/* Version 2 marker */}
        <div 
          className="absolute top-0 h-full w-1 bg-primary/80 transition-all"
          style={{ left: `${v2Position}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary border border-background" />
        </div>
        
        {/* Arrow showing direction of change */}
        {!unchanged && (
          <div 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-0.5 transition-all",
              increased ? "bg-green-500/50" : "bg-red-500/50"
            )}
            style={{
              left: `${Math.min(v1Position, v2Position)}%`,
              width: `${Math.abs(v2Position - v1Position)}%`,
            }}
          />
        )}
      </div>
      
      {/* Value labels */}
      <div className="flex items-center justify-between mt-1 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">{v1Label}:</span>
          <span className="font-medium">{data.v1Value}{data.suffix || ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">{v2Label}:</span>
          <span className="font-medium">{data.v2Value}{data.suffix || ''}</span>
        </div>
      </div>
    </div>
  );
}

export function VersionDiffSparklines({ 
  version1, 
  version2, 
  allVersions,
  className 
}: VersionDiffSparklinesProps) {
  const comparisonData = useMemo(() => {
    // Sort versions from oldest to newest to get min/max context
    const sortedVersions = [...allVersions].sort((a, b) => a.savedAt - b.savedAt);
    
    return PARAMS.map(param => {
      const v1Value = version1.data[param.key] as number;
      const v2Value = version2.data[param.key] as number;
      
      // Get min/max across all versions for context
      const allValues = sortedVersions.map(v => v.data[param.key] as number);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      
      const diff = v2Value - v1Value;
      const diffPercent = v1Value !== 0 ? (diff / Math.abs(v1Value)) * 100 : 0;
      
      return {
        name: param.label,
        v1Value,
        v2Value,
        diff,
        diffPercent,
        min,
        max,
        suffix: param.suffix,
      };
    });
  }, [version1, version2, allVersions]);

  const v1Label = new Date(version1.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const v2Label = new Date(version2.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const changedParams = comparisonData.filter(d => d.diff !== 0);
  const unchangedParams = comparisonData.filter(d => d.diff === 0);

  return (
    <div className={cn("bg-muted/30 rounded-lg p-3", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium">Parameter Comparison</span>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Older</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Newer</span>
          </div>
        </div>
      </div>
      
      {/* Changed parameters first */}
      {changedParams.length > 0 && (
        <div className="space-y-1 divide-y divide-border/50">
          {changedParams.map(data => (
            <ComparisonBar
              key={data.name}
              data={data}
              v1Label={v1Label}
              v2Label={v2Label}
            />
          ))}
        </div>
      )}
      
      {/* Unchanged parameters collapsed */}
      {unchangedParams.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="text-[10px] text-muted-foreground mb-1">
            Unchanged: {unchangedParams.map(d => d.name).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
