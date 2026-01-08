import { useState } from 'react';
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
import { Asset } from '@/types/trading';
import { BacktestResult, SavedRun } from '@/types/backtest';
import { ASSET_INFO } from '@/config/trading';
import { format } from 'date-fns';
import { 
  Play, 
  RotateCcw, 
  Calendar as CalendarIcon,
  Save,
  Trash2,
  GitCompare,
  Download,
  Share2,
  Check
} from 'lucide-react';

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
  onInitialBalanceChange: (value: number) => void;
  onPositionSizeChange: (value: number) => void;
  onStopLossChange: (value: number) => void;
  onTakeProfitChange: (value: number) => void;
  
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
  
  // Share
  onShareConfig?: () => Promise<boolean>;
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
  onInitialBalanceChange,
  onPositionSizeChange,
  onStopLossChange,
  onTakeProfitChange,
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
}: BacktestConfigFormProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!onShareConfig) return;
    const success = await onShareConfig();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur lg:col-span-1">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Backtest Configuration</CardTitle>
          <CardDescription>Configure your strategy parameters</CardDescription>
        </div>
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-left font-normal">
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
                <Button variant="outline" size="sm" className="justify-start text-left font-normal">
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
        </div>

        {/* Timeframe */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Timeframe</Label>
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
          <Label className="text-sm font-medium">Trading Pairs</Label>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_ASSETS.map((asset) => (
              <div key={asset} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                <span className="text-sm font-medium">{ASSET_INFO[asset].symbol}</span>
                <Switch
                  checked={enabledAssets.includes(asset)}
                  onCheckedChange={() => onToggleAsset(asset)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* SMA Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">SMA Indicators</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fast SMA</Label>
              <Input
                type="number"
                value={fastSMA}
                onChange={(e) => onFastSMAChange(parseInt(e.target.value) || 20)}
                min={5}
                max={100}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Slow SMA</Label>
              <Input
                type="number"
                value={slowSMA}
                onChange={(e) => onSlowSMAChange(parseInt(e.target.value) || 50)}
                min={10}
                max={200}
              />
            </div>
          </div>
        </div>

        {/* Risk Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Risk Management</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Initial Balance ($)</Label>
              <Input
                type="number"
                value={initialBalance}
                onChange={(e) => onInitialBalanceChange(parseInt(e.target.value) || 10000)}
                min={1000}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Position Size (%)</Label>
              <Input
                type="number"
                value={positionSizePercent}
                onChange={(e) => onPositionSizeChange(parseInt(e.target.value) || 5)}
                min={1}
                max={100}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Stop Loss (%)</Label>
              <Input
                type="number"
                value={stopLossPercent}
                onChange={(e) => onStopLossChange(parseFloat(e.target.value) || 2)}
                min={0.5}
                max={20}
                step={0.5}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Take Profit (%)</Label>
              <Input
                type="number"
                value={takeProfitPercent}
                onChange={(e) => onTakeProfitChange(parseFloat(e.target.value) || 4)}
                min={0.5}
                max={50}
                step={0.5}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <Button
              onClick={onRunBacktest}
              disabled={isRunning || enabledAssets.length === 0}
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
  );
}
