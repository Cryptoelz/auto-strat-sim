import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Network, ChevronRight, ExternalLink, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SPECIALISTS, SpecialistKey } from '@/lib/directorModel';
import { cn } from '@/lib/utils';

interface NodeLink { label: string; page: string; path: string; }

interface SpecialistTree {
  key: SpecialistKey;
  discovery: NodeLink;
  validation: NodeLink;
  championship: NodeLink;
  allocation: NodeLink;
  promotion: { status: string; tone: 'good' | 'warn' | 'lock'; path: string; note: string };
  architecture: NodeLink;
  notes: string;
}

const TREE: Record<SpecialistKey, SpecialistTree> = {
  tr: {
    key: 'tr',
    discovery: { label: 'Discovery', page: 'Strategy Framework — original trend module', path: '/strategies' },
    validation: { label: 'Validation', page: 'Baseline Validation', path: '/baseline-validation' },
    championship: { label: 'Championship', page: 'Specialist Championship — Gold Belt, 1742 Elo', path: '/specialist-championship' },
    allocation: { label: 'Allocation Lab', page: 'Allocation Lab v2 — largest sleeve, 40%', path: '/allocation-lab-v2' },
    promotion: { status: 'Research — promotion locked', tone: 'lock', path: '/promotion-board', note: 'Champion trial day 23 of 60' },
    architecture: { label: 'Architecture', page: 'Layer 2 — Specialist Selection (Ready)', path: '/portfolio-architecture-review' },
    notes: 'Only roster member with positive expectancy in both directional regimes. Drawdown clusters occur inside chop and are offset by the Mean Reversion sleeve. 47 days holding the belt with 6 defences.',
  },
  ms: {
    key: 'ms',
    discovery: { label: 'Discovery', page: 'Trade Frequency Audit — sub-threshold move gap', path: '/trade-frequency' },
    validation: { label: 'Validation', page: 'Momentum Scalper v2 — Validation & Activation Audit', path: '/momentum-scalper-v2' },
    championship: { label: 'Championship', page: 'Specialist Championship — Silver Belt, 1688 Elo', path: '/specialist-championship' },
    allocation: { label: 'Allocation Lab', page: 'Allocation Lab v2 — High-Vol sleeve, 25%', path: '/allocation-lab-v2' },
    promotion: { status: 'Specialist Approved — research only', tone: 'warn', path: '/specialist-approval-board', note: 'Forward Validation warning: PF drift 1.82 → 1.52' },
    architecture: { label: 'Architecture', page: 'Layer 1 — Regime Detection dependency', path: '/portfolio-architecture-review' },
    notes: 'v1 was archived after the Robustness Audit found a -$884 chop loss. The v2 activation gate (Precision 81.6%, Accuracy 84.4%) removed the bleed and lifted 90-day PF from 1.21 to 1.56.',
  },
  vcb: {
    key: 'vcb',
    discovery: { label: 'Discovery', page: 'Market Move Capture — transition-boundary gap', path: '/move-capture' },
    validation: { label: 'Validation', page: 'VCB v1 — full validation suite', path: '/vcb-v1' },
    championship: { label: 'Championship', page: 'Specialist Championship — Bronze Belt, 1671 Elo', path: '/specialist-championship' },
    allocation: { label: 'Allocation Lab', page: 'Allocation Lab v1 — High-Vol co-sleeve, 20%', path: '/allocation-lab' },
    promotion: { status: 'Specialist Approved — research only', tone: 'good', path: '/specialist-approval-board', note: 'Clears PF 1.64 and DD 3.9% gates' },
    architecture: { label: 'Architecture', page: 'Layer 3 — Allocation (Ready)', path: '/portfolio-architecture-review' },
    notes: 'Profitable in all five regimes. 49.8% of PnL concentrates in High Volatility, overlapping Momentum Scalper v2 at 58% — the allocation cap exists to prevent double-counting that regime.',
  },
  mr: {
    key: 'mr',
    discovery: { label: 'Discovery', page: 'Strategy Framework — RSI reversion module', path: '/strategies' },
    validation: { label: 'Validation', page: 'Research — Mean Reversion validation', path: '/research' },
    championship: { label: 'Championship', page: 'Specialist Championship — Sideways / Low-Vol champion', path: '/specialist-championship' },
    allocation: { label: 'Allocation Lab', page: 'Allocation Lab v1 — coverage sleeve, 15%', path: '/allocation-lab' },
    promotion: { status: 'Specialist Approved — research only', tone: 'warn', path: '/specialist-approval-board', note: 'Forward Validation warning: metric drift' },
    architecture: { label: 'Architecture', page: 'Layer 5 — Risk (Mature)', path: '/portfolio-architecture-review' },
    notes: 'Held as coverage insurance rather than a return driver. Contributes ~9% of net PnL but a disproportionate reduction in drawdown variance by offsetting Trend Rider chop losses.',
  },
  lvc: {
    key: 'lvc',
    discovery: { label: 'Discovery', page: 'Discovery Lab v2 — Low-Vol coverage gap (41%)', path: '/specialist-discovery-v2' },
    validation: { label: 'Validation', page: 'Low-Vol Coiler v2 — validation & capture audit', path: '/low-vol-coiler-v2' },
    championship: { label: 'Championship', page: 'Specialist Championship — unranked, awaiting sample', path: '/specialist-championship' },
    allocation: { label: 'Allocation Lab', page: 'Allocation Lab v2 — staged at 0%', path: '/allocation-lab-v2' },
    promotion: { status: 'Approved — staged, not allocated', tone: 'lock', path: '/specialist-approval-board', note: 'Activates when ATR% falls below 0.35' },
    architecture: { label: 'Architecture', page: 'Layer 1 — Regime Detection (Mature)', path: '/portfolio-architecture-review' },
    notes: 'v1 returned NEEDS TUNING on aggregate capture (60%). v2 widened band-edge tolerance for XRP and SOL, lifting capture to 64% and PF from 1.66 to 1.74.',
  },
};

