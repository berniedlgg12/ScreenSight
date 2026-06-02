'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  LayoutDashboard, 
  Film, 
  BarChart2, 
  Store, 
  Map, 
  Briefcase, 
  Tv,
  Target,
  Gamepad2
} from 'lucide-react';
import { UserMenu } from '@/components/dashboard/UserMenu';
import { FleetProvider } from '@/hooks/use-fleet';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 p-2">
            <div className="relative h-11 w-11 shrink-0 group cursor-pointer overflow-hidden rounded-[14px] bg-background border border-primary/10 shadow-sm">
                <img 
                    src="/logoa.png" 
                    alt="Logo ScreenSight" 
                    className="absolute inset-0 h-full w-full object-cover scale-[1.05] rounded-[inherit] transition-opacity duration-300 group-hover:opacity-0" 
                />
                <img 
                    src="/logob.png" 
                    alt="Logo ScreenSight Hover" 
                    className="absolute inset-0 h-full w-full object-cover scale-[1.05] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" 
                />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-black tracking-tighter uppercase leading-none">ScreenSight</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">AdOps OS</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard">
                <SidebarMenuButton tooltip="Intelligence" isActive={pathname === '/dashboard'}>
                  <LayoutDashboard className="text-primary" />
                  <span className="font-bold uppercase tracking-tight text-xs">Intelligence</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            
            <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operations</div>
             <SidebarMenuItem>
              <Link href="/controles">
                <SidebarMenuButton tooltip="Controles" isActive={pathname === '/controles'}>
                  <Gamepad2 className="text-orange-500" />
                  <span className="font-bold uppercase tracking-tight text-xs">Controles</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inventory</div>
            <SidebarMenuItem>
              <Link href="/screens">
                <SidebarMenuButton tooltip="Displays" isActive={pathname === '/screens'}>
                  <Tv />
                  <span>Displays</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/stores">
                <SidebarMenuButton tooltip="Retail Nodes" isActive={pathname === '/stores'}>
                  <Store />
                  <span>Retail Nodes</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/regions">
                <SidebarMenuButton tooltip="Territories" isActive={pathname === '/regions'}>
                  <Map />
                  <span>Territories</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">AdOps CMS</div>
            <SidebarMenuItem>
              <Link href="/campaigns">
                <SidebarMenuButton tooltip="Delivery Targets" isActive={pathname === '/campaigns'}>
                  <Target className="text-primary" />
                  <span className="font-bold uppercase tracking-tight text-xs">Delivery Targets</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/media">
                <SidebarMenuButton tooltip="Media Assets" isActive={pathname === '/media'}>
                  <Film />
                  <span>Media Assets</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/sponsors">
                <SidebarMenuButton tooltip="Advertisers" isActive={pathname === '/sponsors'}>
                  <Briefcase />
                  <span>Advertisers</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proof of Play</div>
            <SidebarMenuItem>
              <Link href="/analytics">
                <SidebarMenuButton tooltip="Telemetry" isActive={pathname === '/analytics'}>
                  <BarChart2 />
                  <span>Telemetry</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton tooltip="System" isActive={pathname === '/settings'}>
                  <Settings />
                  <span>System</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <FleetProvider>
          {children}
        </FleetProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}