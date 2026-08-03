import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gavel, Crown, Lock, ShieldCheck } from 'lucide-react';
import { EXECUTIVE_VERDICT as V } from '@/lib/allocationLabValidation';

type Row = { label: string; value: string; detail?: string; tone?: string };

const ROWS: Row[] = [
  { label: 'Current Champion', value: V.currentChampion, detail: V.championDetail },
  { label: 'Can Specialists Beat Router?', value: V.canBeatRouter, detail: V.canBeatRouterDetail, tone: 'text-trading-profit' },
  { label: 'Best Specialist Portfolio', value: V.bestPortfolio, detail: V.bestPortfolioDetail },
  { label: 'Expected PF', value: V.expectedPf, detail: V.expectedPfRange, tone: 'text-trading-profit' },
  { label: 'Expected Drawdown', value: V.expectedDrawdown, detail: V.expectedDrawdownRange, tone: 'text-trading-warning' },
  { label: 'Expected Capture', value: V.expectedCapture, detail: V.expectedCaptureRange },
];

export default function ExecutiveVerdictPanel() {
  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <Gavel className="h-4 w-4" /> Executive Verdict
          </CardTitle>
          <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Validated · Advisory Only
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Board-level summary derived from the 90-day simulation and the 9-suite validation run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROWS.map((r) => (
            <div key={r.label} className="rounded-md border bg-card p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.label}</div>
              <div className={`text-sm font-semibold mt-0.5 ${r.tone ?? 'text-foreground'}`}>{r.value}</div>
              {r.detail && <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.detail}</div>}
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-card p-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium">{V.confidence}% · {V.confidenceLabel}</span>
            </div>
            <Progress value={V.confidence} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{V.confidenceBasis}</p>
          </div>
          <div className="rounded-md border bg-card p-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Evidence Score</span>
              <span className="font-medium">{V.evidenceScore}/100</span>
            </div>
            <Progress value={V.evidenceScore} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Weighted across all validation checks (PASS 1.0, WARNING 0.5, FAIL / NOT TESTED 0).
            </p>
          </div>
        </div>

        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <div className="text-xs font-semibold flex items-center gap-2 text-primary">
            <Crown className="h-3.5 w-3.5" /> Recommendation: {V.recommendation}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{V.recommendationDetail}</p>
        </div>

        <div className="rounded-md border border-trading-warning/30 bg-trading-warning/5 p-3">
          <div className="text-xs font-semibold flex items-center gap-2 text-trading-warning">
            <Lock className="h-3.5 w-3.5" /> Human Approval Required: {V.humanApprovalRequired ? 'Yes' : 'No'}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            Approval chain: {V.approvalChain}. Observation Only · Research Only · Simulation Only · Read Only ·
            Promotion Disabled. No writes to any production engine.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
