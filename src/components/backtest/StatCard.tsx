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
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn(
              "text-lg font-bold mt-1",
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
