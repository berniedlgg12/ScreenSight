'use client';

import { useState, useEffect } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    PlusCircle, 
    Loader2, 
    Sparkles, 
    RefreshCcw, 
    CheckCircle2, 
    Clock, 
    Wifi,
    MonitorPlay,
    MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreateRegionDialog } from './CreateRegionDialog';
import { EditRegionDialog } from './EditRegionDialog';
import { PreviewVideoDialog } from '@/components/media/PreviewVideoDialog';
import type { Region, Media, GeneratedPlaylist, PlaylistItem } from '@/lib/types';
import { doc, setDoc, onSnapshot, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { cn, isDeviceOnline } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const LOOP_DURATION_MINUTES = 10; 
const SLOT_DURATION_SECONDS = 30;
const LOOP_SLOTS = (LOOP_DURATION_MINUTES * 60) / SLOT_DURATION_SECONDS;

export function RegionManagement() {
  const { regions, devices, campaigns, sponsors, loading } = useFleet();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});
  const [regionPlaylists, setRegionPlaylists] = useState<Record<string, GeneratedPlaylist>>({});
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const unsub = onSnapshot(collection(db, 'generatedPlaylists'), (snap) => {
        const latest: Record<string, GeneratedPlaylist> = {};
        snap.docs.forEach(doc => {
            const data = doc.data() as GeneratedPlaylist;
            if (data.date === today) {
                latest[data.regionId] = data;
            }
        });
        setRegionPlaylists(latest);
    });
    return () => unsub();
  }, []);

  const handleSyncRegion = async (region: Region) => {
    const regionId = region.id;
    setSyncStatus(prev => ({ ...prev, [regionId]: true }));

    try {
        const mediaSnap = await getDocs(collection(db, 'media'));
        const allMedia = mediaSnap.docs.map(d => ({ id: d.id, ...d.data() } as Media));
        const validMediaMap = new Map<string, Media>();
        allMedia.forEach(m => {
          if (m.status === 'active' && m.downloadURL) validMediaMap.set(m.id, m);
        });

        const fillerMedia = allMedia.filter(m => m.sponsorId === 'coppel-internal' && validMediaMap.has(m.id));
        if (fillerMedia.length === 0) throw new Error("No hay videos de Coppel Internal válidos.");

        const activeCampaigns = campaigns.filter(c => (c.status === 'active') && c.targetRegions?.includes(regionId));
        const loopPlan: PlaylistItem[] = [];

        // Interleaved algorithm
        const totalItemsNeeded = LOOP_SLOTS;
        const campaignItems: PlaylistItem[] = [];
        activeCampaigns.forEach(campaign => {
            const mId = campaign.mediaIds?.[0];
            const mediaDoc = mId ? validMediaMap.get(mId) : null;
            if (mediaDoc) {
                campaignItems.push({
                    mediaId: mediaDoc.id,
                    title: mediaDoc.title,
                    sponsorId: mediaDoc.sponsorId,
                    sponsorName: mediaDoc.sponsorName,
                    downloadURL: mediaDoc.downloadURL,
                    duration: mediaDoc.duration || SLOT_DURATION_SECONDS,
                    type: 'video',
                    isFiller: false,
                    campaignId: campaign.id,
                    source: 'campaign'
                });
            }
        });

        for (let i = 0; i < totalItemsNeeded; i++) {
            if (campaignItems.length > 0 && i % 2 === 0) {
                loopPlan.push(campaignItems[i % campaignItems.length]);
            } else {
                loopPlan.push(fillerMedia[i % fillerMedia.length] as any);
            }
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const playlistId = `${regionId}_${dateStr}`;
        await setDoc(doc(db, 'generatedPlaylists', playlistId), {
            id: playlistId,
            regionId,
            regionName: region.name,
            date: dateStr,
            status: 'pending_merge',
            mergedVideoUrl: '', 
            mergedDuration: loopPlan.reduce((s, p) => s + p.duration, 0),
            syncStartTime: Date.now(),
            version: (regionPlaylists[regionId]?.version || 0) + 1,
            storagePath: `generatedPlaylists/${regionId}/current.mp4`,
            playlistItems: loopPlan.slice(0, totalItemsNeeded),
            requestedAt: Date.now(),
            updatedAt: Date.now()
        }, { merge: true });

        toast({ title: 'Receta Enviada', description: `Plan para ${region.name} en cola de merge.` });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setSyncStatus(prev => ({ ...prev, [regionId]: false }));
    }
  };

  const handleInitializeRegions = async () => {
    setInitializing(true);
    const mexicanRegions = [
      { name: 'Noroeste', states: ['Baja California', 'Baja California Sur', 'Sonora', 'Sinaloa'] },
      { name: 'Norte', states: ['Chihuahua', 'Coahuila', 'Durango'] },
      { name: 'Bajío', states: ['Guanajuato', 'Querétaro', 'San Luis Potosí'] },
      { name: 'Occidente', states: ['Jalisco', 'Nayarit', 'Colima'] },
      { name: 'Centro', states: ['Ciudad de México', 'México'] },
    ];
    try {
      for (const reg of mexicanRegions) {
        const id = reg.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
        await setDoc(doc(db, 'regions', id), {
          id, name: reg.name, states: reg.states, enabled: true,
          playbackStart: "08:00", playbackEnd: "22:00", timezone: "America/Mexico_City",
          standbyImage: "reposo/reposo.avif", autoResume: true, createdAt: Date.now(),
        });
      }
      await setDoc(doc(db, 'sponsors', 'coppel-internal'), {
        id: 'coppel-internal', name: 'COPPEL INTERNAL', industry: 'Retail', negotiatedCPM: 0, status: 'active', isInternal: true, createdAt: Date.now()
      });
      toast({ title: 'Sistema Inicializado', description: 'Territorios listos.' });
    } catch (error) { toast({ title: 'Error', variant: 'destructive' }); } finally { setInitializing(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Cargando Territorios...</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Territorios</h1>
          <p className="text-muted-foreground font-medium">Gestión de distribución y programación regional.</p>
        </div>
        <div className="flex gap-2">
          {sponsors.filter(s => s.isInternal).length === 0 && (
            <Button variant="default" onClick={handleInitializeRegions} disabled={initializing} className="bg-orange-500 hover:bg-orange-600 font-bold border-none text-white">
              <Sparkles className="mr-2 h-4 w-4" />
              Inicializar AdOps
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="font-bold">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Territorio
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {regions.map((region) => {
          const playlist = regionPlaylists[region.id];
          const regionStatus = playlist?.status || 'idle';
          const isEnabled = region.enabled ?? true;
          const isSyncing = syncStatus[region.id];
          const regionDevices = devices.filter(d => d.regionId === region.id);
          const onlineCount = regionDevices.filter(d => isDeviceOnline(d.lastHeartbeat)).length;

          return (
            <Card key={region.id} className={cn("overflow-hidden border-t-4 transition-all flex flex-col shadow-lg", isEnabled ? "border-t-primary" : "border-t-destructive opacity-80")}>
              <CardHeader className="pb-2 bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl font-black uppercase">{region.name}</CardTitle>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/20 text-primary">
                        {region.states.length} Estados
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">{isEnabled ? "ACTIVO" : "OFF"}</span>
                    <Switch checked={isEnabled} onCheckedChange={async (v) => await updateDoc(doc(db, 'regions', region.id), { enabled: v })} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card p-3 rounded-lg border border-primary/5 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Inventario</span>
                    <div className="flex items-center gap-2">
                        <Wifi className={cn("h-4 w-4", onlineCount > 0 ? "text-emerald-500" : "text-muted-foreground")} />
                        <span className="text-lg font-black">{onlineCount} / {regionDevices.length} TVs</span>
                    </div>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-primary/5 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Contenido</span>
                    <div className="flex items-center gap-1.5">
                        {regionStatus === 'ready' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                        <span className={cn("text-sm font-black uppercase", regionStatus === 'ready' ? 'text-emerald-500' : 'text-amber-500')}>
                            {regionStatus === 'ready' ? 'Sincronizado' : 'Merge en Cola'}
                        </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/10 border-t p-3 flex justify-between">
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="font-bold text-xs" onClick={() => {
                        const url = playlist?.mergedVideoUrl;
                        if(url) { setPreviewUrl(url); setPreviewOpen(true); }
                    }} disabled={regionStatus !== 'ready'}>
                        <MonitorPlay className="h-4 w-4 mr-2" /> Ver Loop
                    </Button>
                    <Separator orientation="vertical" className="h-8" />
                    <Button size="sm" variant="ghost" className="font-bold text-xs text-sky-500" onClick={() => handleSyncRegion(region)} disabled={!isEnabled || isSyncing}>
                        <RefreshCcw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                        Re-Merge
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase h-9 opacity-60" onClick={() => setEditingRegion(region)}>
                    Ajustes
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <CreateRegionDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
      <EditRegionDialog isOpen={editingRegion !== null} onOpenChange={(open) => !open && setEditingRegion(null)} region={editingRegion} />
      <PreviewVideoDialog isOpen={isPreviewOpen} setIsOpen={setPreviewOpen} videoUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}
