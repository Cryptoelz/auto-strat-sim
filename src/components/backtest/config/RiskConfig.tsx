import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TooltipLabel, FieldError } from './TooltipLabel';

interface RiskConfigProps {
  initialBalance: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  feePercent: number;
  onInitialBalanceChange: (value: number) => void;
  onPositionSizeChange: (value: number) => void;
  onStopLossChange: (value: number) => void;
  onTakeProfitChange: (value: number) => void;
  onFeeChange: (value: number) => void;
  errors?: {
    initialBalance?: string;
    positionSize?: string;
    stopLoss?: string;
    takeProfit?: string;
    fee?: string;
  };
}

export function RiskConfig({
  initialBalance,
  positionSizePercent,
  stopLossPercent,
  takeProfitPercent,
  feePercent,
  onInitialBalanceChange,
  onPositionSizeChange,
  onStopLossChange,
  onTakeProfitChange,
  onFeeChange,
  errors = {},
}: RiskConfigProps) {
  return (
    <div className="space-y-4">
      <Separator />
      
      {/* Initial Balance */}
      <div className="space-y-1.5">
        <TooltipLabel 
          label="Initial Balance" 
          tooltip="Starting capital for the backtest. Results scale proportionally to this value."
          className="text-sm font-medium"
          error={!!errors.initialBalance}
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            value={initialBalance}
            onChange={(e) => onInitialBalanceChange(parseFloat(e.target.value) || 0)}
            min={100}
            max={100000000}
            className={`pl-7 ${errors.initialBalance ? "border-destructive" : ""}`}
          />
        </div>
        <FieldError message={errors.initialBalance} />
      </div>

      {/* Position Size & Fee */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <TooltipLabel 
            label="Position Size" 
            tooltip="Percentage of balance risked per trade. Lower values reduce risk but also potential returns."
            className="text-xs text-muted-foreground"
            error={!!errors.positionSize}
          />
          <div className="relative">
            <Input
              type="number"
              value={positionSizePercent}
              onChange={(e) => onPositionSizeChange(parseFloat(e.target.value) || 0)}
              min={1}
              max={100}
              step={0.1}
              className={`pr-7 ${errors.positionSize ? "border-destructive" : ""}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <FieldError message={errors.positionSize} />
        </div>
        <div className="space-y-1.5">
          <TooltipLabel 
            label="Fee" 
            tooltip="Trading fee per transaction. Typical exchange fees range from 0.01% to 0.1%."
            className="text-xs text-muted-foreground"
            error={!!errors.fee}
          />
          <div className="relative">
            <Input
              type="number"
              value={feePercent}
              onChange={(e) => onFeeChange(parseFloat(e.target.value) || 0)}
              min={0}
              max={5}
              step={0.01}
              className={`pr-7 ${errors.fee ? "border-destructive" : ""}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <FieldError message={errors.fee} />
        </div>
      </div>

      {/* Stop Loss & Take Profit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <TooltipLabel 
            label="Stop Loss" 
            tooltip="Maximum loss per trade as a percentage. Automatically closes losing trades to limit damage."
            className="text-xs text-muted-foreground"
            error={!!errors.stopLoss}
          />
          <div className="relative">
            <Input
              type="number"
              value={stopLossPercent}
              onChange={(e) => onStopLossChange(parseFloat(e.target.value) || 0)}
              min={0.1}
              max={50}
              step={0.1}
              className={`pr-7 ${errors.stopLoss ? "border-destructive" : ""}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <FieldError message={errors.stopLoss} />
        </div>
        <div className="space-y-1.5">
          <TooltipLabel 
            label="Take Profit" 
            tooltip="Target profit per trade as a percentage. Automatically closes winning trades to lock in gains."
            className="text-xs text-muted-foreground"
            error={!!errors.takeProfit}
          />
          <div className="relative">
            <Input
              type="number"
              value={takeProfitPercent}
              onChange={(e) => onTakeProfitChange(parseFloat(e.target.value) || 0)}
              min={0.1}
              max={100}
              step={0.1}
              className={`pr-7 ${errors.takeProfit ? "border-destructive" : ""}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <FieldError message={errors.takeProfit} />
        </div>
      </div>
    </div>
  );
}
