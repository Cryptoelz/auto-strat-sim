import { OrchestrationDashboard } from '@/components/trading/OrchestrationDashboard';

export default function SystemHealth() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">System Health</h1>
        <p className="text-xs text-muted-foreground">Monitor orchestration lifecycle, module health, and system state.</p>
      </div>
      <OrchestrationDashboard />
    </div>
  );
}
