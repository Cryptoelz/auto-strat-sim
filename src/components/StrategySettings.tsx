import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_CONFIG, ASSET_INFO } from '@/config/trading';
import { Asset } from '@/types/trading';

export type Timeframe = '5m' | '15m' | '1h' | '4h';

export const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

const ALL_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'];

export interface StrategyConfig {
  timeframe: Timeframe;
  enabledAssets: Asset[];
  fastSMA: number;
  slowSMA: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  pnlAlertProfit: number | null;
  pnlAlertLoss: number | null;
}

const STORAGE_KEY = 'strategy-config';

function loadConfig(): StrategyConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        timeframe: parsed.timeframe ?? DEFAULT_CONFIG.timeframe,
        enabledAssets: parsed.enabledAssets ?? ALL_ASSETS,
        fastSMA: parsed.fastSMA ?? DEFAULT_CONFIG.indicators.fastSMA,
        slowSMA: parsed.slowSMA ?? DEFAULT_CONFIG.indicators.slowSMA,
        positionSizePercent: parsed.positionSizePercent ?? DEFAULT_CONFIG.risk.positionSizePercent,
        stopLossPercent: parsed.stopLossPercent ?? DEFAULT_CONFIG.risk.stopLossPercent,
        takeProfitPercent: parsed.takeProfitPercent ?? DEFAULT_CONFIG.risk.takeProfitPercent,
        pnlAlertProfit: parsed.pnlAlertProfit ?? null,
        pnlAlertLoss: parsed.pnlAlertLoss ?? null,
      };
    }
  } catch {
    // ignore
  }
  return {
    timeframe: DEFAULT_CONFIG.timeframe as Timeframe,
    enabledAssets: ALL_ASSETS,
    fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
    slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
    positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
    stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
    takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
    pnlAlertProfit: null,
    pnlAlertLoss: null,
  };
}

