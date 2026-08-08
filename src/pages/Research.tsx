import { PerformanceResearchDashboard } from '@/components/trading/PerformanceResearchDashboard';
import { ResearchHeader } from '@/components/research/ResearchUi';

export default function Research() {
  return (
    <div className="rsch-page container mx-auto p-4 sm:p-6">
      <ResearchHeader
        eyebrow="Research Layer"
        title="Performance Research"
        subtitle="Evaluate strategy performance, detect failure patterns, and identify evidence-based improvements."
        flow
        activeStep="Analysis"
      />
      <PerformanceResearchDashboard />
    </div>
  );
}
