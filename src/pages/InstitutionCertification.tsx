import { useMemo } from 'react';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Download } from 'lucide-react';
import { certification, PLATFORM_GUARANTEES } from '@/lib/platform';

export default function InstitutionCertification() {
  const cert = useMemo(() => certification(), []);

  const exportCert = () => {
    const lines = [
      `ATLAS OS — Institution Certification`,
      `Reference: ${cert.reference}`,
      `Issued: ${cert.issued}`,
      `Level: ${cert.level} · Grade ${cert.grade} · Overall ${cert.overall}`,
      '',
      ...cert.dims.map((d) => `${d.label}: ${d.score} — ${d.note}`),
      '',
      cert.statement,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OsPage
      title="Institution Certification™"
      subtitle="A simulated readiness assessment across nine institutional dimensions, issued as a premium certificate for executive review."
      department="Governance"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportCert}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export certificate
        </Button>
      }
    >
      <section className="relative overflow-hidden rounded-xl border border-trading-gold/40 bg-gradient-to-br from-trading-gold/[0.10] via-card/60 to-background p-8 text-center">
        <div className="pointer-events-none absolute inset-3 rounded-lg border border-trading-gold/20" aria-hidden="true" />
        <Award className="mx-auto h-9 w-9 text-trading-gold" aria-hidden="true" />
        <p className="mt-3 text-[10px] uppercase tracking-[0.34em] text-muted-foreground">Certificate of Institutional Readiness</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">ATLAS OS™</h2>
        <p className="mt-1 text-xs text-muted-foreground">Institutional Research Operating System</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
          <div>
            <p className="font-mono text-4xl text-trading-gold">{cert.overall}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Overall</p>
          </div>
          <div>
            <p className="font-mono text-4xl text-foreground">{cert.grade}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Grade</p>
          </div>
          <div>
            <p className="font-mono text-4xl text-foreground">{cert.iq}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Institution IQ</p>
          </div>
        </div>

        <Badge variant="outline" className="mt-6 border-trading-gold/50 bg-trading-gold/10 text-[11px] tracking-[0.18em] text-trading-gold">
          {cert.level.toUpperCase()}
        </Badge>

        <p className="mx-auto mt-5 max-w-2xl text-[11px] text-muted-foreground">{cert.statement}</p>
        <p className="mt-3 font-mono text-[10px] text-muted-foreground/70">{cert.reference} · Issued {cert.issued}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cert.dims.map((d) => (
          <article key={d.key} className="rounded-lg border border-border/50 bg-card/40 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium text-foreground">{d.label}</h3>
              <span className={`font-mono text-lg ${d.score >= 90 ? 'text-trading-gold' : d.score >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>{d.score}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/40" role="img" aria-label={`${d.label} score ${d.score} of 100`}>
              <div className="h-full rounded-full bg-trading-gold" style={{ width: `${d.score}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{d.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h2 className="text-sm font-semibold text-foreground">Certified operating boundary</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PLATFORM_GUARANTEES.map((g) => (
            <Badge key={g} variant="outline" className="border-border/60 text-[10px] text-muted-foreground">{g}</Badge>
          ))}
        </div>
      </section>
    </OsPage>
  );
}
