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

const initialDateRange = {
    from: addDays(new Date(), -7),
    to: new Date(),
};

export function Analytics() {
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

    const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    });

    const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    // Real-time Playback Logs
    const qLogs = query(collection(db, 'playbackLogs'), orderBy('timestamp', 'desc'), limit(2000));
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
    
    const totalPlaybacks = startEvents.length;
    const completionRate = totalPlaybacks > 0 ? (completeEvents.length / totalPlaybacks) * 100 : 0;
    
    // Watch Time: Sum of durations from complete logs
    const totalWatchTimeSeconds = completeEvents.reduce((acc, log) => acc + (log.duration || 30), 0);
    const totalWatchTimeHours = Math.floor(totalWatchTimeSeconds / 3600);

    // Timeline Data
    const playbacksByDay: { [key: string]: number } = {};
    startEvents.forEach(log => {
        const day = format(new Date(log.timestamp), 'MMM d');
        playbacksByDay[day] = (playbacksByDay[day] || 0) + 1;
    });
    const playbacksOverTimeData = Object.entries(playbacksByDay)
        .map(([date, count]) => ({ date, playbacks: count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Campaign Data
    const campaignCounts: { [key: string]: number } = {};
    completeEvents.forEach(log => {
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
        interruptedPlaybacks: totalPlaybacks - completeEvents.length,
        completionRate,
        totalWatchTimeHours,
        playbacksOverTimeData,
        campaignPlaybackData,
    };
  }, [filteredLogs, stores, campaigns]);

  const handleDownloadReport = async () => {
      setIsGeneratingReport(true);
      try {
          const doc = new jsPDF();
          
          // Header
          doc.setFontSize(22);
          doc.setTextColor(30, 41, 59);
          doc.text('SCREENSIGHT ADOPS', 14, 20);
          
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text('PROOF OF PLAY AUDIT REPORT', 14, 28);
          doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 34);
          
          // Data Period
          const dateStr = filters.dateRange?.from && filters.dateRange?.to 
            ? `${format(filters.dateRange.from, 'MMM d, yyyy')} - ${format(filters.dateRange.to, 'MMM d, yyyy')}`
            : 'All Time';
          doc.text(`Audit Period: ${dateStr}`, 14, 40);
          
          // KPI Summary
          autoTable(doc, {
              startY: 50,
              head: [['Metric', 'Value']],
              body: [
                  ['Total Emissions Initiated', analyticsData.totalPlaybacks.toLocaleString()],
                  ['Successful Completions', analyticsData.completedPlaybacks.toLocaleString()],
                  ['Drop Rate', `${(100 - analyticsData.completionRate).toFixed(2)}%`],
                  ['Total Airtime Delivered', `${analyticsData.totalWatchTimeHours} Hours`],
                  ['Network Success Rate', `${analyticsData.completionRate.toFixed(2)}%`]
              ],
              theme: 'striped',
              headStyles: { fillStyle: 'fill', fillColor: [51, 65, 85] }
          });

          // Campaign Detail Table
          const campaignRows = campaigns
            .filter(c => filters.campaign === 'all' || c.id === filters.campaign)
            .map(c => {
                const delivered = filteredLogs.filter(l => l.campaignId === c.id && l.eventType === 'complete').length;
                const target = c.targetPlaybacks || 0;
                const progress = target > 0 ? ((delivered / target) * 100).toFixed(1) + '%' : 'N/A';
                return [c.name, c.brandName, target.toLocaleString(), delivered.toLocaleString(), progress];
            });

          doc.setFontSize(14);
          doc.text('Campaign Delivery Audit', 14, (doc as any).lastAutoTable.finalY + 15);

          autoTable(doc, {
              startY: (doc as any).lastAutoTable.finalY + 20,
              head: [['Campaign', 'Brand', 'Goal', 'Delivered', 'Fulfillment']],
              body: campaignRows,
              theme: 'grid',
              headStyles: { fillColor: [59, 130, 246] }
          });

          // Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          for(let i = 1; i <= pageCount; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.text('This document serves as technical proof of play recorded via Firebase Telemetry SDK.', 14, 285);
              doc.text(`Page ${i} of ${pageCount}`, 180, 285);
          }

          doc.save(`ProofOfPlay_Audit_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      } catch (error) {
          console.error('PDF Error:', error);
      } finally {
          setIsGeneratingReport(false);
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-muted-foreground gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold uppercase tracking-widest text-xs">Analyzing telemetry stream...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-muted/10 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Proof of Play</h1>
            <p className="text-muted-foreground font-medium">Real-time verification of campaign emission across the fleet.</p>
        </div>
        <Button 
            variant="default" 
            className="font-black uppercase tracking-widest gap-2 bg-slate-900 hover:bg-slate-800"
            onClick={handleDownloadReport}
            disabled={isGeneratingReport}
        >
            {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Download Audit
        </Button>
      </div>
      
      <AnalyticsFilters 
        campaigns={campaigns} 
        stores={stores} 
        filters={filters as any} 
        setFilters={setFilters as any} 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Runs</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{analyticsData.totalPlaybacks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{analyticsData.completedPlaybacks.toLocaleString()}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{analyticsData.completionRate.toFixed(1)}% Success</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Drops</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-500">{analyticsData.interruptedPlaybacks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Airtime</CardTitle>
            <Clock className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{analyticsData.totalWatchTimeHours.toLocaleString()} hrs</div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-primary/5 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Performance</CardTitle>
            <BarChart2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{analyticsData.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10">
            <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Emission Timeline</CardTitle></CardHeader>
            <CardContent>
            <ChartContainer config={{ playbacks: { label: 'Runs', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                <ResponsiveContainer>
                    <LineChart data={analyticsData.playbacksOverTimeData}>
                        <YAxis hide />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Line type="monotone" dataKey="playbacks" stroke="var(--color-playbacks)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-playbacks)" }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>
        <Card className="border-primary/10">
            <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><Download className="h-4 w-4" /> Top Campaign Fulfillment</CardTitle></CardHeader>
            <CardContent>
            <ChartContainer config={{ playbacks: { label: 'Plays', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                <ResponsiveContainer>
                <BarChart data={analyticsData.campaignPlaybackData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={120} tickLine={false} axisLine={false} />
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
