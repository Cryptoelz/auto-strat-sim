import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Trophy, Gavel, Briefcase, BarChart3, Users, BookOpen, ShieldAlert, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';

const REPORT = {
  period: 'May 12 — June 12, 2026',
  monthLabel: 'June 2026',
  generated: 'June 12, 2026',
  systemScore: 87,
  executive: [
    'Baseline v11 was promoted to Champion after meeting the 60-day, 50-trade gate with PF 1.92 and DD 2.1%.',
    'Router v2 overtook Router v1 in the Championship Arena and is the leading promotion candidate for July.',
    'Portfolio Manager v1 went live with a 5-strategy allocation; diversified portfolio outperformed best single strategy by +8.4% on out-of-sample.',
    'Four strategies cleared the Promotion Review Board this month; one (Candidate 24) was retired due to stability decay.',
    'MPC v2 Confidence Recovery replaced v1 as the active Market Participation Controller; sideways drawdown reduced by 34%.',
  ],
  championship: [
    { rank: 1, name: 'Router v2', pnl: 1247, pf: 2.14, dd: 1.8, status: 'Leader' },
    { rank: 2, name: 'Baseline v11', pnl: 1032, pf: 1.92, dd: 2.1, status: 'Champion' },
    { rank: 3, name: 'Trend Rider v1', pnl: 874, pf: 1.83, dd: 2.4, status: 'Approved' },
    { rank: 4, name: 'Router v1', pnl: 712, pf: 1.71, dd: 2.6, status: 'Approved' },
    { rank: 5, name: 'Mean Reversion v1', pnl: 561, pf: 1.62, dd: 2.8, status: 'Approved' },
    { rank: 6, name: 'Candidate 25', pnl: 489, pf: 1.58, dd: 2.9, status: 'Candidate' },
    { rank: 7, name: 'Router v2.1', pnl: 905, pf: 1.62, dd: 3.4, status: 'Research' },
  ],
  promotionBoard: [
    { date: 'Jun 10', strategy: 'Baseline v11', from: 'Approved', to: 'Champion', reason: 'Met Gold Standard: 62d / 58 trades / PF 1.92 / DD 2.1%' },
    { date: 'Jun 04', strategy: 'Mean Reversion v1', from: 'Candidate', to: 'Approved', reason: 'Cleared minimum gate after 32 days, 23 trades, PF 1.62' },
    { date: 'May 28', strategy: 'Trend Rider v1', from: 'Candidate', to: 'Approved', reason: 'PF 1.83, DD 2.4%, regime fit 0.78' },
    { date: 'May 22', strategy: 'Router v1', from: 'Approved', to: 'Approved', reason: 'Re-validated; rank dropped vs. Router v2 but still gate-compliant' },
    { date: 'May 18', strategy: 'Candidate 24', from: 'Approved', to: 'Retired', reason: 'Stability score fell to 0.31 (threshold 0.5) over rolling 50-trade window' },
  ],
  portfolio: {
    startBalance: 10000,
    endBalance: 10832,
    pnl: 832,
    pnlPct: 8.32,
    drawdown: 2.2,
    pf: 1.78,
    sharpe: 1.42,
    vsBestSingle: 8.4,
    vsRouterV1: 12.6,
    vsRouterV2: 3.1,
    allocation: [
      { name: 'Baseline v11', pct: 30, contrib: 312 },
      { name: 'Candidate 25', pct: 20, contrib: 168 },
      { name: 'Trend Rider v1', pct: 20, contrib: 184 },
      { name: 'Mean Reversion v1', pct: 15, contrib: 112 },
      { name: 'Router v1', pct: 10, contrib: 56 },
      { name: 'Cash Reserve', pct: 5, contrib: 0 },
    ],
  },
  rankings: [
    { metric: 'Highest PnL', value: 'Router v2 — $1,247' },
    { metric: 'Highest Profit Factor', value: 'Router v2 — 2.14' },
    { metric: 'Lowest Drawdown', value: 'Router v2 — 1.8%' },
    { metric: 'Most Stable', value: 'Baseline v11 — Stability 0.81' },
    { metric: 'Best Regime Fit', value: 'Trend Rider v1 — 0.78 (trending)' },
    { metric: 'Best Win Rate', value: 'Mean Reversion v1 — 64%' },
  ],
  committeeDecisions: [
    'Jun 12 — Trend Rider +5% (to 20%) on sustained trend strength; Mean Reversion -5% on falling sideways score.',
    'Jun 05 — Cash Reserve raised from 3% to 5% ahead of CPI volatility window.',
    'May 29 — Baseline v11 increased from 25% to 30% after Champion promotion.',
    'May 21 — Candidate 24 fully removed from allocation following retirement decision.',
  ],
  journalHighlights: [
    'Jun 10 — Baseline v11 promoted to Champion (first strategy to achieve this status).',
    'Jun 07 — Router v2 overtook Router v1 in 14-day rolling Championship Arena scoring.',
    'May 30 — MPC v2 Confidence Recovery activated; v1 archived.',
    'May 24 — Portfolio Manager v1 launched with 5 approved strategies.',
    'May 18 — Candidate 24 retired after 9-day stability decay confirmed.',
  ],
  risk: [
    { label: 'Portfolio Max Drawdown', value: '2.2%', status: 'within' },
    { label: 'Worst Session DD', value: '2.8% (May 27)', status: 'within' },
    { label: 'Consecutive Losing Sessions', value: '2 (cap: 3)', status: 'within' },
    { label: 'Capital at Risk (avg)', value: '38% of equity', status: 'within' },
    { label: 'Sideways-Regime Exposure', value: '22% (cap: 35%)', status: 'within' },
    { label: 'Frozen Strategies', value: '5 of 12', status: 'noted' },
  ],
  lessons: [
    'Diversified 5-strategy portfolio beat the best single strategy by +8.4% — confirms allocation thesis.',
    'Strategies that pass the minimum promotion gate but fail the Gold Standard tend to decay within 30 days; raise watch frequency for these.',
    'MPC v2 cut sideways-regime drawdown by 34% — confidence recovery filter is a permanent improvement.',
    'Champion-locked strategies prevent accidental over-optimisation; forking discipline held through 3 attempted edits this month.',
    'Journal entries from operator overrides were the most useful artifacts for post-mortem reviews — keep narrative quality high.',
  ],
};

