import React, { useState, useMemo } from 'react';
import { PresetVersion } from '@/types/preset-version';
import { format } from 'date-fns';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface VersionTimelineProps {
  versions: PresetVersion[];
  onVersionClick?: (versionId: string) => void;
  selectedVersionId?: string | null;
}

interface TimelineDataPoint {
  timestamp: number;
  changeCount: number;
  versionId: string;
  label: string;
  pinned: boolean;
  changes: string[];
}

const PARAM_LABELS: Record<string, string> = {
  label: 'Name',
  fastSMA: 'Fast SMA',
  slowSMA: 'Slow SMA',
  positionSizePercent: 'Position Size',
  stopLossPercent: 'Stop Loss',
  takeProfitPercent: 'Take Profit',
};

export function VersionTimeline({ versions, onVersionClick, selectedVersionId }: VersionTimelineProps) {
  const [hoveredVersion, setHoveredVersion] = useState<string | null>(null);

  const timelineData = useMemo(() => {
    if (versions.length === 0) return [];

    const data: TimelineDataPoint[] = [];

    // Process versions from oldest to newest
    const sortedVersions = [...versions].sort((a, b) => a.savedAt - b.savedAt);

    for (let i = 0; i < sortedVersions.length; i++) {
      const version = sortedVersions[i];
      const changes: string[] = [];
      let changeCount = 0;

      if (i > 0) {
        const prev = sortedVersions[i - 1];
        const keys: (keyof typeof version.data)[] = [
          'label', 'fastSMA', 'slowSMA', 'positionSizePercent', 'stopLossPercent', 'takeProfitPercent'
        ];

        for (const key of keys) {
          if (version.data[key] !== prev.data[key]) {
            changeCount++;
            changes.push(PARAM_LABELS[key] || key);
          }
        }
      } else {
        changeCount = 1; // First version
        changes.push('Initial version');
      }

      data.push({
        timestamp: version.savedAt,
        changeCount: Math.max(changeCount, 1),
        versionId: version.id,
        label: version.data.label,
        pinned: version.pinned || false,
        changes,
      });
    }

    return data;
  }, [versions]);

  if (versions.length < 2) {
    return (
      <div className="text-center py-4 text-xs text-muted-foreground">
        Need at least 2 versions to show timeline
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TimelineDataPoint }> }) => {
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs max-w-48">
        <div className="font-medium truncate">{data.label}</div>
        <div className="text-muted-foreground">
          {format(new Date(data.timestamp), 'MMM d, yyyy h:mm a')}
        </div>
        {data.changes.length > 0 && (
          <div className="mt-1 pt-1 border-t border-border">
            <span className="text-muted-foreground">Changed: </span>
            {data.changes.join(', ')}
          </div>
        )}
        {data.pinned && (
          <div className="text-primary mt-1">📌 Pinned</div>
        )}
      </div>
    );
  };

  const CustomDot = (props: { cx?: number; cy?: number; payload?: TimelineDataPoint }) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;

    const isSelected = selectedVersionId === payload.versionId;
    const isHovered = hoveredVersion === payload.versionId;
    const size = 6 + payload.changeCount * 2;

    return (
      <g
        style={{ cursor: 'pointer' }}
        onClick={() => onVersionClick?.(payload.versionId)}
        onMouseEnter={() => setHoveredVersion(payload.versionId)}
        onMouseLeave={() => setHoveredVersion(null)}
      >
        {/* Outer ring for selected/hovered */}
        {(isSelected || isHovered) && (
          <circle
            cx={cx}
            cy={cy}
            r={size + 4}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            opacity={isSelected ? 1 : 0.5}
          />
        )}
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={size}
          fill={payload.pinned ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)'}
          stroke={payload.pinned ? 'hsl(var(--primary-foreground))' : 'none'}
          strokeWidth={payload.pinned ? 2 : 0}
        />
        {/* Inner indicator for pinned */}
        {payload.pinned && (
          <circle
            cx={cx}
            cy={cy}
            r={3}
            fill="hsl(var(--primary-foreground))"
          />
        )}
      </g>
    );
  };

  const minTime = Math.min(...timelineData.map(d => d.timestamp));
  const maxTime = Math.max(...timelineData.map(d => d.timestamp));
  const maxChanges = Math.max(...timelineData.map(d => d.changeCount));

  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Version Timeline</span>
        <span className="text-[10px] text-muted-foreground">
          Click a point to select version
        </span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
            <XAxis
              type="number"
              dataKey="timestamp"
              domain={[minTime - (maxTime - minTime) * 0.05, maxTime + (maxTime - minTime) * 0.05]}
              tickFormatter={(val) => format(new Date(val), 'MMM d')}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              type="number"
              dataKey="changeCount"
              domain={[0, maxChanges + 1]}
              hide
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Scatter
              data={timelineData}
              shape={(props) => <CustomDot {...props} />}
            />
            {/* Connecting line */}
            {timelineData.length > 1 && (
              <ReferenceLine
                segment={timelineData.map(d => ({ x: d.timestamp, y: d.changeCount }))}
                stroke="hsl(var(--primary) / 0.3)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/70" />
          <span>Version</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary ring-1 ring-primary-foreground" />
          <span>Pinned</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Dot size = # of changes</span>
        </div>
      </div>
    </div>
  );
}
