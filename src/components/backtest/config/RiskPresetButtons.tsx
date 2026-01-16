import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RISK_PRESETS, RiskPreset } from '@/hooks/useBacktestConfig';
import { cn } from '@/lib/utils';

interface RiskPresetButtonsProps {
  activePreset: RiskPreset | null;
  onApplyPreset: (preset: RiskPreset) => void;
}

export function RiskPresetButtons({
  activePreset,
  onApplyPreset,
}: RiskPresetButtonsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Risk Presets</span>
        {activePreset && (
          <span className="text-xs text-primary font-medium">
            {RISK_PRESETS[activePreset].label}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {(['conservative', 'moderate', 'aggressive'] as const).map((preset) => (
          <Tooltip key={preset}>
            <TooltipTrigger asChild>
              <Button
                variant={activePreset === preset ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex-1 text-xs h-8",
                  activePreset === preset && "ring-2 ring-primary/20"
                )}
                onClick={() => onApplyPreset(preset)}
              >
                {preset === 'conservative' && '🛡️'}
                {preset === 'moderate' && '⚖️'}
                {preset === 'aggressive' && '🚀'}
                <span className="ml-1 hidden sm:inline">{RISK_PRESETS[preset].label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p className="font-medium mb-1">{RISK_PRESETS[preset].label}</p>
                <p>Position: {RISK_PRESETS[preset].positionSizePercent}%</p>
                <p>Stop Loss: {RISK_PRESETS[preset].stopLossPercent}%</p>
                <p>Take Profit: {RISK_PRESETS[preset].takeProfitPercent}%</p>
                <p>SMA: {RISK_PRESETS[preset].fastSMA}/{RISK_PRESETS[preset].slowSMA}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
