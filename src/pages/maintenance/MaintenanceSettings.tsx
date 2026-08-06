import { useEffect, useState } from 'react';
import { MaintenancePage } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_MAINTENANCE_SETTINGS, MAINTENANCE_SETTINGS_KEY, MaintenanceSettings } from '@/lib/maintenance';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

function load(): MaintenanceSettings {
  if (typeof window === 'undefined') return DEFAULT_MAINTENANCE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(MAINTENANCE_SETTINGS_KEY);
    return raw ? { ...DEFAULT_MAINTENANCE_SETTINGS, ...JSON.parse(raw) } : DEFAULT_MAINTENANCE_SETTINGS;
  } catch {
    return DEFAULT_MAINTENANCE_SETTINGS;
  }
}

export default function MaintenanceSettingsPage() {
  const [settings, setSettings] = useState<MaintenanceSettings>(load);

  useEffect(() => {
    try { window.localStorage.setItem(MAINTENANCE_SETTINGS_KEY, JSON.stringify(settings)); } catch { /* quota */ }
  }, [settings]);

  const set = <K extends keyof MaintenanceSettings>(k: K, v: MaintenanceSettings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  const toggles: [keyof MaintenanceSettings, string, string][] = [
    ['autoRepairs', 'Automatic repairs', 'Master switch for the Auto Repair Engine.'],
    ['repairNavigation', 'Repair navigation & links', 'Fix broken internal links and dead-end navigation.'],
    ['repairCache', 'Clear stale cache', 'Drop cached payloads past their retention window.'],
    ['repairDatabase', 'Repair indexes & duplicates', 'Rebuild indexes and remove duplicate temporary records.'],
    ['repairSearch', 'Rebuild search indexes', 'Re-index module and route metadata.'],
    ['notifyWarnings', 'Notify on warnings', 'Route warning-level findings to Alerts.'],
    ['notifyCritical', 'Notify on critical issues', 'Escalate critical findings to Operator Controls.'],
    ['dailyReport', 'Daily report', 'Generate the daily maintenance report each cycle.'],
    ['weeklyReport', 'Weekly report', 'Generate the weekly maintenance summary.'],
    ['monthlyReport', 'Monthly executive report', 'Generate the monthly executive pack.'],
  ];

  return (
    <MaintenancePage
      title="Maintenance Settings"
      subtitle="Configure the maintenance schedule, automatic repairs, notification rules, report generation, health thresholds, performance thresholds and repair permissions."
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => { setSettings(DEFAULT_MAINTENANCE_SETTINGS); toast.success('Settings restored to defaults'); }}>
          <RotateCcw className="h-3.5 w-3.5" />Restore defaults
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Maintenance Schedule</CardTitle></CardHeader>
        <CardContent className="max-w-sm space-y-2">
          <Label className="text-[11px]">Cycle frequency</Label>
          <Select value={settings.schedule} onValueChange={(v) => set('schedule', v as MaintenanceSettings['schedule'])}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="every-6h">Every 6 hours</SelectItem>
              <SelectItem value="daily">Daily (04:00 UTC)</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Repair Permissions, Notifications & Reports</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {toggles.map(([key, label, hint]) => (
            <div key={key as string} className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-card/30 p-2.5">
              <div>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[10px] text-muted-foreground">{hint}</p>
              </div>
              <Switch checked={settings[key] as boolean} onCheckedChange={(v) => set(key, v as never)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Health & Performance Thresholds</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {([
            ['healthWarningThreshold', 'Health warning threshold', 60, 95, ''],
            ['healthCriticalThreshold', 'Health critical threshold', 40, 90, ''],
            ['performanceBudgetMs', 'Page load budget', 400, 3000, ' ms'],
            ['memoryBudgetMb', 'Memory budget', 100, 800, ' MB'],
          ] as [keyof MaintenanceSettings, string, number, number, string][]).map(([key, label, min, max, unit]) => (
            <div key={key as string} className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[11px]">{label}</Label>
                <span className="text-xs font-semibold tabular-nums">{settings[key] as number}{unit}</span>
              </div>
              <Slider min={min} max={max} step={1} value={[settings[key] as number]} onValueChange={([v]) => set(key, v as never)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
