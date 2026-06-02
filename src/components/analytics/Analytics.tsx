'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, CheckCircle, Clock, PlayCircle, XCircle, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, Store, PlaybackLog } from '@/lib/types';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { AnalyticsFilters } from './AnalyticsFilters';
import { DateRange } from 'react-day-picker';
import { addDays, format, isAfter, isBefore } from 'date-fns';

const initialDateRange = {
    from: addDays(new Date(), -7),
    to: new Date(),
};

export function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [playbackLogs, setPlaybackLogs] = useState<PlaybackLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    dateRange: initialDateRange as DateRange | undefined,
    brand: 'all',
    campaign: 'all',
    store: 'all',
  });
  
  useEffect(() => {
    setLoading(true);

    // Real-time Stores
    const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    });

    // Real-time Campaigns
    const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    // Real-time Playback Logs (Limited to recent for performance)
    const qLogs = query(collection(db, 'playbackLogs'), orderBy('timestamp', 'desc'), limit(5000));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setPlaybackLogs(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as any)));
      setLoading(false);
    });

    return () => {
      unsubStores();
      unsubCampaigns();
      unsubLogs();
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return playbackLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const dateMatch = filters.dateRange?.from && filters.dateRange?.to 
        ? !isBefore(logDate, filters.dateRange.from) && !isAfter(logDate, filters.dateRange.to)
        : true;
        
      const storeMatch = filters.store === 'all' || log.storeId === filters.store;
      
      const campaign = campaigns.find(c => c.id === log.campaignId);
      const brandMatch = filters.brand === 'all' || campaign?.brandName === filters.brand;
      const campaignMatch = filters.campaign === 'all' || log.campaignId === filters.campaign;

      return dateMatch && storeMatch && brandMatch && campaignMatch;
    });
  }, [playbackLogs, filters, campaigns]);

  const analyticsData = useMemo(() => {
    const startEvents = filteredLogs.filter(l => l.eventType === 'start');
    const completeEvents = filteredLogs.filter(l => l.eventType === 'complete');
    const interruptedEvents = filteredLogs.filter(l => l.eventType === 'interrupted');
    const totalPlaybacks = startEvents.length;
    const completionRate = totalPlaybacks > 0 ? (completeEvents.length / totalPlaybacks) * 100 : 0;
    
    // Watch Time: Complete = 30s (approx), Interrupted = actual progress if available, else 10s
    const totalWatchTimeSeconds = (completeEvents.length * 30) + (interruptedEvents.length * 10);
    const totalWatchTimeHours = Math.floor(totalWatchTimeSeconds / 3600);

    const playbacksByDay: { [key: string]: number } = {};
    startEvents.forEach(log => {
        const day = format(new Date(log.timestamp), 'MMM d');
        playbacksByDay[day] = (playbacksByDay[day] || 0) + 1;
    });
    const playbacksOverTimeData = Object.entries(playbacksByDay)
        .map(([date, count]) => ({ date, playbacks: count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const storeCounts: { [key: string]: number } = {};
    startEvents.forEach(log => {
        const storeName = stores.find(s => s.id === log.storeId)?.name || 'Unknown';
        storeCounts[storeName] = (storeCounts[storeName] || 0) + 1;
    });
    const playbacksByStoreData = Object.entries(storeCounts)
        .map(([name, count]) => ({ name, playbacks: count }))
        .sort((a,b) => b.playbacks - a.playbacks)
        .slice(0, 10);

    const campaignCounts: { [key: string]: number } = {};
    startEvents.forEach(log => {
        const campaignName = campaigns.find(c => c.id === log.campaignId)?.name || 'Unknown';
        campaignCounts[campaignName] = (campaignCounts[campaignName] || 0) + 1;
    });
    const campaignPlaybackData = Object.entries(campaignCounts)
        .map(([name, count]) => ({ name, playbacks: count }))
        .sort((a,b) => b.playbacks - a.playbacks)
        .slice(0, 10);

    return {
        totalPlaybacks,
        completedPlaybacks: completeEvents.length,
        interruptedPlaybacks: interruptedEvents.length,
        completionRate,
        totalWatchTimeHours,
        playbacksOverTimeData,
        playbacksByStoreData,
        campaignPlaybackData,
    };
  }, [filteredLogs, stores, campaigns]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Analyzing real-time playback logs from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Proof of Play</h1>
        <p className="text-muted-foreground hidden md:block">Real-time telemetry from connected Smart TVs.</p>
      </div>
      
      <AnalyticsFilters 
        campaigns={campaigns} 
        stores={stores} 
        filters={filters as any} 
        setFilters={setFilters as any} 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalPlaybacks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completedPlaybacks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analyticsData.completionRate.toFixed(1)}% Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drops</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.interruptedPlaybacks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Airtime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalWatchTimeHours.toLocaleString()} hrs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
            <ChartContainer config={{ playbacks: { label: 'Playbacks', color: 'hsl(var(--primary))' }}} className="h-[250px] w-full">
                <ResponsiveContainer>
                    <LineChart data={analyticsData.playbacksOverTimeData}>
                        <YAxis hide />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Line type="monotone" dataKey="playbacks" stroke="var(--color-playbacks)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Top Campaigns</CardTitle></CardHeader>
            <CardContent>
            <ChartContainer config={{ playbacks: { label: 'Playbacks', color: 'hsl(var(--primary))' }}} className="h-[250px] w-full">
                <ResponsiveContainer>
                <BarChart data={analyticsData.campaignPlaybackData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={100} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="playbacks" fill="var(--color-playbacks)" radius={[0, 4, 4, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
