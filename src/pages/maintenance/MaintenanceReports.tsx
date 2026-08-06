import { MaintenancePage, StatCard } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getReports, getExecutiveSummary, renderReportMarkdown } from '@/lib/maintenance';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceReports() {
  const reports = getReports();
  const s = getExecutiveSummary();

  const download = (id: string) => {
    const r = reports.find((x) => x.id === id)!;
    const blob = new Blob([renderReportMarkdown(r, s)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-maintenance-${r.kind.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${r.kind} report exported`);
  };

  return (
    <MaintenancePage
      title="Maintenance Reports"
      subtitle="Automatically generated daily, weekly, monthly executive and quarterly institution health reviews, each with executive summary, issues, repairs, warnings, trends and recommendations."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Reports Generated" value={reports.length} />
        <StatCard label="Issues (30d)" value={reports[2].issuesFound} tone="warn" />
        <StatCard label="Repairs (30d)" value={reports[2].repairsCompleted} tone="good" />
        <StatCard label="Institution Health" value={s.institutionHealth} tone="good" />
      </div>

      {reports.map((r) => (
        <Card key={r.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-trading-gold" />
                {r.kind} Report
                <Badge variant="outline" className="text-[9px]">{r.period}</Badge>
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => download(r.id)}>
                <Download className="h-3.5 w-3.5" />Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[11px] text-muted-foreground">{r.summary}</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <StatCard label="Issues Found" value={r.issuesFound} tone="warn" />
              <StatCard label="Repairs Completed" value={r.repairsCompleted} tone="good" />
              <StatCard label="Warnings" value={r.warnings} tone="warn" />
              <StatCard label="Performance Trend" value={r.trend} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommendations</p>
              <ul className="mt-1 space-y-1">
                {r.recommendations.map((rec) => (
                  <li key={rec} className="text-[11px] text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </MaintenancePage>
  );
}
