'use client';

import { useMemo } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { KPICards } from './KPICards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { isDeviceOnline, getDeviceConnectionState } from '@/lib/utils';

export function Dashboard() {
  const { devices, campaigns, playbackLogs, regions, loading, refreshData } = useFleet();

  const stats = useMemo(() => {
    const online = devices.filter(d => isDeviceOnline(d.lastHeartbeat)).length;
    const activeAds = campaigns.filter(c => c.status === 'active').length;
    
    // Revenue is the sum of all campaign budgets
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    
    // Total impressions are summed from campaign delivery fields
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.deliveredImpressions || 0), 0);
    
    // Overall Pacing
    const totalGoal = campaigns.reduce((sum, c) => sum + (c.targetPlaybacks || 0), 1); // Avoid div by zero
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.deliveredPlaybacks || 0), 0);
    const pacing = (totalDelivered / totalGoal) * 100;

    // Fill rate estimation (Active campaigns vs total capacity slots)
    // Assuming a baseline capacity for demo purposes
    const fillRate = Math.min(100, (activeAds * 15.5)); 

    return {
      totalScreens: devices.length,
      onlineScreens: online,
      activeCampaigns: activeAds,
      networkFillRate: `${fillRate.toFixed(1)}%`,
      pacing: `${pacing.toFixed(1)}%`,
      totalImpressions: totalImpressions || playbackLogs.length * 2,
      estimatedRevenue: totalRevenue,
      uptime: devices.length > 0 ? `${((online / devices.length) * 100).toFixed(1)}%` : '0%'
    };
  }, [devices, campaigns, playbackLogs]);

  const chartData = useMemo(() => {
    const online = devices.filter(d => getDeviceConnectionState(d.lastHeartbeat) === 'online').length;
    const unstable = devices.filter(d => getDeviceConnectionState(d.lastHeartbeat) === 'unstable').length;
    const offline = devices.filter(d => getDeviceConnectionState(d.lastHeartbeat) === 'offline').length;

    return [
      { name: 'Healthy', value: online },
      { name: 'Unstable', value: unstable },
      { name: 'Offline', value: offline }
    ];
  }, [devices]);

  const regionalStats = useMemo(() => {
    return regions.map(r => {
        const regionDevices = devices.filter(d => d.regionId === r.id);
        const occupancy = Math.floor(Math.random() * 20) + 60; // Mock occupancy logic
        return {
            name: r.name,
            count: regionDevices.length,
            occupancy: `${occupancy}%`
        };
    }).sort((a,b) => b.count - a.count);
  }, [regions, devices]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Synchronizing AdOps Intelligence...</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-muted/20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Network Control</h1>
          <p className="text-muted-foreground font-medium">DOOH Campaign Delivery & Inventory Management</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="mr-2 h-4 w-4" /> Sync Fleet
            </Button>
            <Button size="sm" asChild>
                <Link href="/campaigns">New Campaign</Link>
            </Button>
        </div>
      </div>

      <KPICards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Delivery Pacing
            </CardTitle>
            <CardDescription>Campaign fulfillment progress across all active sponsors.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                {campaigns.filter(c => c.status === 'active').slice(0, 5).map(campaign => {
                    const progress = (campaign.deliveredPlaybacks / (campaign.targetPlaybacks || 1)) * 100;
                    return (
                        <div key={campaign.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold">{campaign.brandName} - {campaign.name}</span>
                                <span className="font-mono">{progress.toFixed(1)}% fulfilled</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, progress)}%` }} 
                                />
                            </div>
                        </div>
                    );
                })}
                {campaigns.filter(c => c.status === 'active').length === 0 && (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                        No active campaigns to track delivery.
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Network Health</CardTitle>
            <CardDescription>Live dynamic status distribution.</CardDescription>
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
                     <p className="text-xs text-muted-foreground uppercase font-bold">Uptime</p>
                     <p className="text-lg font-black text-green-500">{stats.uptime}</p>
                 </div>
                 <div>
                     <p className="text-xs text-muted-foreground uppercase font-bold">Fill Rate</p>
                     <p className="text-lg font-black text-primary">{stats.networkFillRate}</p>
                 </div>
                 <div>
                     <p className="text-xs text-muted-foreground uppercase font-bold">Revenue</p>
                     <p className="text-lg font-black text-emerald-500">${stats.estimatedRevenue.toLocaleString()}</p>
                 </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>Inventory occupancy per geographical region.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 text-sm">
                    {regionalStats.length > 0 ? regionalStats.map(reg => (
                        <div key={reg.name} className="flex items-center gap-4">
                            <span className="w-24 font-bold uppercase text-[10px] tracking-tight">{reg.name}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary/60" style={{ width: reg.occupancy }} />
                            </div>
                            <span className="w-16 text-right font-mono font-bold text-primary">{reg.count} TVs</span>
                        </div>
                    )) : (
                        <p className="text-center py-10 text-muted-foreground italic">No regions initialized.</p>
                    )}
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Alert Monitor</CardTitle>
                <CardDescription>System events requiring immediate attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {devices.filter(d => isDeviceOnline(d.lastHeartbeat) && d.connectionStatus === 'error').length > 0 ? (
                        devices.filter(d => isDeviceOnline(d.lastHeartbeat) && d.connectionStatus === 'error').slice(0, 3).map(d => (
                            <div key={d.id} className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold">{d.name}</p>
                                    <p className="text-xs text-muted-foreground">{d.errorMessage || 'Hardware failure reported'}</p>
                                </div>
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href="/screens">Troubleshoot</Link>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center gap-2">
                            <RefreshCw className="h-6 w-6 opacity-20" />
                            <p className="font-bold uppercase text-[10px] tracking-widest opacity-40">All systems nominal.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
