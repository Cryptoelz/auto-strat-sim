import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Upload,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface CustomPresetPanelProps {
  customPresetSlots: { '4': boolean; '5': boolean; '6': boolean };
  onLoadCustomPreset: (slot: '4' | '5' | '6') => boolean;
  onSaveCustomPreset: (slot: '4' | '5' | '6', name?: string) => void;
  onDeleteCustomPreset: (slot: '4' | '5' | '6') => void;
  onRenameCustomPreset?: (slot: '4' | '5' | '6', newName: string) => void;
  getCustomPresetData: (slot: '4' | '5' | '6') => {
    label: string;
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    fastSMA: number;
    slowSMA: number;
  } | null;
  onExportCustomPresets?: () => boolean;
  onImportCustomPresets?: (json: string, mode?: 'replace' | 'merge') => { success: boolean; message: string };
  onClearAllCustomPresets?: () => void;
  lastPresetSync?: { action: 'import' | 'export'; timestamp: number } | null;
}

const SLOT_LABELS: Record<'4' | '5' | '6', string> = {
  '4': 'Custom 1',
  '5': 'Custom 2',
  '6': 'Custom 3',
};

export function CustomPresetPanel({
  customPresetSlots,
  onLoadCustomPreset,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onRenameCustomPreset,
  getCustomPresetData,
  onExportCustomPresets,
  onImportCustomPresets,
  onClearAllCustomPresets,
  lastPresetSync,
}: CustomPresetPanelProps) {
  const [renamingSlot, setRenamingSlot] = useState<'4' | '5' | '6' | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const hasAnyPreset = customPresetSlots['4'] || customPresetSlots['5'] || customPresetSlots['6'];

  const handleLoad = (slot: '4' | '5' | '6') => {
    if (onLoadCustomPreset(slot)) {
      const preset = getCustomPresetData(slot);
      toast.success(`${preset?.label || SLOT_LABELS[slot]} loaded`);
    } else {
      toast.error(`${SLOT_LABELS[slot]} is empty`, {
        description: 'Save current settings to this slot first',
      });
    }
  };

  const handleSave = (slot: '4' | '5' | '6') => {
    onSaveCustomPreset(slot);
    toast.success(`Saved to ${SLOT_LABELS[slot]}`);
  };

  const handleDelete = (slot: '4' | '5' | '6') => {
    onDeleteCustomPreset(slot);
    toast.success(`${SLOT_LABELS[slot]} deleted`);
  };

  const startRename = (slot: '4' | '5' | '6') => {
    const preset = getCustomPresetData(slot);
    setRenameValue(preset?.label || SLOT_LABELS[slot]);
    setRenamingSlot(slot);
  };

  const confirmRename = () => {
    if (renamingSlot && onRenameCustomPreset && renameValue.trim()) {
      onRenameCustomPreset(renamingSlot, renameValue.trim());
      toast.success('Preset renamed');
    }
    setRenamingSlot(null);
  };

  const handleExport = () => {
    if (onExportCustomPresets?.()) {
      toast.success('Presets exported to clipboard');
    }
  };

  const handleImport = () => {
    const json = prompt('Paste exported preset JSON:');
    if (json && onImportCustomPresets) {
      const result = onImportCustomPresets(json);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Custom Presets</CardTitle>
          <div className="flex items-center gap-1">
            {onExportCustomPresets && hasAnyPreset && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleExport(); }}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export presets</TooltipContent>
              </Tooltip>
            )}
            {onImportCustomPresets && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleImport(); }}>
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import presets</TooltipContent>
              </Tooltip>
            )}
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent className="space-y-2 pt-0">
        {(['4', '5', '6'] as const).map((slot) => {
          const preset = getCustomPresetData(slot);
          const isOccupied = customPresetSlots[slot];

          return (
            <div
              key={slot}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-2 text-sm',
                isOccupied
                  ? 'border-border/50 bg-muted/20'
                  : 'border-dashed border-border/30 bg-transparent'
              )}
            >
              {renamingSlot === slot ? (
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="h-6 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') setRenamingSlot(null);
                    }}
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={confirmRename}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRenamingSlot(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate text-xs">
                    {isOccupied ? (preset?.label || SLOT_LABELS[slot]) : SLOT_LABELS[slot]}
                  </span>
                  {isOccupied && preset && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      {preset.fastSMA}/{preset.slowSMA}
                    </Badge>
                  )}
                  <div className="flex gap-0.5">
                    {isOccupied ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleLoad(slot)}>
                              <Upload className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Load preset</TooltipContent>
                        </Tooltip>
                        {onRenameCustomPreset && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startRename(slot)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rename</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(slot)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete preset</TooltipContent>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSave(slot)}>
                            <Save className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save current settings</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {lastPresetSync && (
          <p className="text-[10px] text-muted-foreground text-right">
            Last {lastPresetSync.action}: {new Date(lastPresetSync.timestamp).toLocaleTimeString()}
          </p>
        )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
