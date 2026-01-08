import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Asset } from '@/types/trading';
import { BacktestResult, SavedRun } from '@/types/backtest';
import { ASSET_INFO } from '@/config/trading';
import { RISK_PRESETS, RiskPreset } from '@/hooks/useBacktestConfig';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Play, 
  RotateCcw, 
  Calendar as CalendarIcon,
  Save,
  Trash2,
  GitCompare,
  Download,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
  RefreshCcw
} from 'lucide-react';

interface TooltipLabelProps {
  label: string;
  tooltip: string;
  className?: string;
  error?: boolean;
}

function TooltipLabel({ label, tooltip, className, error }: TooltipLabelProps) {
  return (
    <div className="flex items-center gap-1">
      <Label className={cn(className, error && "text-destructive")}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface FieldErrors {
  assets?: string;
  dateRange?: string;
  fastSMA?: string;
  slowSMA?: string;
  initialBalance?: string;
  positionSize?: string;
  stopLoss?: string;
  takeProfit?: string;
  fee?: string;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

const TIMEFRAME_OPTIONS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

const AVAILABLE_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'];

interface BacktestConfigFormProps {
  // Date config
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  
  // Timeframe
  timeframe: '5m' | '15m' | '1h' | '4h';
  onTimeframeChange: (tf: '5m' | '15m' | '1h' | '4h') => void;
  
  // Assets
  enabledAssets: Asset[];
  onToggleAsset: (asset: Asset) => void;
  
  // SMA settings
  fastSMA: number;
  slowSMA: number;
  onFastSMAChange: (value: number) => void;
  onSlowSMAChange: (value: number) => void;
  
  // Risk settings
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
  
  // Actions
  isRunning: boolean;
  progress: number;
  result: BacktestResult | null;
  onRunBacktest: () => void;
  onReset: () => void;
  onSaveRun: () => void;
  onExportCSV: () => void;
  
  // Saved runs
  savedRuns: SavedRun[];
  showComparison: boolean;
  onToggleComparison: () => void;
  onClearAllRuns: () => void;
  onExportComparison: () => void;
  
  // Share & Reset
  onShareConfig?: () => Promise<boolean>;
  onResetToDefaults?: () => void;
  onApplyPreset?: (preset: RiskPreset) => void;
}

export function BacktestConfigForm({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  timeframe,
  onTimeframeChange,
  enabledAssets,
  onToggleAsset,
  fastSMA,
  slowSMA,
  onFastSMAChange,
  onSlowSMAChange,
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
  isRunning,
  progress,
  result,
  onRunBacktest,
  onReset,
  onSaveRun,
  onExportCSV,
  savedRuns,
  showComparison,
  onToggleComparison,
  onClearAllRuns,
  onExportComparison,
  onShareConfig,
  onResetToDefaults,
  onApplyPreset,
}: BacktestConfigFormProps) {
  const [copied, setCopied] = useState(false);

  // Real-time validation
  const fieldErrors = useMemo<FieldErrors>(() => {
    const errors: FieldErrors = {};
    
    // Assets validation
    if (enabledAssets.length === 0) {
      errors.assets = 'Select at least one trading pair';
    }
    
    // Date validation
    if (startDate >= endDate) {
      errors.dateRange = 'End date must be after start date';
    }
    if (startDate >= new Date()) {
      errors.dateRange = 'Start date must be in the past';
    }
    
    // SMA validation
    if (fastSMA < 5 || fastSMA > 100) {
      errors.fastSMA = 'Must be between 5 and 100';
    }
    if (slowSMA < 10 || slowSMA > 200) {
      errors.slowSMA = 'Must be between 10 and 200';
    }
    if (slowSMA <= fastSMA) {
      errors.slowSMA = 'Must be greater than Fast SMA';
    }
    
    // Initial balance validation
    if (initialBalance < 100) {
      errors.initialBalance = 'Must be at least $100';
    }
    if (initialBalance > 100000000) {
      errors.initialBalance = 'Must not exceed $100,000,000';
    }
    
    // Position size validation
    if (positionSizePercent < 1 || positionSizePercent > 100) {
      errors.positionSize = 'Must be between 1% and 100%';
    }
    
    // Stop loss validation
    if (stopLossPercent < 0.1 || stopLossPercent > 50) {
      errors.stopLoss = 'Must be between 0.1% and 50%';
    }
    
    // Take profit validation
    if (takeProfitPercent < 0.1 || takeProfitPercent > 100) {
      errors.takeProfit = 'Must be between 0.1% and 100%';
    }
    
    // Fee validation
    if (feePercent < 0 || feePercent > 5) {
      errors.fee = 'Must be between 0% and 5%';
    }
    
    return errors;
  }, [enabledAssets, startDate, endDate, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, feePercent]);

  // Detect which preset matches current values
  const activePreset = useMemo<RiskPreset | null>(() => {
    for (const [key, preset] of Object.entries(RISK_PRESETS)) {
      if (
        positionSizePercent === preset.positionSizePercent &&
        stopLossPercent === preset.stopLossPercent &&
        takeProfitPercent === preset.takeProfitPercent &&
        fastSMA === preset.fastSMA &&
        slowSMA === preset.slowSMA
      ) {
        return key as RiskPreset;
      }
    }
    return null;
  }, [positionSizePercent, stopLossPercent, takeProfitPercent, fastSMA, slowSMA]);

  const hasErrors = Object.keys(fieldErrors).length > 0;

  const handleShare = async () => {
    if (!onShareConfig) return;
    const success = await onShareConfig();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="border-border/50 bg-card/50 backdrop-blur lg:col-span-1">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Backtest Configuration</CardTitle>
            <CardDescription>Configure your strategy parameters</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onResetToDefaults && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResetToDefaults}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to defaults</TooltipContent>
              </Tooltip>
            )}
            {onShareConfig && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-8 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-3">
            <TooltipLabel 
              label="Date Range" 
              tooltip="Historical period to test your strategy. Longer periods provide more reliable results but take longer to compute."
              className="text-sm font-medium"
            />
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "justify-start text-left font-normal",
                      fieldErrors.dateRange && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && onStartDateChange(date)}
                    disabled={(date) => date > endDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "justify-start text-left font-normal",
                      fieldErrors.dateRange && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && onEndDateChange(date)}
                    disabled={(date) => date < startDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <FieldError message={fieldErrors.dateRange} />
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <TooltipLabel 
              label="Timeframe" 
              tooltip="Candlestick interval for analysis. Shorter timeframes (5m, 15m) generate more signals but may include more noise."
              className="text-sm font-medium"
            />
            <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as typeof timeframe)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAME_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assets */}
          <div className="space-y-2">
            <TooltipLabel 
              label="Trading Pairs" 
              tooltip="Cryptocurrency pairs to backtest. Selecting multiple pairs diversifies the test but increases computation time."
              className="text-sm font-medium"
              error={!!fieldErrors.assets}
            />
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ASSETS.map((asset) => (
                <div 
                  key={asset} 
                  className={cn(
                    "flex items-center justify-between rounded-lg border bg-secondary/20 px-3 py-2",
                    fieldErrors.assets ? "border-destructive/50" : "border-border/50"
                  )}
                >
                  <span className="text-sm font-medium">{ASSET_INFO[asset].symbol}</span>
                  <Switch
                    checked={enabledAssets.includes(asset)}
                    onCheckedChange={() => onToggleAsset(asset)}
                  />
                </div>
              ))}
            </div>
            <FieldError message={fieldErrors.assets} />
          </div>

        <Separator />

          {/* SMA Settings */}
          <div className="space-y-3">
            <TooltipLabel 
              label="SMA Indicators" 
              tooltip="Simple Moving Averages used for crossover signals. Buy when Fast crosses above Slow, sell when Fast crosses below."
              className="text-sm font-medium"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <TooltipLabel 
                  label="Fast SMA" 
                  tooltip="Short-term moving average (5-100 periods). Lower values react faster to price changes. Recommended: 10-30."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.fastSMA}
                />
                <Input
                  type="number"
                  value={fastSMA}
                  onChange={(e) => onFastSMAChange(parseInt(e.target.value) || 20)}
                  min={5}
                  max={100}
                  className={cn(fieldErrors.fastSMA && "border-destructive")}
                />
                <FieldError message={fieldErrors.fastSMA} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Slow SMA" 
                  tooltip="Long-term moving average (10-200 periods). Higher values filter out noise. Recommended: 40-100."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.slowSMA}
                />
                <Input
                  type="number"
                  value={slowSMA}
                  onChange={(e) => onSlowSMAChange(parseInt(e.target.value) || 50)}
                  min={10}
                  max={200}
                  className={cn(fieldErrors.slowSMA && "border-destructive")}
                />
                <FieldError message={fieldErrors.slowSMA} />
              </div>
            </div>
          </div>

          {/* Risk Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TooltipLabel 
                label="Risk Management" 
                tooltip="Control your exposure and protect capital. Conservative settings reduce risk but may limit potential returns."
                className="text-sm font-medium"
              />
              {onApplyPreset && (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    activePreset === 'conservative' && "bg-blue-500/20 text-blue-400",
                    activePreset === 'moderate' && "bg-yellow-500/20 text-yellow-400",
                    activePreset === 'aggressive' && "bg-red-500/20 text-red-400",
                    !activePreset && "bg-muted text-muted-foreground"
                  )}>
                    {activePreset ? RISK_PRESETS[activePreset].label : 'Custom'}
                  </span>
                  <Select onValueChange={(v) => onApplyPreset(v as RiskPreset)}>
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <SelectValue placeholder="Apply preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RISK_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              key === 'conservative' && "bg-blue-500",
                              key === 'moderate' && "bg-yellow-500",
                              key === 'aggressive' && "bg-red-500"
                            )} />
                            <span>{preset.label}</span>
                            {activePreset === key && <span className="text-muted-foreground">✓</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <TooltipLabel 
                  label="Initial Balance ($)" 
                  tooltip="Starting capital for the backtest. Use realistic amounts matching your planned investment ($100 - $100M)."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.initialBalance}
                />
                <Input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => onInitialBalanceChange(parseInt(e.target.value) || 10000)}
                  min={100}
                  className={cn(fieldErrors.initialBalance && "border-destructive")}
                />
                <FieldError message={fieldErrors.initialBalance} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Position Size (%)" 
                  tooltip="Percentage of balance to risk per trade. Conservative: 1-5%, Moderate: 5-15%, Aggressive: 15%+."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.positionSize}
                />
                <Input
                  type="number"
                  value={positionSizePercent}
                  onChange={(e) => onPositionSizeChange(parseInt(e.target.value) || 5)}
                  min={1}
                  max={100}
                  className={cn(fieldErrors.positionSize && "border-destructive")}
                />
                <FieldError message={fieldErrors.positionSize} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Stop Loss (%)" 
                  tooltip="Maximum loss before auto-closing a trade (0.1-50%). Tighter stops reduce losses but may exit good trades early."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.stopLoss}
                />
                <Input
                  type="number"
                  value={stopLossPercent}
                  onChange={(e) => onStopLossChange(parseFloat(e.target.value) || 2)}
                  min={0.1}
                  max={50}
                  step={0.1}
                  className={cn(fieldErrors.stopLoss && "border-destructive")}
                />
                <FieldError message={fieldErrors.stopLoss} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Take Profit (%)" 
                  tooltip="Target profit before auto-closing a trade (0.1-100%). Higher targets may miss profits but capture larger moves."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.takeProfit}
                />
                <Input
                  type="number"
                  value={takeProfitPercent}
                  onChange={(e) => onTakeProfitChange(parseFloat(e.target.value) || 4)}
                  min={0.1}
                  max={100}
                  step={0.1}
                  className={cn(fieldErrors.takeProfit && "border-destructive")}
                />
                <FieldError message={fieldErrors.takeProfit} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Trading Fee (%)" 
                  tooltip="Exchange fee per trade (0-5%). Typical exchanges: 0.1% (Binance), 0.5% (Coinbase). Affects profitability significantly."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.fee}
                />
                <Input
                  type="number"
                  value={feePercent}
                  onChange={(e) => onFeeChange(parseFloat(e.target.value) || 0.1)}
                  min={0}
                  max={5}
                  step={0.01}
                  className={cn(fieldErrors.fee && "border-destructive")}
                />
                <FieldError message={fieldErrors.fee} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <Button
              onClick={onRunBacktest}
              disabled={isRunning || hasErrors}
              className="flex-1"
            >
              {isRunning ? (
                <>Running...</>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
            {result && (
              <Button variant="outline" onClick={onReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {result && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onSaveRun}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save for Comparison
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Saved Runs */}
        {savedRuns.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Saved Runs ({savedRuns.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={onClearAllRuns}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={onToggleComparison}
                className="flex-1"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                {showComparison ? 'Hide Comparison' : 'Compare Runs'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportComparison}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Fetching historical data... {progress.toFixed(0)}%
            </p>
          </div>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