const PORTFOLIO_LINKS: NodeLink[] = [
  { label: 'Roster', page: 'Specialist Approval Board — roster complete (94)', path: '/specialist-approval-board' },
  { label: 'Architecture', page: 'Portfolio Architecture Review — Mature (89)', path: '/portfolio-architecture-review' },
  { label: 'Allocation', page: 'Specialist Allocation Lab v2 — Confidence Weighted champion', path: '/allocation-lab-v2' },
  { label: 'Forward Trial', page: 'Champion Forward Trial — day 23 of 60', path: '/champion-trial' },
  { label: 'Governance', page: 'Allocation Production Path — stage S2', path: '/allocation-production-path' },
  { label: 'Programme', page: 'Executive Trading Program Status', path: '/executive-program-status' },
];

function NodeRow({ link }: { link: NodeLink }) {
  return (
    <Link to={link.path}
      className="group flex items-start justify-between gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/5">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{link.label}</p>
        <p className="truncate text-xs text-foreground/90">{link.page}</p>
      </div>
      <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}

export default function ResearchDependencyMap() {
  const [open, setOpen] = useState<SpecialistKey | null>('tr');

  return (
    <Card className="animate-fade-in border-trading-gold/25">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4 text-trading-gold" /> Research Dependency Map
            </CardTitle>
            <CardDescription className="text-xs">
              Every specialist traced back to the research that produced it. Click any node to open the underlying page.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> RESEARCH ONLY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Root */}
        <div className="rounded-xl border border-trading-gold/30 bg-gradient-to-br from-card to-trading-gold/5 p-3">
          <p className="text-sm font-bold text-trading-gold">Portfolio — Confidence Weighted Book</p>
          <p className="text-[11px] text-muted-foreground">Five specialists · architecture Mature · observation only</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PORTFOLIO_LINKS.map((l) => <NodeRow key={l.label} link={l} />)}
          </div>
        </div>

        {/* Branches */}
        <div className="space-y-2 pl-3">
          {SPECIALISTS.map((sp) => {
            const t = TREE[sp.key];
            const isOpen = open === sp.key;
            return (
              <div key={sp.key} className="relative border-l border-border pl-4">
                <button
                  onClick={() => setOpen(isOpen ? null : sp.key)}
                  className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2.5 text-left transition-colors hover:border-trading-gold/40"
                >
                  <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: sp.color }} />
                  <span className="text-sm font-semibold">{sp.name}</span>
                  <span className="text-[11px] text-muted-foreground">{sp.regime}</span>
                  <Badge variant="outline" className={cn('ml-auto text-[10px]',
                    t.promotion.tone === 'good' && 'border-trading-profit/40 text-trading-profit',
                    t.promotion.tone === 'warn' && 'border-trading-warning/40 text-trading-warning',
                    t.promotion.tone === 'lock' && 'border-trading-gold/40 text-trading-gold')}>
                    {t.promotion.status}
                  </Badge>
                </button>

                {isOpen && (
                  <div className="mt-2 space-y-2 rounded-lg border border-border/40 bg-background/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <NodeRow link={t.discovery} />
                      <NodeRow link={t.validation} />
                      <NodeRow link={t.championship} />
                      <NodeRow link={t.allocation} />
                      <NodeRow link={t.architecture} />
                      <NodeRow link={{ label: 'Promotion Status', page: t.promotion.note, path: t.promotion.path }} />
                    </div>
                    <div className="rounded-md border border-border/50 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Research notes</p>
                      <p className="mt-1 text-xs leading-relaxed text-foreground/85">{t.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground">
          The dependency map is a navigation and provenance surface. Opening a node changes no strategy, allocation or governance state.
        </p>
      </CardContent>
    </Card>
  );
}
