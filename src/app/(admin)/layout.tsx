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
import { ModeProvider, useMode } from '@/hooks/use-mode';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';

function SidebarContentWithMode() {
  const pathname = usePathname();
  const { mode } = useMode();
  const { t } = useLanguage();

  return (
    <>
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
            <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">AdOps OS</p>
                {mode === 'demo' && (
                    <Badge variant="destructive" className="h-3 px-1 text-[7px] font-black uppercase tracking-tighter animate-pulse">DEMO</Badge>
                )}
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard">
              <SidebarMenuButton tooltip={t('intelligence')} isActive={pathname === '/dashboard'}>
                <LayoutDashboard className="text-primary" />
                <span className="font-bold uppercase tracking-tight text-xs">{t('intelligence')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          
          <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('operations')}</div>
           <SidebarMenuItem>
            <Link href="/controles">
              <SidebarMenuButton tooltip={t('controls')} isActive={pathname === '/controles'}>
                <Gamepad2 className="text-orange-500" />
                <span className="font-bold uppercase tracking-tight text-xs">{t('controls')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('inventory')}</div>
          <SidebarMenuItem>
            <Link href="/screens">
              <SidebarMenuButton tooltip={t('displays')} isActive={pathname === '/screens'}>
                <Tv />
                <span>{t('displays')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/stores">
              <SidebarMenuButton tooltip={t('retailNodes')} isActive={pathname === '/stores'}>
                <Store />
                <span>{t('retailNodes')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/regions">
              <SidebarMenuButton tooltip={t('territories')} isActive={pathname === '/regions'}>
                <Map />
                <span>{t('territories')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('adOpsCms')}</div>
          <SidebarMenuItem>
            <Link href="/campaigns">
              <SidebarMenuButton tooltip={t('deliveryTargets')} isActive={pathname === '/campaigns'}>
                <Target className="text-primary" />
                <span className="font-bold uppercase tracking-tight text-xs">{t('deliveryTargets')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/media">
              <SidebarMenuButton tooltip={t('mediaAssets')} isActive={pathname === '/media'}>
                <Film />
                <span>{t('mediaAssets')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/sponsors">
              <SidebarMenuButton tooltip={t('advertisers')} isActive={pathname === '/sponsors'}>
                <Briefcase />
                <span>{t('advertisers')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('proofOfPlay')}</div>
          <SidebarMenuItem>
            <Link href="/analytics">
              <SidebarMenuButton tooltip={t('telemetry')} isActive={pathname === '/analytics'}>
                <BarChart2 />
                <span>{t('telemetry')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/settings">
              <SidebarMenuButton tooltip={t('system')} isActive={pathname === '/settings'}>
                <Settings />
                <span>{t('system')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarContentWithMode />
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
    </ModeProvider>
  );
}
