import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshCw, RotateCcw, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  lastUpdate: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  onReset: () => void;
}

export function DashboardHeader({
  lastUpdate,
  isLoading,
  onRefresh,
  onReset,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-2xl font-bold">Crypto Trading Simulator</h1>
          <p className="text-sm text-muted-foreground">
            SMA Crossover Strategy • SIMULATION ONLY
          </p>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Updated {format(lastUpdate, 'HH:mm:ss')}</span>
            </div>
          )}

          <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
            PAPER TRADING
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
