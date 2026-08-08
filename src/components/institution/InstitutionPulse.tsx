import { Link } from 'react-router-dom';
import { institutionPulse, type PulseTone } from '@/lib/institutionLife';
import { ExecCard, ExecCardHeader } from '@/components/executive/ExecUi';
import { Activity } from 'lucide-react';

const TONE_TEXT: Record<PulseTone, string> = {
  excellent: 'text-trading-gold',
  good: 'text-exec-healthy',
  moderate: 'text-exec-watch',
  watch: 'text-exec-critical',
};

/** Presentation order requested by the executive layer. */
const ORDER = ['health', 'growth', 'activity', 'confidence', 'memory', 'governance', 'promotion'];

const LABELS: Record<string, string> = {
  health: 'Institution Health',
  growth: 'Knowledge Growth',
  activity: 'Research Activity',
  confidence: 'Executive Confidence',
  memory: 'Memory Integrity',
  governance: 'Governance Health',
  promotion: 'Promotion Readiness',
};

const trendOf = (score: number) => (score >= 78 ? 'up' : score >= 60 ? 'flat' : 'down');

/** Institution Pulse™ — horizontal executive pulse strip. Presentation only. */
export function InstitutionPulse() {
  const pulse = institutionPulse();
  const signals = ORDER
    .map((key) => pulse.signals.find((s) => s.key === key))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <ExecCard as="section" className="border-trading-gold/25">
      <ExecCardHeader
        title="Institution Pulse™"
        icon={Activity}
        hint={`${pulse.headline} · Pulse ${pulse.score}`}
      />
      <div className="exec-pulse-row">
        {signals.map((s) => {
          const trend = trendOf(s.score);
          return (
            <Link key={s.key} to={s.to ?? '/institution'} className="exec-card exec-card-interactive exec-pulse-card group">
              <p className="text-[10px] uppercase leading-tight tracking-[0.16em] text-muted-foreground">
                {LABELS[s.key] ?? s.label}
              </p>
              <p className={`mt-2 flex items-baseline gap-1.5 text-sm font-semibold tracking-tight ${TONE_TEXT[s.tone]}`}>
                {s.state}
                <span
                  aria-hidden="true"
                  className={`text-[10px] ${
                    trend === 'up' ? 'text-exec-healthy' : trend === 'down' ? 'text-exec-critical' : 'text-muted-foreground'
                  }`}
                >
                  {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{s.score}</span>
              </p>
              <div
                className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted/30"
                role="progressbar"
                aria-valuenow={s.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${LABELS[s.key] ?? s.label} score`}
              >
                <div className="h-full rounded-full bg-trading-gold/70" style={{ width: `${s.score}%` }} />
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">{s.why}</p>
            </Link>
          );
        })}
      </div>
    </ExecCard>
  );
}
