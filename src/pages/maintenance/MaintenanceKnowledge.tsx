import { MaintenancePage, StatCard, ScoreBar } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getKnowledgeFindings, getExecutiveSummary } from '@/lib/maintenance';

const TYPE_STYLE: Record<string, string> = {
  contradiction: 'border-trading-loss/40 text-trading-loss',
  'missing-evidence': 'border-trading-warning/40 text-trading-warning',
  duplicate: 'border-primary/40 text-primary',
  outdated: 'border-trading-gold/40 text-trading-gold',
};
const TYPE_LABEL: Record<string, string> = {
  contradiction: 'Contradiction',
  'missing-evidence': 'Missing evidence',
  duplicate: 'Duplicate knowledge',
  outdated: 'Outdated documentation',
};

export default function MaintenanceKnowledge() {
  const findings = getKnowledgeFindings();
  const s = getExecutiveSummary();
  const total = findings.reduce((a, f) => a + f.count, 0);

  return (
    <MaintenancePage
      title="Knowledge Validator"
      subtitle="Inspects Oracle knowledge, research history, experiment history, promotion history, cross references, evidence links and AI explanations for contradictions, missing evidence, duplicates and outdated documentation."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Knowledge Score" value={s.knowledgeScore} tone="good" />
        <StatCard label="Sources Validated" value={findings.length} />
        <StatCard label="Open Flags" value={total} tone={total ? 'warn' : 'good'} />
        <StatCard label="Contradictions" value={findings.filter((f) => f.type === 'contradiction').reduce((a, f) => a + f.count, 0)} tone="bad" />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Validation Findings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {findings.map((f) => (
            <div key={f.source} className="rounded-md border border-border/50 bg-card/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{f.source}</span>
                  <Badge variant="outline" className={`text-[9px] ${TYPE_STYLE[f.type]}`}>{TYPE_LABEL[f.type]}</Badge>
                </div>
                <span className={`text-sm font-bold tabular-nums ${f.count ? 'text-trading-warning' : 'text-trading-profit'}`}>{f.count} flagged</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{f.detail}</p>
              <div className="mt-2"><ScoreBar label="Evidence coverage" value={f.coverage} suffix="%" /></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
