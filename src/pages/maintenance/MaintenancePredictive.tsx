import { MaintenancePage, StatCard } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPredictions } from '@/lib/maintenance';
import { TrendingUp, Lightbulb } from 'lucide-react';

const SEV: Record<string, string> = {
  high: 'border-trading-loss/40 text-trading-loss bg-trading-loss/5',
  medium: 'border-trading-warning/40 text-trading-warning bg-trading-warning/5',
  low: 'border-trading-profit/40 text-trading-profit bg-trading-profit/5',
};

export default function MaintenancePredictive() {
  const predictions = getPredictions().sort((a, b) => b.confidence - a.confidence);

  return (
    <MaintenancePage
      title="Predictive Maintenance"
      subtitle="Forward-looking analysis of technical debt, growth and degradation trends, with preventive recommendations before issues reach the operator."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Predictions" value={predictions.length} />
        <StatCard label="High Severity" value={predictions.filter((p) => p.severity === 'high').length} tone="bad" />
        <StatCard label="Medium" value={predictions.filter((p) => p.severity === 'medium').length} tone="warn" />
        <StatCard label="Nearest Horizon" value={`${Math.min(...predictions.map((p) => p.horizonDays))} d`} />
      </div>

      {predictions.map((p) => (
        <Card key={p.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle className="flex items-start gap-2 text-sm">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-trading-gold" />
                {p.headline}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px]">{p.area}</Badge>
                <Badge variant="outline" className={`text-[9px] ${SEV[p.severity]}`}>{p.severity.toUpperCase()}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
              <span>Horizon: <span className="font-semibold text-foreground">{p.horizonDays} days</span></span>
              <span>Confidence: <span className="font-semibold text-foreground">{p.confidence}%</span></span>
            </div>
            <div className="flex items-start gap-2 rounded-md border border-border/50 bg-card/30 p-2.5">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trading-gold" />
              <p className="text-[11px] text-muted-foreground">{p.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </MaintenancePage>
  );
}
