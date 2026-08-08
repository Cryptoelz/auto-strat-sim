import { institutionScore } from '@/lib/institutionOS';
import { institutionIQ } from '@/lib/institutionIntelligence';
import { pageContext, institutionPulse } from '@/lib/institutionLife';

/**
 * Executive status ribbon — presentation only.
 * Eight institutional readings on one baseline, separated by gold rules.
 */
export function ExecutiveStatusRibbon() {
  const score = institutionScore();
  const iq = institutionIQ();
  const ctx = pageContext();
  const pulse = institutionPulse();
  const confidence = pulse.signals.find((s) => s.key === 'confidence');
  const governance = pulse.signals.find((s) => s.key === 'governance');

  const items: { label: string; value: string; note: string }[] = [
    { label: 'Institution Status', value: pulse.headline.replace('Institution is ', ''), note: 'Live derived state' },
    { label: 'Institution Score', value: `${score.total}`, note: `Grade ${score.grade}` },
    { label: 'Institution IQ', value: `${iq.total}`, note: `${iq.band} · ${iq.grade}` },
    { label: 'Knowledge Objects', value: ctx.objects.toLocaleString(), note: `${ctx.relationships.toLocaleString()} relationships` },
    { label: 'Evidence Links', value: ctx.evidence.toLocaleString(), note: 'Every claim traceable' },
    { label: 'Simulation Cycle', value: `${ctx.velocity}`, note: 'Active research cycles' },
    { label: 'Executive Confidence', value: confidence?.state ?? '—', note: `${confidence?.score ?? 0}% mean confidence` },
    { label: 'Governance State', value: governance?.state ?? '—', note: 'Human approval required' },
  ];

  return (
    <section aria-label="Executive status" className="exec-ribbon exec-rise">
      {items.map((it) => (
        <div key={it.label} className="exec-ribbon-item">
          <p className="exec-ribbon-label">{it.label}</p>
          <p className="exec-ribbon-value">{it.value}</p>
          <p className="exec-ribbon-note">{it.note}</p>
        </div>
      ))}
    </section>
  );
}
