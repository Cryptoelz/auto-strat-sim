import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VolumeControl } from '@/components/VolumeControl';
import { Badge } from '@/components/ui/badge';
import { TradingProvider } from '@/contexts/TradingContext';

export function AppLayout() {
  return (
    <TradingProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur px-3 shrink-0">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-[10px] hidden sm:flex">
                  PAPER TRADING
                </Badge>
                <VolumeControl />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TradingProvider>
  );
}
