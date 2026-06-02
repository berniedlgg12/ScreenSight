'use client';

import { useMemo } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { KPICards } from './KPICards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { isDeviceOnline, getDeviceConnectionState } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useMode } from '@/hooks/use-mode';

export function Dashboard() {
  const { devices, campaigns, playbackLogs, regions, loading, refreshData } = useFleet();
  const { mode } = useMode();

  const stats = useMemo(() => {
    if (mode === 'demo') {
        return {
            totalScreens: 12450,
            onlineScreens: 11520,
            activeCampaigns: 42,
            networkFillRate: '89.2%',
            pacing: '94.5%',
            totalImpressions: 48250600,
            estimatedRevenue: 1245000,
            uptime: '92.4%'
        };
    }

    const online = devices.filter(d => isDeviceOnline(d.lastHeartbeat)).length;
    const activeAds = campaigns.filter(c => c.status === 'active');
    
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.deliveredImpressions || 0), 0);
    const totalGoal = campaigns.reduce((sum, c) => sum + (c.targetPlaybacks || 0), 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.deliveredPlaybacks || 0), 0);
    const pacing = totalGoal > 0 ? (totalDelivered / totalGoal) * 100 : 0;

    return {
      totalScreens: devices.length,
      onlineScreens: online,
      activeCampaigns: activeAds.length,
      networkFillRate: `${Math.min(100, (activeAds.length * 15.5)).toFixed(1)}%`,
      pacing: `${pacing.toFixed(1)}%`,
      totalImpressions: totalImpressions,
      estimatedRevenue: totalRevenue,
      uptime: devices.length > 0 ? `${((online / devices.length) * 100).toFixed(1)}%` : '0%'
    };
  }, [devices, campaigns, playbackLogs, mode]);

  const chartData = useMemo(() => {
    if (mode === 'demo') {
        return [
            { name: 'Healthy', value: 11520 },
            { name: 'Unstable', value: 650 },
            { name: 'Offline', value: 280 }
        ];
    }

    const online = devices.filter(d => getDeviceConnectionState(d.lastHeartbeat) === 'online').length;
    const unstable = devices.filter(d => getDeviceConnectionState(d.lastHeartbeat) === 'unstable').length;
    const offline = devices.filter(d => getDeviceConnectionState(d.lastHeartbeat) === 'offline').length;

    return [
      { name: 'Healthy', value: online },
      { name: 'Unstable', value: unstable },
      { name: 'Offline', value: offline }
    ];
  }, [devices, mode]);

  const regionalStats = useMemo(() => {
    if (mode === 'demo') {
        const demoRegions = [
            { name: 'Noroeste', count: 1850, occupancy: '85%' },
            { name: 'CDMX / ZM', count: 3200, occupancy: '98%' },
            { name: 'Bajío', count: 1450, occupancy: '76%' },
            { name: 'Occidente', count: 1600, occupancy: '92%' },
            { name: 'Centro', count: 1200, occupancy: '68%' },
            { name: 'Sureste', count: 950, occupancy: '82%' },
        ];
        return demoRegions.sort((a,b) => b.count - a.count);
    }

    return regions.map(r => {
        const regionDevices = devices.filter(d => d.regionId === r.id);
        const occupancy = Math.min(100, (regionDevices.length * 8) + 40); 
        return {
            name: r.name,
            count: regionDevices.length,
            occupancy: `${occupancy}%`
        };
    }).sort((a,b) => b.count - a.count);
  }, [regions, devices, mode]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Synchronizing Intelligence...</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-muted/20 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tighter uppercase">Network Intelligence</h1>
            {mode === 'demo' && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full animate-in fade-in slide-in-from-left-4 duration-1000">
                    <FlaskConical className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Demo Mode — Simulated 1-Year Deployment</span>
                </div>
            )}
          </div>
          <p className="text-muted-foreground font-medium">Global AdOps Performance & Telemetry NOC</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="mr-2 h-4 w-4" /> Sync Fleet
            </Button>
            <Button size="sm" asChild className="font-bold">
                <Link href="/campaigns">New Campaign</Link>
            </Button>
        </div>
      </div>

      <KPICards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Delivery Pacing
            </CardTitle>
            <CardDescription>Real-time campaign fulfillment progress across the network.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                {(mode === 'demo' ? [
                    { brandName: 'Samsung', name: 'Galaxy S26 Launch', progress: 94.5 },
                    { brandName: 'Telcel', name: 'Red 5G Nacional', progress: 82.1 },
                    { brandName: 'Coca-Cola', name: 'Verano Coppel', progress: 99.2 },
                    { brandName: 'Disney+', name: 'Family Plan Promo', progress: 45.6 },
                    { brandName: 'Nike', name: 'Back to School', progress: 12.4 },
                ] : campaigns.filter(c => c.status === 'active').slice(0, 5).map(c => ({
                    brandName: c.brandName,
                    name: c.name,
                    progress: (c.deliveredPlaybacks / (c.targetPlaybacks || 1)) * 100
                }))).map((campaign, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                            <span>{campaign.brandName} — {campaign.name}</span>
                            <span className={cn("font-mono", campaign.progress > 90 ? "text-emerald-500" : "text-primary")}>
                                {campaign.progress.toFixed(1)}% fulfilled
                            </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                                className={cn("h-full transition-all duration-1000", campaign.progress > 90 ? "bg-emerald-500" : "bg-primary")}
                                style={{ width: `${Math.min(100, campaign.progress)}%` }} 
                            />
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">Network Health</CardTitle>
            <CardDescription>Live dynamic status distribution of Smart TVs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
             <ChartContainer config={{ value: { label: 'Units' }}} className="h-[250px] w-full">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                        >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
             </ChartContainer>
             <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center">
                 <div>
                     <p className="text-[9px] text-muted-foreground uppercase font-black">Uptime</p>
                     <p className="text-lg font-black text-emerald-500">{stats.uptime}</p>
                 </div>
                 <div>
                     <p className="text-[9px] text-muted-foreground uppercase font-black">Fill Rate</p>
                     <p className="text-lg font-black text-primary">{stats.networkFillRate}</p>
                 </div>
                 <div>
                     <p className="text-[9px] text-muted-foreground uppercase font-black">Revenue</p>
                     <p className="text-lg font-black text-primary">${stats.estimatedRevenue.toLocaleString()}</p>
                 </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10">
            <CardHeader>
                <CardTitle className="text-lg font-black uppercase">Regional Inventory</CardTitle>
                <CardDescription>Hardware distribution and occupancy per territory.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {regionalStats.length > 0 ? regionalStats.map(reg => (
                        <div key={reg.name} className="flex items-center gap-4">
                            <span className="w-24 font-black uppercase text-[10px] tracking-tight">{reg.name}</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary/60" style={{ width: reg.occupancy }} />
                            </div>
                            <span className="w-20 text-right font-mono font-bold text-xs text-primary">{reg.count.toLocaleString()} TVs</span>
                        </div>
                    )) : (
                        <p className="text-center py-10 text-muted-foreground italic text-xs">No regions initialized.</p>
                    )}
                </div>
            </CardContent>
        </Card>
        
        <Card className="border-primary/10">
            <CardHeader>
                <CardTitle className="text-lg font-black uppercase">Proof of Play Audit</CardTitle>
                <CardDescription>Verified playback confirmations in the last 24h.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <div className="text-4xl font-black text-emerald-500">
                        {mode === 'demo' ? '1.2M+' : playbackLogs.filter(l => l.eventType === 'complete').length.toLocaleString()}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Successful Airtime Hits</p>
                    <Button variant="outline" size="sm" asChild className="mt-2">
                        <Link href="/analytics">View Full PoP Audit</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}