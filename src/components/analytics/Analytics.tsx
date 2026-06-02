'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, CheckCircle, Clock, PlayCircle, XCircle, Loader2, Download, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, Store, PlaybackLog } from '@/lib/types';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { AnalyticsFilters } from './AnalyticsFilters';
import { DateRange } from 'react-day-picker';
import { addDays, format, isAfter, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMode } from '@/hooks/use-mode';

const initialDateRange = {
    from: addDays(new Date(), -7),
    to: new Date(),
};

export function Analytics() {
  const { mode } = useMode();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [playbackLogs, setPlaybackLogs] = useState<PlaybackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [filters, setFilters] = useState({
    dateRange: initialDateRange as DateRange | undefined,
    brand: 'all',
    campaign: 'all',
    store: 'all',
  });
  
  useEffect(() => {
    setLoading(true);
    const colPrefix = mode === 'demo' ? 'demo_' : '';

    const unsubStores = onSnapshot(collection(db, `${colPrefix}stores`), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    });

    const unsubCampaigns = onSnapshot(collection(db, `${colPrefix}campaigns`), (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    const qLogs = query(collection(db, `${colPrefix}playbackLogs`), orderBy('timestamp', 'desc'), limit(1000));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setPlaybackLogs(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as any;
      }));
      setLoading(false);
    });

    return () => {
      unsubStores();
      unsubCampaigns();
      unsubLogs();
    };
  }, [mode]);

  const analyticsData = useMemo(() => {
    if (mode === 'demo') {
        return {
            totalPlaybacks: 1245000,
            completedPlaybacks: 1182000,
            interruptedPlaybacks: 63000,
            completionRate: 94.9,
            totalWatchTimeHours: 10450,
            playbacksOverTimeData: Array.from({ length: 7 }).map((_, i) => ({
                date: format(addDays(new Date(), -i), 'MMM d'),
                playbacks: Math.floor(Math.random() * 20000) + 150000
            })).reverse(),
            campaignPlaybackData: [
                { name: 'Samsung S26', playbacks: 450000 },
                { name: 'Telcel 5G', playbacks: 380000 },
                { name: 'Coca-Cola Summer', playbacks: 310000 },
                { name: 'BanCoppel Crédito', playbacks: 280000 },
                { name: 'Disney+', playbacks: 150000 },
            ]
        };
    }

    const startEvents = playbackLogs.filter(l => l.eventType === 'start');
    const completeEvents = playbackLogs.filter(l => l.eventType === 'complete');
    const totalPlaybacks = startEvents.length;
    const completionRate = totalPlaybacks > 0 ? (completeEvents.length / totalPlaybacks) * 100 : 0;
    const totalWatchTimeHours = Math.floor(completeEvents.reduce((acc, log) => acc + (log.duration || 30), 0) / 3600);

    const playbacksByDay: { [key: string]: number } = {};
    startEvents.forEach(log => {
        const day = format(new Date(log.timestamp), 'MMM d');
        playbacksByDay[day] = (playbacksByDay[day] || 0) + 1;
    });
    
    return {
        totalPlaybacks,
        completedPlaybacks: completeEvents.length,
        interruptedPlaybacks: totalPlaybacks - completeEvents.length,
        completionRate,
        totalWatchTimeHours,
        playbacksOverTimeData: Object.entries(playbacksByDay).map(([date, count]) => ({ date, playbacks: count })),
        campaignPlaybackData: []
    };
  }, [playbackLogs, mode]);

  const handleDownloadReport = async () => {
      setIsGeneratingReport(true);
      try {
          const doc = new jsPDF();
          doc.setFontSize(22);
          doc.text('SCREENSIGHT ADOPS - AUDIT', 14, 20);
          
          autoTable(doc, {
              startY: 30,
              head: [['Metric', 'Value']],
              body: [
                  ['Network Success Rate', `${analyticsData.completionRate.toFixed(2)}%`],
                  ['Total Airtime Delivered', `${analyticsData.totalWatchTimeHours} Hours`],
                  ['Emissions Verified', analyticsData.completedPlaybacks.toLocaleString()]
              ],
              theme: 'striped'
          });

          doc.save(`ProofOfPlay_Audit_${format(new Date(), 'yyyyMMdd')}.pdf`);
      } catch (error) {
          console.error(error);
      } finally {
          setIsGeneratingReport(false);
      }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold uppercase tracking-widest text-xs">Analyzing telemetry stream...</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-muted/10 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Proof of Play</h1>
            <p className="text-muted-foreground font-medium">Real-time verification of campaign emission across the fleet.</p>
        </div>
        <Button onClick={handleDownloadReport} disabled={isGeneratingReport} className="bg-slate-900 font-bold">
            {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Download Audit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-black">{analyticsData.totalPlaybacks.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground text-emerald-500">Completed</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-black text-emerald-500">{analyticsData.completedPlaybacks.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground text-rose-500">Drops</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-black text-rose-500">{analyticsData.interruptedPlaybacks.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Airtime</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-black">{analyticsData.totalWatchTimeHours.toLocaleString()} hrs</div></CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-primary">Performance</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-black text-primary">{analyticsData.completionRate.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10">
            <CardHeader><CardTitle className="text-sm font-black uppercase">Emission Timeline</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer config={{ playbacks: { label: 'Runs', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <LineChart data={analyticsData.playbacksOverTimeData}>
                            <XAxis dataKey="date" fontSize={10} axisLine={false} />
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Line type="monotone" dataKey="playbacks" stroke="var(--color-playbacks)" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="border-primary/10">
            <CardHeader><CardTitle className="text-sm font-black uppercase">Top Campaign Fulfillment</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer config={{ playbacks: { label: 'Plays', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analyticsData.campaignPlaybackData} layout="vertical">
                            <YAxis dataKey="name" type="category" fontSize={10} width={100} axisLine={false} />
                            <XAxis type="number" hide />
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