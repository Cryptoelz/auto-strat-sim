import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { analyticsCharts } from '@/lib/institutionOS';
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
          <Card key={c.key} className="border-border/50 bg-card/60 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-trading-gold">{c.label}</h2>
              <span className="text-[10px] text-muted-foreground">{c.unit}</span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{c.description}</p>

            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                {c.kind === 'line' ? (
                  <LineChart data={c.data as { date: string; value: number }[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--trading-gold))" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <BarChart data={c.data as { name: string; value: number }[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="value" fill="hsl(var(--trading-gold))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
              <span className="text-[10px] text-muted-foreground">Evidence:</span>
              {c.evidence.map((e) => (
                <Link key={e.id} to={`/explorer/${e.id}`} className="rounded border border-border/50 px-1.5 py-0.5 text-[9.5px] text-muted-foreground hover:border-trading-gold/40 hover:text-trading-gold">
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
