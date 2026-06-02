'use client';

import { createContext, useState, useEffect, ReactNode, useContext, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Device, Store, Sponsor, Region, Campaign, PlaybackLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useMode } from './use-mode';
import { getVirtualDemoData } from '@/lib/demo-data-generator';

interface FleetContextType {
  devices: Device[];
  stores: Store[];
  sponsors: Sponsor[];
  regions: Region[];
  campaigns: Campaign[];
  playbackLogs: PlaybackLog[];
  loading: boolean;
  refreshData: () => void;
  now: number;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: ReactNode }) {
  const { mode } = useMode();
  const [devices, setDevices] = useState<Device[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [playbackLogs, setPlaybackLogs] = useState<PlaybackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    // CAPA VIRTUAL PARA MODO DEMO
    if (mode === 'demo') {
        setLoading(true);
        const virtualData = getVirtualDemoData();
        setRegions(virtualData.regions);
        setSponsors(virtualData.sponsors);
        setStores(virtualData.stores);
        setDevices(virtualData.devices);
        setCampaigns(virtualData.campaigns);
        setPlaybackLogs([]); 
        setLoading(false);
        return;
    }

    // MODO REAL - FIREBASE
    setLoading(true);
    const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    });

    const unsubDevices = onSnapshot(query(collection(db, 'devices'), orderBy('name', 'asc')), (snapshot) => {
      setDevices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device)));
      setLoading(false);
    });

    const unsubSponsors = onSnapshot(collection(db, 'sponsors'), (snapshot) => {
      setSponsors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsor)));
    });

    const unsubRegions = onSnapshot(collection(db, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Region)));
    });

    const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
    });

    const unsubLogs = onSnapshot(query(collection(db, 'playbackLogs'), orderBy('timestamp', 'desc')), (snapshot) => {
      setPlaybackLogs(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
        } as any;
      }));
    });

    return () => {
      unsubStores();
      unsubDevices();
      unsubSponsors();
      unsubRegions();
      unsubCampaigns();
      unsubLogs();
    };
  }, [mode]);

  // PULSO DE SIMULACIÓN PARA MODO DEMO
  // Mantiene los semáforos estables actualizando el heartbeat virtual relativo al tiempo actual
  useEffect(() => {
    if (mode !== 'demo' || loading) return;

    const pulse = setInterval(() => {
        setDevices(prevDevices => prevDevices.map(device => {
            const healthTag = device.tags?.[0]; // Usamos el tag que inyectamos en el generador
            let offset = 0;
            
            if (healthTag === 'h-online') {
                offset = Math.floor(Math.random() * 25000); // Mantiene < 35s
            } else if (healthTag === 'h-unstable') {
                offset = 40000 + Math.floor(Math.random() * 15000); // Mantiene entre 40s y 55s
            } else {
                return device; // Offline se queda como está
            }

            return {
                ...device,
                lastHeartbeat: Date.now() - offset
            };
        }));
    }, 15000); // Pulso cada 15 segundos

    return () => clearInterval(pulse);
  }, [mode, loading]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = useCallback(() => {
    toast({ title: mode === 'demo' ? 'Virtual Fleet Synced' : 'Live Fleet Synced', description: 'Telemetry updated.' });
  }, [toast, mode]);

  return (
    <FleetContext.Provider value={{ devices, stores, sponsors, regions, campaigns, playbackLogs, loading, refreshData, now }}>
      {children}
    </FleetContext.Provider>
  );
}

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (context === undefined) throw new Error('useFleet must be used within a FleetProvider');
  return context;
};
