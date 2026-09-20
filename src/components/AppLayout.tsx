import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VolumeControl } from '@/components/VolumeControl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TradingProvider } from '@/contexts/TradingContext';
import { AUDIT_ENABLED } from '@/lib/audit/config';
import { EngineAuditObserver } from '@/components/audit/EngineAuditObserver';
import { CommandPalette, useCommandPalette } from '@/components/CommandPalette';
import { InstitutionalToolbar } from '@/components/InstitutionalToolbar';
import { InstitutionAIGuide } from '@/components/InstitutionAIGuide';
import { useAtlasSettings, useApplyAtlasSettings } from '@/hooks/useAtlasSettings';
import { Search } from 'lucide-react';

export function AppLayout() {
  const { open, setOpen } = useCommandPalette();
  const [settings] = useAtlasSettings();
  useApplyAtlasSettings(settings);

  return (
    <TradingProvider>
      {AUDIT_ENABLED && <EngineAuditObserver />}
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur px-3 shrink-0">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-muted-foreground" aria-label="Toggle navigation sidebar" />
                <span className="hidden text-[11px] font-medium text-foreground sm:inline">{settings.institutionName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(true)}
                  aria-label="Open global search"
                  className="h-7 gap-2 border-border/60 bg-muted/20 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Search the institution</span>
                  <kbd className="hidden rounded border border-border/60 bg-background/60 px-1 font-mono text-[9px] sm:inline">CTRL K</kbd>
                </Button>
                {settings.showGovernanceBadges && (
                  <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-[10px] hidden sm:flex">
                    PAPER TRADING
                  </Badge>
                )}
                <span className="atlas-dev-only flex items-center gap-2">
                  <VolumeControl />
                  <ThemeToggle />
                </span>
              </div>
            </header>
            <span className="atlas-dev-only block">
              <InstitutionalToolbar onOpenSearch={() => setOpen(true)} />
            </span>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
        <CommandPalette open={open} onOpenChange={setOpen} />
        <span className="atlas-dev-only"><InstitutionAIGuide /></span>
      </SidebarProvider>
    </TradingProvider>
  );
}
