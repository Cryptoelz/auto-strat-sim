import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { executiveBriefing } from '@/lib/institutionLife';
import { TODAY_DAY } from '@/lib/intelligenceExplorer';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BriefingRoom() {
  const [day, setDay] = useState(TODAY_DAY);
  const brief = useMemo(() => executiveBriefing(day), [day]);

  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 18;
    doc.setFontSize(16); doc.text('ATLAS OS — Executive Briefing', 14, y); y += 7;
    doc.setFontSize(10); doc.text(`Briefing date: ${brief.date} · Observation / Research / Simulation Only`, 14, y); y += 9;
    brief.sections.forEach((s) => {
      if (y > 265) { doc.addPage(); y = 18; }
      doc.setFontSize(12); doc.text(s.heading, 14, y); y += 6;
      doc.setFontSize(9);
      s.lines.forEach((l) => {
        const wrapped = doc.splitTextToSize(`• ${l}`, 180) as string[];
        wrapped.forEach((w) => { if (y > 280) { doc.addPage(); y = 18; } doc.text(w, 16, y); y += 4.6; });
      });
      y += 4;
    });
    doc.save(`atlas-executive-briefing-${brief.date}.pdf`);
  };

  return (
    <OsPage
      title="Executive Briefing Room™"
      subtitle="A daily institutional presentation: what happened, what changed, what matters, what is at risk and what the institution recommends. Advisory only — human approval required."
      department="Briefing Room™"
      actions={
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setDay((d) => Math.max(1, d - 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <span className="font-mono text-[11px] text-trading-gold">{brief.date}</span>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={day >= TODAY_DAY} onClick={() => setDay((d) => Math.min(TODAY_DAY, d + 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportPdf}><Download className="h-3.5 w-3.5" /> PDF</Button>
        </div>
      }
    >
      <section className="grid gap-4 md:grid-cols-2">
        {brief.sections.map((s) => (
          <Card key={s.heading} className="border-border/50 bg-card/60 p-5">
            <div className="flex items-center gap-2 border-b border-trading-gold/20 pb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-trading-gold" />
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground">{s.heading}</h2>
            </div>
            <ul className="mt-3 space-y-1.5">
              {s.lines.map((l, i) => (
                <li key={i} className="text-[12px] leading-relaxed text-foreground/85">• {l}</li>
              ))}
            </ul>
            {s.links && s.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {s.links.map((l) => (
                  <Link key={l.id} to={`/explorer/${l.id}`}
                    className="rounded border border-border/50 px-1.5 py-0.5 text-[9.5px] text-muted-foreground transition-colors hover:border-trading-gold/40 hover:text-trading-gold">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ))}
      </section>
    </OsPage>
  );
}
