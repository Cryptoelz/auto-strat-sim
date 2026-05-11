/**
 * Weekly Review PDF Exporter
 * Renders a WeeklyReview to a downloadable PDF using jsPDF.
 */
import { jsPDF } from 'jspdf';
import { WeeklyReview } from '@/lib/weeklyReview';

export function exportWeeklyReviewPdf(r: WeeklyReview): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  let y = 56;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 56) {
      doc.addPage();
      y = 56;
    }
  };

  const setH1 = () => doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(20, 20, 20);
  const setH2 = () => doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(40, 40, 40);
  const setBody = () => doc.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(60, 60, 60);
  const setMuted = () => doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(120, 120, 120);

  // Title
  setH1();
  doc.text('Weekly Trading Review', marginX, y);
  y += 22;
  setMuted();
  doc.text(`${r.week.label}`, marginX, y);
  y += 12;
  doc.text(`Generated ${new Date(r.generatedAt).toLocaleString()}  ·  Simulation only`, marginX, y);
  y += 22;

  const writeSection = (title: string, lines: string[]) => {
    if (lines.length === 0) return;
    ensureSpace(36);
    setH2();
    doc.text(title, marginX, y);
    y += 16;
    setBody();
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(`• ${line}`, pageWidth - marginX * 2);
      ensureSpace(wrapped.length * 13 + 4);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 13 + 2;
    }
    y += 8;
  };

  // Key metrics box
  ensureSpace(110);
  setH2();
  doc.text('Headline Metrics', marginX, y);
  y += 16;
  setBody();
  const pfText = Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : '∞';
  const metrics = [
    `Sessions: ${r.totalSessions}    Trades: ${r.totalTrades}    Net PnL: $${r.totalPnl.toFixed(2)}`,
    `Win Rate: ${r.winRate.toFixed(1)}%    Profit Factor: ${pfText}    Max DD: ${r.maxDrawdown.toFixed(2)}%`,
    `Longs: ${r.long.trades} trades / $${r.long.pnl.toFixed(2)} (${r.long.winRate.toFixed(0)}% WR)`,
    `Shorts: ${r.short.trades} trades / $${r.short.pnl.toFixed(2)} (${r.short.winRate.toFixed(0)}% WR)`,
  ];
  for (const m of metrics) {
    doc.text(m, marginX, y);
    y += 14;
  }
  y += 10;

  writeSection('Highlights', r.highlights);

  if (r.comparison) {
    const c = r.comparison;
    writeSection('Week-over-Week Comparison', [
      `Previous PnL: $${c.previousPnl.toFixed(2)} → Current: $${r.totalPnl.toFixed(2)} (${c.pnlDelta >= 0 ? '+' : ''}$${c.pnlDelta.toFixed(2)}, ${c.pnlDeltaPct >= 0 ? '+' : ''}${c.pnlDeltaPct.toFixed(0)}%).`,
      `Win rate: ${c.previousWinRate.toFixed(0)}% → ${r.winRate.toFixed(0)}% (${c.winRateDelta >= 0 ? '+' : ''}${c.winRateDelta.toFixed(1)} pp).`,
      `Trades: ${c.previousTrades} → ${r.totalTrades} (${c.tradesDelta >= 0 ? '+' : ''}${c.tradesDelta}).`,
    ]);
  }

  // Regimes
  if (r.regimes.length > 0) {
    writeSection(
      'Regime Performance',
      r.regimes.map(rg => `${rg.label}: ${rg.trades} trades, ${rg.winRate.toFixed(0)}% WR, $${rg.pnl.toFixed(2)} PnL.`),
    );
  }

  // Assets
  if (r.assets.length > 0) {
    writeSection(
      'Per-Asset Performance',
      r.assets.map(a => `${a.asset}: ${a.trades} trades, ${a.winRate.toFixed(0)}% WR, $${a.pnl.toFixed(2)} PnL (PF ${Number.isFinite(a.profitFactor) ? a.profitFactor.toFixed(2) : '∞'}).`),
    );
  }

  if (r.dangerous.length > 0) writeSection('Dangerous Conditions Detected', r.dangerous);

  if (r.drawdownEvents.length > 0) {
    writeSection(
      'Drawdown Events',
      r.drawdownEvents.map(d => `${d.sessionLabel} — ${d.explanation}`),
    );
  }

  writeSection('Operator Recommendations', r.recommendations);

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setMuted();
    doc.text(
      `Page ${i} of ${pageCount}  ·  CryptoTrader AI Weekly Review`,
      pageWidth / 2,
      pageHeight - 28,
      { align: 'center' },
    );
  }

  doc.save(`weekly-review-${r.week.id}.pdf`);
}

export function downloadMarkdown(r: WeeklyReview): void {
  const blob = new Blob([r.emailMarkdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weekly-review-${r.week.id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(r: WeeklyReview): void {
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weekly-review-${r.week.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
