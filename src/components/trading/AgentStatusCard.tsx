import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Pause, Play } from 'lucide-react';

interface AgentStatusCardProps {
  isRunning: boolean;
  onToggleRunning: () => void;
  totalTrades: number;
}

export function AgentStatusCard({ isRunning, onToggleRunning, totalTrades }: AgentStatusCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Trading Agent
        </CardTitle>
        <Bot className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              isRunning
                ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                : 'border-trading-neutral/50 bg-trading-neutral/10 text-trading-neutral'
            }
          >
            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${isRunning ? 'bg-trading-profit animate-pulse' : 'bg-muted-foreground'}`} />
            {isRunning ? 'ACTIVE' : 'PAUSED'}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{totalTrades} trades executed</p>
        <button
          onClick={onToggleRunning}
          className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:mt-3 sm:px-4 sm:py-2 sm:text-sm ${
            isRunning
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isRunning ? 'Pause Agent' : 'Start Agent'}
        </button>
      </CardContent>
    </Card>
  );
}
