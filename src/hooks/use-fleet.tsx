'use client';

import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Device, Store, Sponsor, Region, Campaign, PlaybackLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface FleetContextType {
  devices: Device[];
  stores: Store[];
  sponsors: Sponsor[];
  regions: Region[];
  campaigns: Campaign[];
  playbackLogs: PlaybackLog[];
  loading: boolean;
  refreshData: () => void;
  now: number; // Exposing current time for dynamic status calculations
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: ReactNode }) {
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
      setPlaybackLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    // Dynamic UI Refresh Timer (every 5 seconds)
    // This forces components using useFleet to re-render and re-calculate isDeviceOnline
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
  }, []);

  const refreshData = useCallback(() => {
    toast({ title: 'Live Sync Active', description: 'Monitoring fleet real-time.' });
  }, [toast]);

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
