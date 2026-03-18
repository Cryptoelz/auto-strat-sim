import { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_CONFIG, ALL_ASSETS, ASSET_INFO } from '@/config/trading';
import { Asset, FilterConfig } from '@/types/trading';

export type Timeframe = '5m' | '15m' | '1h' | '4h';

export const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

const HTF_OPTIONS: { value: string; label: string }[] = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
];

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
  filters: FilterConfig;
}

const STORAGE_KEY = 'strategy-config';

function loadConfig(): StrategyConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        timeframe: parsed.timeframe ?? DEFAULT_CONFIG.timeframe,
        enabledAssets: parsed.enabledAssets ?? DEFAULT_CONFIG.assets,
        fastSMA: parsed.fastSMA ?? DEFAULT_CONFIG.indicators.fastSMA,
        slowSMA: parsed.slowSMA ?? DEFAULT_CONFIG.indicators.slowSMA,
        positionSizePercent: parsed.positionSizePercent ?? DEFAULT_CONFIG.risk.positionSizePercent,
        stopLossPercent: parsed.stopLossPercent ?? DEFAULT_CONFIG.risk.stopLossPercent,
        takeProfitPercent: parsed.takeProfitPercent ?? DEFAULT_CONFIG.risk.takeProfitPercent,
        pnlAlertProfit: parsed.pnlAlertProfit ?? null,
        pnlAlertLoss: parsed.pnlAlertLoss ?? null,
        filters: {
          ...DEFAULT_CONFIG.filters,
          ...(parsed.filters || {}),
        },
      };
    }
  } catch {
    // ignore
  }
  return {
    timeframe: DEFAULT_CONFIG.timeframe as Timeframe,
    enabledAssets: [...DEFAULT_CONFIG.assets],
    fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
    slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
    positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
    stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
    takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
    pnlAlertProfit: null,
    pnlAlertLoss: null,
    filters: { ...DEFAULT_CONFIG.filters },
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
  const [filtersInput, setFiltersInput] = useState<FilterConfig>(config.filters);
  const [showFilters, setShowFilters] = useState(false);
  const [showRiskProtection, setShowRiskProtection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { onConfigChange(config); }, []);

  const toggleAsset = (asset: Asset) => {
    setEnabledAssetsInput((prev) => {
      if (prev.includes(asset)) {
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

    if (isNaN(fast) || isNaN(slow) || isNaN(positionSize) || isNaN(stopLoss) || isNaN(takeProfit)) {
      setError('Please enter valid numbers'); return;
    }
    if (fast < 2 || fast > 200) { setError('Fast SMA must be between 2 and 200'); return; }
    if (slow < 2 || slow > 200) { setError('Slow SMA must be between 2 and 200'); return; }
    if (fast >= slow) { setError('Fast SMA must be smaller than Slow SMA'); return; }
    if (positionSize < 1 || positionSize > 100) { setError('Position Size must be between 1% and 100%'); return; }
    if (stopLoss < 0.5 || stopLoss > 20) { setError('Stop Loss must be between 0.5% and 20%'); return; }
    if (takeProfit < 0.5 || takeProfit > 50) { setError('Take Profit must be between 0.5% and 50%'); return; }

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
      filters: filtersInput,
    };
    setConfig(newConfig);
    saveConfig(newConfig);
    onConfigChange(newConfig);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultConfig: StrategyConfig = {
      timeframe: DEFAULT_CONFIG.timeframe as Timeframe,
      enabledAssets: [...DEFAULT_CONFIG.assets],
      fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
      slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
      positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
      stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
      takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
      pnlAlertProfit: null,
      pnlAlertLoss: null,
      filters: { ...DEFAULT_CONFIG.filters },
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
    setFiltersInput({ ...DEFAULT_CONFIG.filters });
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
      <PopoverContent className="w-80 p-0" align="end">
        <ScrollArea className="h-[560px]">
          <div className="space-y-4 p-4">
            <div>
              <h4 className="font-medium text-sm">Strategy Settings</h4>
              <p className="text-xs text-muted-foreground">Configure execution, indicators, risk & filters</p>
            </div>

            {/* Timeframe */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Execution TF</Label>
                <Select value={timeframeInput} onValueChange={(v) => setTimeframeInput(v as Timeframe)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Higher TF</Label>
                <Select value={filtersInput.higherTimeframe} onValueChange={(v) => setFiltersInput(f => ({ ...f, higherTimeframe: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HTF_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Assets */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Trading Pairs</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ASSETS.map((asset) => {
                  const info = ASSET_INFO[asset];
                  return (
                    <div key={asset} className="flex items-center space-x-2">
                      <Checkbox id={asset} checked={enabledAssetsInput.includes(asset)} onCheckedChange={() => toggleAsset(asset)} />
                      <Label htmlFor={asset} className="text-xs cursor-pointer">{info.symbol}</Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* SMA */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">SMA Indicators</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Fast SMA</Label>
                  <Input type="number" min={2} max={200} value={fastInput} onChange={(e) => setFastInput(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Slow SMA</Label>
                  <Input type="number" min={2} max={200} value={slowInput} onChange={(e) => setSlowInput(e.target.value)} className="h-8" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Risk */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Risk Management</p>
              <div className="space-y-1">
                <Label className="text-xs">Position Size %</Label>
                <Input type="number" min={1} max={100} step={1} value={positionSizeInput} onChange={(e) => setPositionSizeInput(e.target.value)} className="h-8" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Stop Loss %</Label>
                  <Input type="number" min={0.5} max={20} step={0.5} value={stopLossInput} onChange={(e) => setStopLossInput(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Take Profit %</Label>
                  <Input type="number" min={0.5} max={50} step={0.5} value={takeProfitInput} onChange={(e) => setTakeProfitInput(e.target.value)} className="h-8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Fee %</Label>
                  <Input type="number" min={0} max={1} step={0.01} value={filtersInput.slippagePercent.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, slippagePercent: parseFloat(e.target.value) || 0 }))} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Slippage %</Label>
                  <Input type="number" min={0} max={1} step={0.01} value={filtersInput.slippagePercent.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, slippagePercent: parseFloat(e.target.value) || 0 }))} className="h-8" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Signal Filters Section */}
            <div className="space-y-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>Signal Filters</span>
                {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showFilters && (
                <div className="space-y-3 pt-1">
                  {/* Trend Filter */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Trend Filter (HTF)</Label>
                    <Switch
                      checked={filtersInput.trendFilterEnabled}
                      onCheckedChange={(v) => setFiltersInput(f => ({ ...f, trendFilterEnabled: v }))}
                    />
                  </div>

                  {/* Volatility Filter */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Volatility Filter (ATR)</Label>
                    <Switch
                      checked={filtersInput.volatilityFilterEnabled}
                      onCheckedChange={(v) => setFiltersInput(f => ({ ...f, volatilityFilterEnabled: v }))}
                    />
                  </div>
                  {filtersInput.volatilityFilterEnabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">ATR Period</Label>
                        <Input type="number" min={5} max={50} value={filtersInput.atrPeriod.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, atrPeriod: parseInt(e.target.value) || 14 }))} className="h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Min ATR %</Label>
                        <Input type="number" min={0.01} max={5} step={0.1} value={filtersInput.atrThreshold.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, atrThreshold: parseFloat(e.target.value) || 0.5 }))} className="h-8" />
                      </div>
                    </div>
                  )}

                  {/* Market Regime Filter */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Market Regime Filter</Label>
                    <Switch
                      checked={filtersInput.regimeFilterEnabled}
                      onCheckedChange={(v) => setFiltersInput(f => ({ ...f, regimeFilterEnabled: v }))}
                    />
                  </div>

                  {/* SMA Distance Filter */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Trend Strength (SMA Dist.)</Label>
                    <Switch
                      checked={filtersInput.smaDistanceFilterEnabled}
                      onCheckedChange={(v) => setFiltersInput(f => ({ ...f, smaDistanceFilterEnabled: v }))}
                    />
                  </div>
                  {filtersInput.smaDistanceFilterEnabled && (
                    <div className="space-y-1">
                      <Label className="text-xs">Min SMA Distance %</Label>
                      <Input type="number" min={0.01} max={5} step={0.05} value={filtersInput.minSmaDistancePercent.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, minSmaDistancePercent: parseFloat(e.target.value) || 0.1 }))} className="h-8" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Risk Protection Section */}
            <div className="space-y-2">
              <button
                onClick={() => setShowRiskProtection(!showRiskProtection)}
                className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>Risk Protection</span>
                {showRiskProtection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showRiskProtection && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Max Daily Loss %</Label>
                    <Input type="number" min={0} max={50} step={1} value={filtersInput.maxDailyLossPercent.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, maxDailyLossPercent: parseFloat(e.target.value) || 0 }))} className="h-8" />
                    <p className="text-[10px] text-muted-foreground">0 = disabled</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Consecutive Losses</Label>
                    <Input type="number" min={0} max={20} step={1} value={filtersInput.maxConsecutiveLosses.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, maxConsecutiveLosses: parseInt(e.target.value) || 0 }))} className="h-8" />
                    <p className="text-[10px] text-muted-foreground">0 = disabled</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pause Candles After Limit</Label>
                    <Input type="number" min={1} max={100} step={1} value={filtersInput.pauseCandlesAfterLossLimit.toString()} onChange={(e) => setFiltersInput(f => ({ ...f, pauseCandlesAfterLossLimit: parseInt(e.target.value) || 10 }))} className="h-8" />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* P&L Alerts */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">P&L Alerts (optional)</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Profit Target $</Label>
                  <Input type="number" min={0} step={100} placeholder="e.g. 500" value={pnlAlertProfitInput} onChange={(e) => setPnlAlertProfitInput(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Loss Limit $</Label>
                  <Input type="number" min={0} step={100} placeholder="e.g. 200" value={pnlAlertLossInput} onChange={(e) => setPnlAlertLossInput(e.target.value)} className="h-8" />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleApply}>Apply</Button>
              <Button size="sm" variant="outline" onClick={handleReset}>Reset</Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {config.timeframe} • SMA {config.fastSMA}/{config.slowSMA} • Size {config.positionSizePercent}%
              {config.filters.trendFilterEnabled && ' • TF'}
              {config.filters.volatilityFilterEnabled && ' • ATR'}
              {config.filters.regimeFilterEnabled && ' • MR'}
              {config.filters.smaDistanceFilterEnabled && ' • SD'}
            </p>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function useStrategyConfig() {
  return loadConfig();
}
