import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipLabel } from './TooltipLabel';
import { TIMEFRAME_OPTIONS } from './types';

interface TimeframeConfigProps {
  timeframe: '5m' | '15m' | '1h' | '4h';
  onTimeframeChange: (tf: '5m' | '15m' | '1h' | '4h') => void;
}

export function TimeframeConfig({
  timeframe,
  onTimeframeChange,
}: TimeframeConfigProps) {
  return (
    <div className="space-y-3">
      <TooltipLabel 
        label="Timeframe" 
        tooltip="Candle duration for analysis. Shorter timeframes give more signals but more noise. Longer timeframes have better signal quality but fewer trades."
        className="text-sm font-medium"
      />
      <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as typeof timeframe)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIMEFRAME_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
