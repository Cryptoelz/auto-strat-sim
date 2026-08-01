import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KNOWLEDGE, getMetric } from '@/lib/cio';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

const DEFINITIONS: Record<string, { definition: string; specialists: string[] }> = {
  'tr-weight': {
    definition: 'Share of simulated portfolio capital assigned to Trend Rider v1 by the Confidence Weighted allocator.',
    specialists: ['Trend Rider v1', 'Momentum Scalper v2'],
  },
  'promotion-probability': {
    definition: 'Modelled likelihood that the current challenger allocation clears every promotion gate at the end of the forward trial.',
    specialists: ['Confidence Weighted Allocation', 'Dynamic Allocation v1'],
  },
  'portfolio-pf': {
    definition: 'Gross profit divided by gross loss across all specialist trades, weighted by allocation.',
    specialists: ['Trend Rider v1', 'VCB v1', 'Mean Reversion v1', 'Momentum Scalper v2', 'Low-Vol Coiler v2'],
  },
  'max-drawdown': {
    definition: 'Largest peak-to-trough decline of the simulated portfolio equity curve in the observation window.',
    specialists: ['Trend Rider v1', 'Momentum Scalper v2'],
  },
  'stability-score': {
    definition: 'Composite measure of how durably the challenger holds its lead across rolling windows.',
    specialists: ['Confidence Weighted Allocation'],
  },
  'readiness': {
    definition: 'Aggregate measure of coverage, diversity and architecture maturity of the specialist programme.',
    specialists: ['All five approved specialists'],
  },
};

const impactStyle = {
  positive: 'border-trading-profit/40 bg-trading-profit/5',
  negative: 'border-destructive/40 bg-destructive/5',
  neutral: 'border-muted-foreground/30 bg-muted/30',
} as const;

export function MetricExplainDialog({ metricId, onClose }: { metricId: string | null; onClose: () => void }) {
  const metric = metricId ? getMetric(metricId) : null;
  const extra = metricId ? DEFINITIONS[metricId] : undefined;
  const TrendIcon = metric?.trendVerdict === 'improving' ? TrendingUp
    : metric?.trendVerdict === 'declining' ? TrendingDown : Minus;

  return (
    <Dialog open={!!metric} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {metric && (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {metric.label}
                <Badge variant="outline" className="font-mono">{metric.value}</Badge>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <TrendIcon className="h-3.5 w-3.5" /> Trend: {metric.trendVerdict}
              </DialogDescription>
            </DialogHeader>

            {extra && (
              <section className="space-y-1">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Definition</h4>
                <p className="text-sm text-muted-foreground">{extra.definition}</p>
              </section>
            )}

            <section className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Formula</h4>
              <p className="rounded-md border bg-muted/30 p-3 font-mono text-xs">{metric.calculation}</p>
            </section>

            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Why it changed</h4>
              {metric.drivers.map((d, i) => (
                <div key={i} className={`rounded-md border p-2.5 ${impactStyle[d.impact]}`}>
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className="text-xs text-muted-foreground">{d.detail}</div>
                </div>
              ))}
            </section>

            <section className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Historical trend</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.trend}>
                    <XAxis dataKey="period" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Linked reports &amp; research</h4>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {metric.evidence.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {metric.relatedIds.map(id => {
                  const n = KNOWLEDGE.find(k => k.id === id);
                  return n ? (
                    <Link key={id} to={n.route}>
                      <Badge variant="outline" className="gap-1 text-[10px] hover:bg-accent">
                        {n.title} <ArrowUpRight className="h-3 w-3" />
                      </Badge>
                    </Link>
                  ) : null;
                })}
              </div>
            </section>

            {extra && (
              <section className="space-y-1">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Related specialists</h4>
                <div className="flex flex-wrap gap-1.5">
                  {extra.specialists.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
