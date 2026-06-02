'use client';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { doc, onSnapshot, getDoc, updateDoc, collection, addDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import type { Device, Store, Region, GeneratedPlaylist, TVCommand, PlaylistItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const HEARTBEAT_INTERVAL_MS = 10000;
const SYNC_CORRECTION_INTERVAL_MS = 10000;
const DRIFT_THRESHOLD_SECONDS = 2.0;
const FALLBACK_REPOSO_URL = 'https://picsum.photos/seed/screensight-standby/1920/1080';

export function TvPlayer() {
  const searchParams = useSearchParams();
  const deviceId = searchParams.get('id');

  const [device, setDevice] = useState<Device | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStandbyMode, setStandbyMode] = useState(true);
  const [isEmergencyMode, setEmergencyMode] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const lastExecutedCommandId = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const appStartTime = useRef(Date.now());
  const resolvedRegionId = useRef<string | null>(null);
  const resolvedStoreId = useRef<string | null>(null);

  // Proof of Play Tracking
  const lastLoggedItemIndex = useRef<number | null>(null);
  const playbackStartTime = useRef<number>(0);

  // 1. Reloj interno
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Carga inicial del dispositivo
  useEffect(() => {
    if (!deviceId) {
        setLoading(false);
        return;
    }

    async function initDevice() {
        try {
            const snap = await getDoc(doc(db, 'devices', deviceId!));
            if (snap.exists()) {
                const data = snap.data() as Device;
                setDevice(data);
                resolvedRegionId.current = data.regionId || data.currentRegionId || null;
                resolvedStoreId.current = data.storeId || null;
                
                if (data.storeId) {
                    const storeSnap = await getDoc(doc(db, 'stores', data.storeId));
                    if (storeSnap.exists()) setStore(storeSnap.data() as Store);
                }
            }
        } catch (e) {
            console.error("Error inicializando TV:", e);
        } finally {
            setLoading(false);
        }
    }

    initDevice();
  }, [deviceId]);

  // 3. Suscripción a COMANDOS
  useEffect(() => {
    if (!deviceId || !resolvedStoreId.current) return;

    const unsubDevice = onSnapshot(doc(db, 'devices', deviceId), (snap) => {
        const data = snap.data() as Device;
        if (data?.tvCommand && 
            data.tvCommand.commandId !== lastExecutedCommandId.current && 
            data.tvCommand.createdAt > appStartTime.current) {
            handleRemoteCommand(data.tvCommand, "device");
        }
    });

    const unsubStore = onSnapshot(doc(db, 'stores', resolvedStoreId.current), (snap) => {
        const data = snap.data() as Store;
        if (data?.tvCommand && 
            data.tvCommand.commandId !== lastExecutedCommandId.current && 
            data.tvCommand.createdAt > appStartTime.current) {
            handleRemoteCommand(data.tvCommand, "store");
        }
    });

    return () => {
        unsubDevice();
        unsubStore();
    };
  }, [loading]);

  // 4. Suscripción a Región y Playlist
  useEffect(() => {
    if (!resolvedRegionId.current) return;

    const unsubReg = onSnapshot(doc(db, 'regions', resolvedRegionId.current), (snap) => {
        if (snap.exists()) setRegion(snap.data() as Region);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const playlistId = `${resolvedRegionId.current}_${todayStr}`;
    const unsubPlay = onSnapshot(doc(db, 'generatedPlaylists', playlistId), (snap) => {
        if (snap.exists()) {
            const pData = snap.data() as GeneratedPlaylist;
            if (pData.status === 'ready' && pData.mergedVideoUrl) setCurrentPlaylist(pData);
            else setCurrentPlaylist(null);
        } else {
            setCurrentPlaylist(null);
        }
    });

    return () => { unsubReg(); unsubPlay(); };
  }, [loading]);

  const handleRemoteCommand = useCallback(async (cmd: TVCommand, scope: "device" | "store") => {
    if (!deviceId) return;
    
    lastExecutedCommandId.current = cmd.commandId;
    let status: 'success' | 'error' = 'success';
    let errorMsg = '';

    try {
      const video = videoRef.current;
      switch (cmd.command) {
        case 'play':
        case 'resume':
          setStandbyMode(false);
          setEmergencyMode(false);
          if (video) {
            video.play().catch(() => {});
            forceSync(0.5);
          }
          break;
        case 'pause':
          if (video) video.pause();
          break;
        case 'restart':
          if (video) {
            video.currentTime = 0;
            video.play().catch(() => {});
          }
          break;
        case 'resync':
          forceSync(0.1);
          break;
        case 'standby':
          setStandbyMode(true);
          break;
        case 'wake':
          setStandbyMode(false);
          forceSync(0.5);
          break;
        case 'reload':
          window.location.reload();
          break;
        case 'fullscreen':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          break;
        case 'emergency':
          setEmergencyMode(true);
          setEmergencyMessage(cmd.payload?.message || "EMERGENCIA");
          if (video) video.pause();
          break;
        case 'clear_emergency':
          setEmergencyMode(false);
          setStandbyMode(false);
          forceSync(0.5);
          break;
      }
    } catch (e: any) {
      status = 'error';
      errorMsg = e.message;
    }

    updateDoc(doc(db, 'devices', deviceId), {
      lastCommandReceived: cmd.commandId,
      lastCommandScope: scope,
      lastCommandExecutedAt: Date.now(),
      lastCommandStatus: status,
      lastCommandError: errorMsg,
      updatedAt: Date.now()
    }).catch(() => {});
  }, [deviceId]);

  // 5. Proof of Play (PoP) Telemetry Logic
  useEffect(() => {
    if (isStandbyMode || isEmergencyMode || !currentPlaylist || !videoRef.current || !deviceId) return;

    const trackPlayback = async () => {
        const video = videoRef.current;
        if (!video) return;

        const duration = currentPlaylist.mergedDuration || 600;
        const syncStart = currentPlaylist.syncStartTime || Date.now();
        const elapsed = (Date.now() - syncStart) / 1000;
        const loopTime = elapsed % duration;

        // Determinar qué item de la playlist se está reproduciendo
        let accumulated = 0;
        let activeIndex = 0;
        for (let i = 0; i < currentPlaylist.playlistItems.length; i++) {
            const item = currentPlaylist.playlistItems[i];
            if (loopTime >= accumulated && loopTime < accumulated + item.duration) {
                activeIndex = i;
                break;
            }
            accumulated += item.duration;
        }

        // Si el item cambió, registrar PoP
        if (activeIndex !== lastLoggedItemIndex.current) {
            const lastIndex = lastLoggedItemIndex.current;
            const newItem = currentPlaylist.playlistItems[activeIndex];

            // 1. Log "Complete" for previous item if it was a campaign
            if (lastIndex !== null) {
                const prevItem = currentPlaylist.playlistItems[lastIndex];
                if (prevItem.campaignId) {
                    await addDoc(collection(db, 'playbackLogs'), {
                        timestamp: serverTimestamp(),
                        deviceId,
                        storeId: resolvedStoreId.current,
                        regionId: resolvedRegionId.current,
                        mediaId: prevItem.mediaId,
                        campaignId: prevItem.campaignId,
                        eventType: 'complete',
                        duration: prevItem.duration
                    });

                    // Update Campaign Counters
                    const campRef = doc(db, 'campaigns', prevItem.campaignId);
                    await updateDoc(campRef, {
                        deliveredPlaybacks: increment(1),
                        deliveredImpressions: increment(Math.floor(Math.random() * 5) + 1), // Mock impressions per play
                        updatedAt: Date.now()
                    }).catch(() => {});
                }
            }

            // 2. Log "Start" for new item
            if (newItem.campaignId) {
                await addDoc(collection(db, 'playbackLogs'), {
                    timestamp: serverTimestamp(),
                    deviceId,
                    storeId: resolvedStoreId.current,
                    regionId: resolvedRegionId.current,
                    mediaId: newItem.mediaId,
                    campaignId: newItem.campaignId,
                    eventType: 'start'
                });
            }

            lastLoggedItemIndex.current = activeIndex;
        }
    };

    const interval = setInterval(trackPlayback, 2000); // Check every 2s for precise logging
    return () => clearInterval(interval);
  }, [isStandbyMode, isEmergencyMode, currentPlaylist, deviceId]);

  // 6. Telemetría y Heartbeat
  useEffect(() => {
    if (!deviceId) return;
    const sendHeartbeat = () => {
      const drift = calculateDrift();
      const payload = {
        lastHeartbeat: Date.now(),
        status: 'online',
        connectionStatus: 'active',
        currentPlaybackMode: isEmergencyMode ? 'emergency' : (isStandbyMode ? 'standby' : 'regional-merged'),
        currentOffset: videoRef.current?.currentTime || 0,
        driftSeconds: drift,
        updatedAt: Date.now()
      };
      updateDoc(doc(db, 'devices', deviceId), payload).catch(() => {});
    };

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    sendHeartbeat();
    return () => clearInterval(interval);
  }, [deviceId, isStandbyMode, isEmergencyMode, currentPlaylist]);

  const calculateDrift = useCallback(() => {
    if (!videoRef.current || !currentPlaylist) return 0;
    const duration = currentPlaylist.mergedDuration || 600;
    const syncStart = currentPlaylist.syncStartTime || Date.now();
    const elapsed = (Date.now() - syncStart) / 1000;
    const targetTime = elapsed % duration;
    return Math.abs(videoRef.current.currentTime - targetTime);
  }, [currentPlaylist]);

  const forceSync = useCallback((threshold: number) => {
    const video = videoRef.current;
    if (!video || !currentPlaylist || isStandbyMode || isEmergencyMode) return;
    const duration = currentPlaylist.mergedDuration || 600;
    const syncStart = currentPlaylist.syncStartTime || Date.now();
    const elapsed = (Date.now() - syncStart) / 1000;
    const targetTime = elapsed % duration;
    if (Math.abs(video.currentTime - targetTime) > threshold) {
      video.currentTime = targetTime;
    }
  }, [currentPlaylist, isStandbyMode, isEmergencyMode]);

  useEffect(() => {
    if (isStandbyMode || isEmergencyMode || !currentPlaylist) return;
    const interval = setInterval(() => forceSync(DRIFT_THRESHOLD_SECONDS), SYNC_CORRECTION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentPlaylist, isStandbyMode, isEmergencyMode, forceSync]);

  // 7. Evaluación de Horarios
  const evaluation = useMemo(() => {
    if (loading) return { isStandby: true, reason: 'Inicializando...' };
    if (!device) return { isStandby: true, reason: 'Nodo Desconocido' };
    if (!region) return { isStandby: true, reason: 'Sincronizando Región' };
    if (region.enabled === false) return { isStandby: true, reason: 'Territorio Desactivado' };

    if (region.playbackStart && region.playbackEnd) {
        const [startH, startM] = region.playbackStart.split(':').map(Number);
        const [endH, endM] = region.playbackEnd.split(':').map(Number);
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        if (nowMinutes < (startH * 60 + startM) || nowMinutes >= (endH * 60 + endM)) {
            return { isStandby: true, reason: 'Fuera de Horario' };
        }
    }

    if (!currentPlaylist) return { isStandby: true, reason: 'Sincronizando Loop...' };
    return { isStandby: false, reason: 'active' };
  }, [region, currentTime, currentPlaylist, device, loading]);

  useEffect(() => {
    if (!lastExecutedCommandId.current) setStandbyMode(evaluation.isStandby);
  }, [evaluation]);

  // 8. Motor de Reproducción
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isStandbyMode || isEmergencyMode || !currentPlaylist?.mergedVideoUrl) {
        if (video) { video.pause(); video.src = ""; }
        return;
    }

    const timestamp = currentPlaylist.updatedAt || Date.now();
    const videoUrl = `${currentPlaylist.mergedVideoUrl}${currentPlaylist.mergedVideoUrl.includes('?') ? '&' : '?'}v=${timestamp}`;

    if (video.getAttribute('src') !== videoUrl) {
        video.src = videoUrl;
        video.load();
    }

    const handleLoadedMetadata = () => {
        const duration = currentPlaylist.mergedDuration || 600;
        const syncStart = currentPlaylist.syncStartTime || Date.now();
        const elapsed = (Date.now() - syncStart) / 1000;
        video.currentTime = elapsed % duration;
        video.play().catch(() => {});
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [currentPlaylist?.mergedVideoUrl, isStandbyMode, isEmergencyMode]);

  const standbyImage = region?.standbyImageUrl || FALLBACK_REPOSO_URL;

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative flex items-center justify-center cursor-none">
      {isEmergencyMode && (
        <div className="absolute inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center text-white p-12 text-center animate-pulse">
          <div className="text-[12rem] font-black mb-8">⚠️</div>
          <h1 className="text-8xl font-black uppercase tracking-tighter mb-4">Aviso de Emergencia</h1>
          <p className="text-5xl font-bold uppercase border-t-4 border-white/20 pt-8">{emergencyMessage}</p>
        </div>
      )}

      <div className={cn(
        "absolute inset-0 z-50 transition-opacity duration-1000",
        isStandbyMode ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <img src={standbyImage} alt="Standby" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute bottom-16 left-16 flex flex-col gap-4 text-white">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                <span className="font-black uppercase text-sm tracking-[0.3em] opacity-90">
                    MODO REPOSO: {evaluation.reason}
                </span>
            </div>
            <div className="font-mono text-xs uppercase opacity-40 flex gap-8 tracking-widest">
                <span>Nodo: {deviceId || '---'}</span>
                <span>Tienda: {store?.name || '---'}</span>
            </div>
        </div>
      </div>

      <video
        ref={videoRef}
        muted
        loop
        playsInline
        className={cn(
            "absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-1000",
            (isStandbyMode || isEmergencyMode) ? "opacity-0" : "opacity-100"
        )}
      />

      <div className="absolute inset-0 z-30 opacity-0" onClick={() => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
      }} />
    </main>
  );
}