function saveConfig(config: StrategyConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface StrategySettingsProps {
  onConfigChange: (config: StrategyConfig) => void;
}

export function StrategySettings({ onConfigChange }: StrategySettingsProps) {
  const [config, setConfig] = useState<StrategyConfig>(loadConfig);
  const [timeframeInput, setTimeframeInput] = useState<Timeframe>(config.timeframe);
  const [enabledAssetsInput, setEnabledAssetsInput] = useState<Asset[]>(config.enabledAssets);
  const [fastInput, setFastInput] = useState(config.fastSMA.toString());
  const [slowInput, setSlowInput] = useState(config.slowSMA.toString());
  const [positionSizeInput, setPositionSizeInput] = useState(config.positionSizePercent.toString());
  const [stopLossInput, setStopLossInput] = useState(config.stopLossPercent.toString());
  const [takeProfitInput, setTakeProfitInput] = useState(config.takeProfitPercent.toString());
  const [pnlAlertProfitInput, setPnlAlertProfitInput] = useState(config.pnlAlertProfit?.toString() ?? '');
  const [pnlAlertLossInput, setPnlAlertLossInput] = useState(config.pnlAlertLoss?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onConfigChange(config);
  }, []);

  const toggleAsset = (asset: Asset) => {
    setEnabledAssetsInput((prev) => {
      if (prev.includes(asset)) {
        // Don't allow disabling all assets
        if (prev.length === 1) return prev;
        return prev.filter((a) => a !== asset);
      }
      return [...prev, asset];
    });
  };

  const handleApply = () => {
    const fast = parseInt(fastInput, 10);
    const slow = parseInt(slowInput, 10);
    const positionSize = parseFloat(positionSizeInput);
    const stopLoss = parseFloat(stopLossInput);
    const takeProfit = parseFloat(takeProfitInput);
    const pnlProfit = pnlAlertProfitInput.trim() ? parseFloat(pnlAlertProfitInput) : null;
    const pnlLoss = pnlAlertLossInput.trim() ? parseFloat(pnlAlertLossInput) : null;

    // Validation
    if (isNaN(fast) || isNaN(slow) || isNaN(positionSize) || isNaN(stopLoss) || isNaN(takeProfit)) {
      setError('Please enter valid numbers');
      return;
    }
    if (pnlProfit !== null && isNaN(pnlProfit)) {
      setError('Profit target must be a valid number');
      return;
    }
    if (pnlLoss !== null && isNaN(pnlLoss)) {
      setError('Loss limit must be a valid number');
      return;
    }
    if (fast < 2 || fast > 200) {
      setError('Fast SMA must be between 2 and 200');
      return;
    }
    if (slow < 2 || slow > 200) {
      setError('Slow SMA must be between 2 and 200');
      return;
    }
    if (fast >= slow) {
      setError('Fast SMA must be smaller than Slow SMA');
      return;
    }
    if (positionSize < 1 || positionSize > 100) {
      setError('Position Size must be between 1% and 100%');
      return;
    }
    if (stopLoss < 0.5 || stopLoss > 20) {
      setError('Stop Loss must be between 0.5% and 20%');
      return;
    }
    if (takeProfit < 0.5 || takeProfit > 50) {
      setError('Take Profit must be between 0.5% and 50%');
      return;
    }

    setError(null);
    const newConfig: StrategyConfig = { 
      timeframe: timeframeInput,
      enabledAssets: enabledAssetsInput,
      fastSMA: fast, 
      slowSMA: slow,
      positionSizePercent: positionSize,
      stopLossPercent: stopLoss,
      takeProfitPercent: takeProfit,
      pnlAlertProfit: pnlProfit,
      pnlAlertLoss: pnlLoss,
    };
    setConfig(newConfig);
    saveConfig(newConfig);
    onConfigChange(newConfig);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultConfig: StrategyConfig = {
      timeframe: DEFAULT_CONFIG.timeframe as Timeframe,
      enabledAssets: ALL_ASSETS,
      fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
      slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
      positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
      stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
      takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
      pnlAlertProfit: null,
      pnlAlertLoss: null,
    };
    setTimeframeInput(defaultConfig.timeframe);
    setEnabledAssetsInput(defaultConfig.enabledAssets);
    setFastInput(defaultConfig.fastSMA.toString());
    setSlowInput(defaultConfig.slowSMA.toString());
    setPositionSizeInput(defaultConfig.positionSizePercent.toString());
    setStopLossInput(defaultConfig.stopLossPercent.toString());
    setTakeProfitInput(defaultConfig.takeProfitPercent.toString());
    setPnlAlertProfitInput('');
    setPnlAlertLossInput('');
    setConfig(defaultConfig);
    saveConfig(defaultConfig);
    onConfigChange(defaultConfig);
    setError(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Strategy settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Strategy Settings</h4>
            <p className="text-xs text-muted-foreground">Customize timeframe, indicators & risk</p>
          </div>

          {/* Timeframe Setting */}
          <div className="space-y-1">
            <Label htmlFor="timeframe" className="text-xs">
              Timeframe
            </Label>
            <Select value={timeframeInput} onValueChange={(value) => setTimeframeInput(value as Timeframe)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Asset Toggles */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Trading Pairs</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ASSETS.map((asset) => {
                const info = ASSET_INFO[asset];
                return (
                  <div key={asset} className="flex items-center space-x-2">
                    <Checkbox
                      id={asset}
                      checked={enabledAssetsInput.includes(asset)}
                      onCheckedChange={() => toggleAsset(asset)}
                    />
                    <Label htmlFor={asset} className="text-xs cursor-pointer">
                      {info.symbol}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* SMA Settings */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">SMA Indicators</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="fast-sma" className="text-xs">
                  Fast SMA
                </Label>
                <Input
                  id="fast-sma"
                  type="number"
                  min={2}
                  max={200}
                  value={fastInput}
                  onChange={(e) => setFastInput(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slow-sma" className="text-xs">
                  Slow SMA
                </Label>
                <Input
                  id="slow-sma"
                  type="number"
                  min={2}
                  max={200}
                  value={slowInput}
                  onChange={(e) => setSlowInput(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Risk Settings */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Risk Management</p>
            <div className="space-y-1">
              <Label htmlFor="position-size" className="text-xs">
                Position Size %
              </Label>
              <Input
                id="position-size"
                type="number"
                min={1}
                max={100}
                step={1}
                value={positionSizeInput}
                onChange={(e) => setPositionSizeInput(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="stop-loss" className="text-xs">
                  Stop Loss %
                </Label>
                <Input
                  id="stop-loss"
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={stopLossInput}
                  onChange={(e) => setStopLossInput(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="take-profit" className="text-xs">
                  Take Profit %
                </Label>
                <Input
                  id="take-profit"
                  type="number"
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={takeProfitInput}
                  onChange={(e) => setTakeProfitInput(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* P&L Alerts */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">P&L Alerts (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="pnl-profit" className="text-xs">
                  Profit Target $
                </Label>
                <Input
                  id="pnl-profit"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="e.g. 500"
                  value={pnlAlertProfitInput}
                  onChange={(e) => setPnlAlertProfitInput(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pnl-loss" className="text-xs">
                  Loss Limit $
                </Label>
                <Input
                  id="pnl-loss"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="e.g. 200"
                  value={pnlAlertLossInput}
                  onChange={(e) => setPnlAlertLossInput(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={handleApply}>
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {config.timeframe} • SMA {config.fastSMA}/{config.slowSMA} • Size {config.positionSizePercent}%
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function useStrategyConfig() {
  return loadConfig();
}
