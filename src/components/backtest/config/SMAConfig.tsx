import { Input } from '@/components/ui/input';
import { TooltipLabel, FieldError } from './TooltipLabel';

interface SMAConfigProps {
  fastSMA: number;
  slowSMA: number;
  onFastSMAChange: (value: number) => void;
  onSlowSMAChange: (value: number) => void;
  fastSMAError?: string;
  slowSMAError?: string;
}

export function SMAConfig({
  fastSMA,
  slowSMA,
  onFastSMAChange,
  onSlowSMAChange,
  fastSMAError,
  slowSMAError,
}: SMAConfigProps) {
  return (
    <div className="space-y-3">
      <TooltipLabel 
        label="SMA Periods" 
        tooltip="Simple Moving Average periods. Fast SMA crossing above Slow SMA generates buy signals, crossing below generates sell signals."
        className="text-sm font-medium"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <TooltipLabel 
            label="Fast SMA" 
            tooltip="Short-term moving average (5-100 periods). Reacts quickly to price changes."
            className="text-xs text-muted-foreground"
            error={!!fastSMAError}
          />
          <Input
            type="number"
            value={fastSMA}
            onChange={(e) => onFastSMAChange(parseInt(e.target.value) || 0)}
            min={5}
            max={100}
            className={fastSMAError ? "border-destructive" : ""}
          />
          <FieldError message={fastSMAError} />
        </div>
        <div className="space-y-1.5">
          <TooltipLabel 
            label="Slow SMA" 
            tooltip="Long-term moving average (10-200 periods). Smooths out noise and shows the trend."
            className="text-xs text-muted-foreground"
            error={!!slowSMAError}
          />
          <Input
            type="number"
            value={slowSMA}
            onChange={(e) => onSlowSMAChange(parseInt(e.target.value) || 0)}
            min={10}
            max={200}
            className={slowSMAError ? "border-destructive" : ""}
          />
          <FieldError message={slowSMAError} />
        </div>
      </div>
    </div>
  );
}
