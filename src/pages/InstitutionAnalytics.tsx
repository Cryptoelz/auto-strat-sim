import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { analyticsCharts } from '@/lib/institutionOS';
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, ChartFrame } from '@/components/research/ResearchUi';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

export default function InstitutionAnalytics() {
  const charts = useMemo(() => analyticsCharts(), []);

  return (
    <OsPage
      title="Institution Analytics™"
      subtitle="How the institution has grown, learned and changed over time — knowledge growth, confidence trends, department output, risk and evidence quality."
      department="Institution Analytics™"
    >
      <div className="grid gap-5 xl:grid-cols-2">
        {charts.map((c) => (
          <Card key={c.key} className="exec-card rsch-fade border-border/50 bg-card/60 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-trading-gold">{c.label}</h2>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{c.unit}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{c.description}</p>

            <ChartFrame title={c.label} height="mt-5 h-56">
              <ResponsiveContainer width="100%" height="100%">
                {c.kind === 'line' ? (
                  <LineChart data={c.data as { date: string; value: number }[]} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="date" {...CHART_AXIS} minTickGap={28} />
                    <YAxis {...CHART_AXIS} width={34} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Line
                      type="monotone" dataKey="value" stroke="hsl(var(--trading-gold))" strokeWidth={2} dot={false}
                      animationDuration={200}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={c.data as { name: string; value: number }[]} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="name" {...CHART_AXIS} interval={0} angle={-18} textAnchor="end" height={52} />
                    <YAxis {...CHART_AXIS} width={34} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                    <Bar dataKey="value" fill="hsl(var(--trading-gold))" radius={[3, 3, 0, 0]} animationDuration={200} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </ChartFrame>

            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Evidence</span>
              {c.evidence.map((e) => (
                <Link
                  key={e.id}
                  to={`/explorer/${e.id}`}
                  className="rsch-focus rounded border border-border/50 px-1.5 py-0.5 text-[9.5px] text-muted-foreground transition-colors duration-150 hover:border-trading-gold/40 hover:text-trading-gold"
                >
                  {e.label}
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </OsPage>
  );
}
