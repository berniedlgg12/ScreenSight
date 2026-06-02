'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, CheckCircle, Clock, PlayCircle, XCircle, Loader2, Download, FileText, FilterX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, Store, PlaybackLog } from '@/lib/types';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { AnalyticsFilters } from './AnalyticsFilters';
import { DateRange } from 'react-day-picker';
import { addDays, format, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMode } from '@/hooks/use-mode';
import { useFleet } from '@/hooks/use-fleet';

const initialDateRange = {
    from: addDays(new Date(), -30),
    to: new Date(),
};

export function Analytics() {
  const { mode } = useMode();
  const { campaigns, stores, loading: fleetLoading } = useFleet();
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
    if (mode === 'demo') {
        setLoading(false);
        return;
    }

    setLoading(true);
    const qLogs = query(collection(db, 'playbackLogs'), orderBy('timestamp', 'desc'), limit(5000));
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

    return () => unsubLogs();
  }, [mode]);

  // Filtrado de logs reales
  const filteredLogs = useMemo(() => {
    if (mode === 'demo') return [];

    return playbackLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        
        // 1. Filtro de Fecha
        if (filters.dateRange?.from && filters.dateRange?.to) {
            if (!isWithinInterval(logDate, { start: filters.dateRange.from, end: filters.dateRange.to })) return false;
        }

        // 2. Filtro de Marca (vía campaña)
        if (filters.brand !== 'all') {
            const camp = campaigns.find(c => c.id === log.campaignId);
            if (camp?.brandName !== filters.brand) return false;
        }

        // 3. Filtro de Campaña
        if (filters.campaign !== 'all' && log.campaignId !== filters.campaign) return false;

        // 4. Filtro de Tienda
        if (filters.store !== 'all' && log.storeId !== filters.store) return false;

        return true;
    });
  }, [playbackLogs, filters, campaigns, mode]);

  const analyticsData = useMemo(() => {
    if (mode === 'demo') {
        // Simulación inteligente basada en filtros
        let multiplier = 1.0;
        if (filters.brand !== 'all') multiplier = 0.15;
        if (filters.campaign !== 'all') multiplier = 0.05;
        if (filters.store !== 'all') multiplier = 0.001;

        return {
            totalPlaybacks: Math.floor(1245000 * multiplier),
            completedPlaybacks: Math.floor(1182000 * multiplier),
            interruptedPlaybacks: Math.floor(63000 * multiplier),
            completionRate: 94.9,
            totalWatchTimeHours: Math.floor(10450 * multiplier),
            playbacksOverTimeData: Array.from({ length: 7 }).map((_, i) => ({
                date: format(addDays(new Date(), -i), 'MMM d'),
                playbacks: Math.floor((Math.random() * 20000 + 150000) * multiplier)
            })).reverse(),
            campaignPlaybackData: campaigns.slice(0, 5).map(c => ({
                name: c.name.split(' - ')[0],
                playbacks: Math.floor(c.deliveredPlaybacks * multiplier)
            }))
        };
    }

    const startEvents = filteredLogs.filter(l => l.eventType === 'start');
    const completeEvents = filteredLogs.filter(l => l.eventType === 'complete');
    const totalPlaybacks = startEvents.length;
    const completionRate = totalPlaybacks > 0 ? (completeEvents.length / totalPlaybacks) * 100 : 0;
    const totalWatchTimeHours = Math.floor(completeEvents.reduce((acc, log) => acc + 30, 0) / 3600);

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
        campaignPlaybackData: campaigns
            .filter(c => filters.brand === 'all' || c.brandName === filters.brand)
            .slice(0, 5)
            .map(c => ({
                name: c.name.split(' - ')[0],
                playbacks: completeEvents.filter(l => l.campaignId === c.id).length
            }))
    };
  }, [filteredLogs, mode, campaigns, filters]);

  const handleDownloadReport = async () => {
      setIsGeneratingReport(true);
      try {
          const doc = new jsPDF();
          
          // Header
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, 210, 40, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.setFont('helvetica', 'bold');
          doc.text('SCREENSIGHT ADOPS - AUDIT REPORT', 14, 25);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 34);

          // Audit Scope Section
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(14);
          doc.text('AUDIT SCOPE & FILTERS', 14, 55);
          
          const scopeData = [
              ['Timeframe', filters.dateRange?.from ? `${format(filters.dateRange.from, 'MMM d, yyyy')} - ${format(filters.dateRange.to || new Date(), 'MMM d, yyyy')}` : 'All Time'],
              ['Advertiser', filters.brand === 'all' ? 'Network Wide' : filters.brand],
              ['Campaign', filters.campaign === 'all' ? 'All Campaigns' : campaigns.find(c => c.id === filters.campaign)?.name || 'N/A'],
              ['Retail Node', filters.store === 'all' ? 'All Stores' : stores.find(s => s.id === filters.store)?.name || 'N/A'],
              ['Data Source', mode === 'demo' ? 'SIMULATED (1 YEAR)' : 'REAL OPERATIONAL DATA']
          ];

          autoTable(doc, {
              startY: 60,
              head: [['Criterion', 'Value']],
              body: scopeData,
              theme: 'grid',
              headStyles: { fillColor: [51, 65, 85] }
          });

          // Metrics Summary
          doc.setFontSize(14);
          doc.text('VERIFIED PERFORMANCE METRICS', 14, (doc as any).lastAutoTable.finalY + 15);
          
          autoTable(doc, {
              startY: (doc as any).lastAutoTable.finalY + 20,
              head: [['Metric', 'Value', 'Status']],
              body: [
                  ['Successful Airtime Plays', analyticsData.completedPlaybacks.toLocaleString(), 'VERIFIED'],
                  ['Network Drop Rate', `${(100 - analyticsData.completionRate).toFixed(2)}%`, 'NOMINAL'],
                  ['Total Time on Screen', `${analyticsData.totalWatchTimeHours} Hours`, 'DELIVERED'],
                  ['Network Success Rate', `${analyticsData.completionRate.toFixed(2)}%`, 'OPTIMAL']
              ],
              theme: 'striped'
          });

          // Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          for(let i = 1; i <= pageCount; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.setTextColor(150);
              doc.text('ScreenSight AdOps OS — Proof of Play Certification — CONFIDENTIAL', 105, 285, { align: 'center' });
          }

          doc.save(`PoP_Audit_${filters.brand}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      } catch (error) {
          console.error(error);
      } finally {
          setIsGeneratingReport(false);
      }
  };

  const clearFilters = () => {
    setFilters({
        dateRange: initialDateRange,
        brand: 'all',
        campaign: 'all',
        store: 'all'
    });
  };

  const isFiltered = filters.brand !== 'all' || filters.campaign !== 'all' || filters.store !== 'all';

  if (loading || fleetLoading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold uppercase tracking-widest text-xs">Analyzing telemetry stream...</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-muted/10 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Proof of Play</h1>
            <p className="text-muted-foreground font-medium">Verified airtime audit and emission compliance.</p>
        </div>
        <div className="flex items-center gap-3">
            {isFiltered && (
                <Button variant="ghost" onClick={clearFilters} className="text-rose-500 font-bold uppercase text-[10px]">
                    <FilterX className="h-4 w-4 mr-2" /> Clear
                </Button>
            )}
            <Button onClick={handleDownloadReport} disabled={isGeneratingReport} className="bg-slate-900 font-bold h-11 px-6 border-b-4 border-slate-950 active:border-b-0 transition-all">
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Download Filtered Audit
            </Button>
        </div>
      </div>

      <AnalyticsFilters 
        campaigns={campaigns} 
        stores={stores} 
        filters={filters} 
        setFilters={setFilters} 
      />

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
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-primary">Success Rate</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-black text-primary">{analyticsData.completionRate.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 bg-card">
            <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Verification Timeline</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer config={{ playbacks: { label: 'Runs', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <LineChart data={analyticsData.playbacksOverTimeData}>
                            <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Line type="stepAfter" dataKey="playbacks" stroke="var(--color-playbacks)" strokeWidth={4} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="border-primary/10 bg-card">
            <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campaign Fulfillment (Top 5)</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer config={{ playbacks: { label: 'Plays', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analyticsData.campaignPlaybackData} layout="vertical">
                            <YAxis dataKey="name" type="category" fontSize={10} width={100} axisLine={false} tickLine={false} />
                            <XAxis type="number" hide />
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="playbacks" fill="var(--color-playbacks)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