function downloadPdf() {
  const r = REPORT;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  let y = 56;

  const ensure = (need: number) => { if (y + need > pageHeight - 56) { doc.addPage(); y = 56; } };
  const h1 = () => doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(20, 20, 20);
  const h2 = () => doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(40, 40, 40);
  const body = () => doc.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(60, 60, 60);
  const muted = () => doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(120, 120, 120);

  h1(); doc.text('Monthly Research Report', marginX, y); y += 22;
  muted();
  doc.text(`${r.monthLabel}  ·  ${r.period}`, marginX, y); y += 12;
  doc.text(`Generated ${r.generated}  ·  System Score ${r.systemScore}/100  ·  Simulation only`, marginX, y); y += 22;

  const section = (title: string, lines: string[]) => {
    if (!lines.length) return;
    ensure(30); h2(); doc.text(title, marginX, y); y += 16; body();
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(`• ${line}`, pageWidth - marginX * 2);
      ensure(wrapped.length * 13 + 4);
      doc.text(wrapped, marginX, y); y += wrapped.length * 13 + 2;
    }
    y += 8;
  };

  section('Executive Summary', r.executive);
  section('Championship Results', r.championship.map(c => `#${c.rank} ${c.name} — PnL $${c.pnl}, PF ${c.pf}, DD ${c.dd}% (${c.status})`));
  section('Promotion Board Changes', r.promotionBoard.map(p => `${p.date} — ${p.strategy}: ${p.from} → ${p.to}. ${p.reason}`));
  section('Portfolio Performance', [
    `Net PnL: $${r.portfolio.pnl} (+${r.portfolio.pnlPct}%)  ·  Max DD ${r.portfolio.drawdown}%  ·  PF ${r.portfolio.pf}  ·  Sharpe-like ${r.portfolio.sharpe}`,
    `vs Best Single Strategy: +${r.portfolio.vsBestSingle}%  ·  vs Router v1: +${r.portfolio.vsRouterV1}%  ·  vs Router v2: +${r.portfolio.vsRouterV2}%`,
    ...r.portfolio.allocation.map(a => `${a.name}: ${a.pct}% (contribution $${a.contrib})`),
  ]);
  section('Strategy Rankings', r.rankings.map(r => `${r.metric}: ${r.value}`));
  section('Committee Decisions', r.committeeDecisions);
  section('Journal Highlights', r.journalHighlights);
  section('Risk Metrics', r.risk.map(m => `${m.label}: ${m.value} (${m.status})`));
  section('Key Lessons Learned', r.lessons);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); muted();
    doc.text(`Page ${i} of ${pageCount}  ·  CryptoTrader Monthly Report  ·  ${r.monthLabel}`, pageWidth / 2, pageHeight - 28, { align: 'center' });
  }
  doc.save(`monthly-research-report-${r.monthLabel.replace(' ', '-').toLowerCase()}.pdf`);
}

