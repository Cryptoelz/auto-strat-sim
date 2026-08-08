import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className 
}: StatCardProps) {
  return (
    <Card className={cn("exec-card h-full !p-0 backdrop-blur", className)}>
      <CardContent className="p-[var(--exec-card-pad)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn(
              "text-xl font-bold leading-none mt-2 tabular-nums",
              trend === 'up' && "text-trading-profit",
              trend === 'down' && "text-trading-loss"
            )}>
              {value}
            </p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            trend === 'up' && "bg-trading-profit/10 text-trading-profit",
            trend === 'down' && "bg-trading-loss/10 text-trading-loss",
            trend === 'neutral' && "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
