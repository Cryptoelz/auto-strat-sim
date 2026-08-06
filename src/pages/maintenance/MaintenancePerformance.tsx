import { MaintenancePage, StatCard, StatusPill } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPerfMetrics, getHeavyPages, getPerfTrend, getExecutiveSummary } from '@/lib/maintenance';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MaintenancePerformance() {
  const metrics = getPerfMetrics();
  const pages = getHeavyPages();
  const trend = getPerfTrend();
  const s = getExecutiveSummary();

  return (
    <MaintenancePage
      title="Performance Centre"
      subtitle="Continuous measurement of page load times, query speed, memory usage, rendering, large components, slow API calls and the platform performance trend."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Performance Score" value={s.performanceScore} tone="good" />
        <StatCard label="Metrics Over Budget" value={metrics.filter((m) => m.value > m.budget).length} tone="warn" />
        <StatCard label="Heaviest Page" value={`${pages[0].renderMs} ms`} hint={pages[0].page} />
        <StatCard label="14-Day Trend" value={`${trend[trend.length - 1].score - trend[0].score >= 0 ? '+' : ''}${trend[trend.length - 1].score - trend[0].score}`} tone={trend[trend.length - 1].score >= trend[0].score ? 'good' : 'warn'} />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Performance Budgets</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {metrics.map((m) => (
            <div key={m.metric} className="flex items-center justify-between rounded-md border border-border/50 bg-card/30 p-2.5">
              <div>
                <p className="text-xs font-medium">{m.metric}</p>
                <p className="text-[10px] text-muted-foreground">Budget {m.budget}{m.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums">{m.value}{m.unit}</span>
                <StatusPill status={m.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Performance Trend (14 days)</CardTitle></CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--trading-gold))" strokeWidth={2} dot={false} name="Performance score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Heavy Pages & Large Components</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Page</TableHead>
                <TableHead className="text-[10px]">Route</TableHead>
                <TableHead className="text-[10px]">Components</TableHead>
                <TableHead className="text-[10px]">Weight</TableHead>
                <TableHead className="text-[10px]">Render</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.page}>
                  <TableCell className="text-xs font-medium">{p.page}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{p.route}</TableCell>
                  <TableCell className="text-xs tabular-nums">{p.components}</TableCell>
                  <TableCell className="text-xs tabular-nums">{p.weightKb} KB</TableCell>
                  <TableCell className="text-xs tabular-nums">{p.renderMs} ms</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
