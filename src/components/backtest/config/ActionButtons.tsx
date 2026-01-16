import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Play, 
  RotateCcw, 
  Save, 
  GitCompare, 
  Download, 
  Trash2 
} from 'lucide-react';
import { BacktestResult, SavedRun } from '@/types/backtest';

interface ActionButtonsProps {
  isRunning: boolean;
  progress: number;
  result: BacktestResult | null;
  hasErrors: boolean;
  onRunBacktest: () => void;
  onReset: () => void;
  onSaveRun: () => void;
  onExportCSV: () => void;
  savedRuns: SavedRun[];
  showComparison: boolean;
  onToggleComparison: () => void;
  onClearAllRuns: () => void;
  onExportComparison: () => void;
}

export function ActionButtons({
  isRunning,
  progress,
  result,
  hasErrors,
  onRunBacktest,
  onReset,
  onSaveRun,
  onExportCSV,
  savedRuns,
  showComparison,
  onToggleComparison,
  onClearAllRuns,
  onExportComparison,
}: ActionButtonsProps) {
  return (
    <div className="space-y-3 pt-2">
      <Separator />
      
      {/* Progress indicator */}
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Running backtest...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onRunBacktest}
          disabled={isRunning || hasErrors}
          className="flex-1"
        >
          <Play className="mr-2 h-4 w-4" />
          {isRunning ? 'Running...' : 'Run Backtest'}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onReset}
              disabled={isRunning}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset form</TooltipContent>
        </Tooltip>
      </div>

      {/* Result Actions */}
      {result && (
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveRun}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Run
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save this result for comparison</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export trades to CSV</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Comparison Controls */}
      {savedRuns.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant={showComparison ? "default" : "outline"}
            size="sm"
            onClick={onToggleComparison}
            className="flex-1"
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Compare ({savedRuns.length})
          </Button>
          {showComparison && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportComparison}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export comparison</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearAllRuns}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear all saved runs</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      )}
    </div>
  );
}
