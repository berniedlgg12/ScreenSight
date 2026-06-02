'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, Target, Megaphone, DollarSign, Activity, Percent, BarChart3, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface KPICardsProps {
  stats: {
    totalScreens: number;
    onlineScreens: number;
    activeCampaigns: number;
    networkFillRate: string;
    pacing: string;
    totalImpressions: number;
    estimatedRevenue: number;
    uptime: string;
  };
}

export function KPICards({ stats }: KPICardsProps) {
  const { t } = useLanguage();
  
  const items = [
    { title: t('totalInventory'), value: stats.totalScreens, icon: Tv, color: 'text-primary' },
    { title: t('networkUptime'), value: stats.uptime, icon: Activity, color: 'text-green-500' },
    { title: t('fillRate'), value: stats.networkFillRate, icon: Percent, color: 'text-blue-500' },
    { title: t('activeAds'), value: stats.activeCampaigns, icon: Megaphone, color: 'text-accent' },
    { title: t('impressions'), value: stats.totalImpressions.toLocaleString(), icon: Target, color: 'text-purple-500' },
    { title: t('pacing'), value: stats.pacing, icon: TrendingUp, color: 'text-amber-500' },
    { title: t('revenue'), value: `$${stats.estimatedRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
    { title: t('playbackLogs'), value: (stats.totalImpressions / 2.5).toLocaleString(), icon: BarChart3, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <Card key={i} className="border-l-4 border-l-primary/20 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tighter">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
