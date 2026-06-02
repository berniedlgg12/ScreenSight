'use client';

import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Device, Store, Sponsor, Region, Campaign, PlaybackLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useMode } from './use-mode';

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

  // Helper to get collection name based on mode
  const col = (name: string) => mode === 'demo' ? `demo_${name}` : name;

  useEffect(() => {
    setLoading(true);

    const unsubStores = onSnapshot(collection(db, col('stores')), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    });

    const unsubDevices = onSnapshot(query(collection(db, col('devices')), orderBy('name', 'asc')), (snapshot) => {
      setDevices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device)));
      setLoading(false);
    });

    const unsubSponsors = onSnapshot(collection(db, col('sponsors')), (snapshot) => {
      setSponsors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsor)));
    });

    const unsubRegions = onSnapshot(collection(db, col('regions')), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Region)));
    });

    const unsubCampaigns = onSnapshot(collection(db, col('campaigns')), (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
    });

    const unsubLogs = onSnapshot(query(collection(db, col('playbackLogs')), orderBy('timestamp', 'desc')), (snapshot) => {
      setPlaybackLogs(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
        } as any;
      }));
    });

    const timer = setInterval(() => setNow(Date.now()), 5000);

    return () => {
      unsubStores();
      unsubDevices();
      unsubSponsors();
      unsubRegions();
      unsubCampaigns();
      unsubLogs();
      clearInterval(timer);
    };
  }, [mode]);

  const refreshData = useCallback(() => {
    toast({ title: mode === 'demo' ? 'Demo Fleet Synced' : 'Live Fleet Synced', description: 'Telemetry updated.' });
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