function SectionCard({ icon: Icon, title, description, children }: { icon: any; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function MonthlyResearchReport() {
  const r = useMemo(() => REPORT, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Research Report</h1>
          <p className="text-muted-foreground mt-1">
            {r.monthLabel} · {r.period}
          </p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline">Generated {r.generated}</Badge>
            <Badge variant="secondary">System Score {r.systemScore}/100</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">Simulation Only</Badge>
          </div>
        </div>
        <Button onClick={downloadPdf} className="gap-2">
          <Download className="h-4 w-4" /> Export PDF
        </Button>
      </div>

      <SectionCard icon={FileText} title="Executive Summary" description="The headline events that defined the month.">
        <ul className="space-y-2 text-sm">
          {r.executive.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={Trophy} title="Championship Results" description="Top strategies by composite score this month.">
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 text-xs uppercase text-muted-foreground font-medium pb-2 border-b">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Strategy</div>
            <div className="col-span-2 text-right">PnL</div>
            <div className="col-span-1 text-right">PF</div>
            <div className="col-span-1 text-right">DD</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {r.championship.map(c => (
            <div key={c.rank} className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-border/40">
              <div className="col-span-1 font-mono text-muted-foreground">{c.rank}</div>
              <div className="col-span-5 font-medium">{c.name}</div>
              <div className="col-span-2 text-right font-mono text-emerald-500">${c.pnl}</div>
              <div className="col-span-1 text-right font-mono">{c.pf}</div>
              <div className="col-span-1 text-right font-mono">{c.dd}%</div>
              <div className="col-span-2 text-right">
                <Badge variant={c.status === 'Champion' ? 'default' : 'outline'} className="text-[10px]">{c.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Gavel} title="Promotion Board Changes" description="Status transitions approved by the Promotion Review Board.">
        <div className="space-y-3">
          {r.promotionBoard.map((p, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-3 py-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground font-mono w-14">{p.date}</span>
                <span className="font-medium">{p.strategy}</span>
                <Badge variant="outline" className="text-[10px]">{p.from}</Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary" className="text-[10px]">{p.to}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{p.reason}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Briefcase} title="Portfolio Performance" description="Diversified allocation across approved strategies.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Net PnL</div>
            <div className="text-lg font-bold text-emerald-500">${r.portfolio.pnl} ({r.portfolio.pnlPct}%)</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Max DD</div>
            <div className="text-lg font-bold">{r.portfolio.drawdown}%</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Profit Factor</div>
            <div className="text-lg font-bold">{r.portfolio.pf}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Sharpe-like</div>
            <div className="text-lg font-bold">{r.portfolio.sharpe}</div>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="text-xs uppercase text-muted-foreground font-medium mb-2">Vs Benchmarks</div>
        <div className="grid grid-cols-3 gap-2 text-sm mb-4">
          <div>Best Single: <span className="text-emerald-500 font-mono">+{r.portfolio.vsBestSingle}%</span></div>
          <div>Router v1: <span className="text-emerald-500 font-mono">+{r.portfolio.vsRouterV1}%</span></div>
          <div>Router v2: <span className="text-emerald-500 font-mono">+{r.portfolio.vsRouterV2}%</span></div>
        </div>
        <div className="text-xs uppercase text-muted-foreground font-medium mb-2">Allocation & Contribution</div>
        <div className="space-y-1">
          {r.portfolio.allocation.map(a => (
            <div key={a.name} className="flex items-center gap-2 text-sm">
              <div className="w-40 truncate">{a.name}</div>
              <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${a.pct * 3.3}%` }} />
              </div>
              <div className="w-12 text-right font-mono">{a.pct}%</div>
              <div className="w-20 text-right font-mono text-muted-foreground">${a.contrib}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={BarChart3} title="Strategy Rankings" description="Leaders across the key evaluation dimensions.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {r.rankings.map((row, i) => (
            <div key={i} className="flex justify-between items-center rounded-md border p-3 text-sm">
              <span className="text-muted-foreground">{row.metric}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Users} title="Committee Decisions" description="Allocation moves with plain-English rationale.">
        <ul className="space-y-2 text-sm">
          {r.committeeDecisions.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={BookOpen} title="Journal Highlights" description="The five entries most worth remembering.">
        <ul className="space-y-2 text-sm">
          {r.journalHighlights.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={ShieldAlert} title="Risk Metrics" description="Guardrail health for the month.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {r.risk.map((m, i) => (
            <div key={i} className="flex justify-between items-center rounded-md border p-3 text-sm">
              <span className="text-muted-foreground">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{m.value}</span>
                <Badge variant={m.status === 'within' ? 'outline' : 'secondary'} className="text-[10px]">
                  {m.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Lightbulb} title="Key Lessons Learned" description="What this month taught the platform.">
        <ul className="space-y-2 text-sm">
          {r.lessons.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
