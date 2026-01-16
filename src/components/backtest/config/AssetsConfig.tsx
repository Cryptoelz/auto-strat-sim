import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { TooltipLabel, FieldError } from './TooltipLabel';
import { AVAILABLE_ASSETS } from './types';

interface AssetsConfigProps {
  enabledAssets: Asset[];
  onToggleAsset: (asset: Asset) => void;
  error?: string;
}

export function AssetsConfig({
  enabledAssets,
  onToggleAsset,
  error,
}: AssetsConfigProps) {
  return (
    <div className="space-y-3">
      <TooltipLabel 
        label="Trading Pairs" 
        tooltip="Select one or more crypto assets to backtest. Multiple assets test diversification effects."
        className="text-sm font-medium"
        error={!!error}
      />
      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_ASSETS.map((asset) => (
          <div key={asset} className="flex items-center space-x-2">
            <Checkbox
              id={asset}
              checked={enabledAssets.includes(asset)}
              onCheckedChange={() => onToggleAsset(asset)}
            />
            <Label htmlFor={asset} className="text-sm cursor-pointer">
              {ASSET_INFO[asset].name}
            </Label>
          </div>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}
