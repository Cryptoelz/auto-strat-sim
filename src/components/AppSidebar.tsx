import {
  LayoutDashboard, LineChart, FlaskConical, Layers, PieChart,
  Shield, UserCog, Bell, Beaker, ClipboardCheck, Activity,
  Radio,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { title: 'Overview', url: '/', icon: LayoutDashboard },
      { title: 'Live Trading', url: '/trading', icon: LineChart },
      { title: 'Paper Trade', url: '/paper-trading', icon: Radio },
      { title: 'Backtest', url: '/backtest', icon: FlaskConical },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { title: 'Strategies', url: '/strategies', icon: Layers },
      { title: 'Portfolio', url: '/portfolio', icon: PieChart },
    ],
  },
  {
    label: 'Controls',
    items: [
      { title: 'Governance', url: '/governance', icon: Shield },
      { title: 'Operator', url: '/operator', icon: UserCog },
      { title: 'Alerts', url: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'Review',
    items: [
      { title: 'Experiments', url: '/experiments', icon: Beaker },
      { title: 'Readiness', url: '/readiness', icon: ClipboardCheck },
      { title: 'System Health', url: '/system-health', icon: Activity },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              CT
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">CryptoTrader</p>
              <p className="text-[10px] text-muted-foreground">Simulation Only</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              CT
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <Badge variant="outline" className="w-full justify-center border-primary/30 bg-primary/5 text-[10px] text-primary">
            SIMULATION ONLY
          </Badge>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
