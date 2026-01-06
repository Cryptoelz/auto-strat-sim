import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { Badge } from '@/components/ui/badge';

interface KeyboardShortcutsHelpProps {
  enabled: boolean;
  onToggle: () => void;
}

export function KeyboardShortcutsHelp({ enabled, onToggle }: KeyboardShortcutsHelpProps) {
  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant={enabled ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <Keyboard className="h-4 w-4" />
                <span className="sr-only">Keyboard shortcuts</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Keyboard shortcuts {enabled ? '(enabled)' : '(disabled)'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
            <Button
              variant={enabled ? 'default' : 'outline'}
              size="sm"
              className="h-6 text-xs"
              onClick={onToggle}
            >
              {enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          <div className="space-y-2">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{shortcut.description}</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {shortcut.key}
                </Badge>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Click on an asset chart to select it for Buy/Sell shortcuts.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
