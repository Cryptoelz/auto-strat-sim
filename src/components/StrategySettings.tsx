import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DEFAULT_CONFIG } from '@/config/trading';

interface StrategyConfig {
  fastSMA: number;
  slowSMA: number;
}

const STORAGE_KEY = 'strategy-config';

function loadConfig(): StrategyConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        fastSMA: parsed.fastSMA ?? DEFAULT_CONFIG.indicators.fastSMA,
        slowSMA: parsed.slowSMA ?? DEFAULT_CONFIG.indicators.slowSMA,
      };
    }
  } catch {
    // ignore
  }
  return {
    fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
    slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
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
  const [fastInput, setFastInput] = useState(config.fastSMA.toString());
  const [slowInput, setSlowInput] = useState(config.slowSMA.toString());
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onConfigChange(config);
  }, []);

  const handleApply = () => {
    const fast = parseInt(fastInput, 10);
    const slow = parseInt(slowInput, 10);

    // Validation
    if (isNaN(fast) || isNaN(slow)) {
      setError('Please enter valid numbers');
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

    setError(null);
    const newConfig = { fastSMA: fast, slowSMA: slow };
    setConfig(newConfig);
    saveConfig(newConfig);
    onConfigChange(newConfig);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultConfig = {
      fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
      slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
    };
    setFastInput(defaultConfig.fastSMA.toString());
    setSlowInput(defaultConfig.slowSMA.toString());
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
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Strategy Settings</h4>
            <p className="text-xs text-muted-foreground">Customize SMA periods</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fast-sma" className="text-xs">
                Fast SMA Period
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

            <div className="space-y-1.5">
              <Label htmlFor="slow-sma" className="text-xs">
                Slow SMA Period
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
            Current: SMA {config.fastSMA} / {config.slowSMA}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function useStrategyConfig() {
  return loadConfig();
}
