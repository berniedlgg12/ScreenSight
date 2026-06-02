import { db } from './firebase';
import { collection, doc, writeBatch, getDocs, deleteDoc, query, limit } from 'firebase/firestore';
import { mexicanStates } from './mexican-states';

const DEMO_REGIONS = [
  { id: 'noroeste', name: 'Noroeste', states: ['Baja California', 'Baja California Sur', 'Sonora', 'Sinaloa'] },
  { id: 'noreste', name: 'Noreste', states: ['Chihuahua', 'Coahuila', 'Nuevo León', 'Tamaulipas'] },
  { id: 'occidente', name: 'Occidente', states: ['Jalisco', 'Nayarit', 'Colima', 'Michoacán'] },
  { id: 'bajio', name: 'Bajío', states: ['Guanajuato', 'Querétaro', 'San Luis Potosí', 'Aguascalientes', 'Zacatecas'] },
  { id: 'centro', name: 'Centro', states: ['Hidalgo', 'Morelos', 'Puebla', 'Tlaxcala', 'Veracruz'] },
  { id: 'cdmx-zm', name: 'CDMX / Zona Metropolitana', states: ['Ciudad de México', 'México'] },
  { id: 'sur', name: 'Sur', states: ['Guerrero', 'Oaxaca', 'Chiapas'] },
  { id: 'sureste', name: 'Sureste', states: ['Tabasco', 'Campeche', 'Yucatán', 'Quintana Roo'] },
];

const DEMO_SPONSORS = [
  { name: 'Samsung', industry: 'Consumer Electronics' },
  { name: 'Telcel', industry: 'Telecommunications' },
  { name: 'Coca-Cola', industry: 'Beverages' },
  { name: 'Netflix', industry: 'Streaming' },
  { name: 'BanCoppel', industry: 'Banking' },
  { name: 'Adidas', industry: 'Apparel' },
  { name: 'Mercado Pago', industry: 'Fintech' },
  { name: 'Motorola', industry: 'Tech' },
  { name: 'Disney+', industry: 'Media' },
  { name: 'L’Oréal', industry: 'Beauty' }
];

export async function generateDemoDataset(progressCallback: (msg: string) => void) {
  const batchSize = 400; 
  
  try {
      // 1. Regions
      progressCallback("Generating Regions...");
      let batch = writeBatch(db);
      DEMO_REGIONS.forEach(reg => {
        const ref = doc(db, 'demo_regions', reg.id);
        batch.set(ref, { ...reg, enabled: true, playbackStart: "08:00", playbackEnd: "22:00", timezone: "America/Mexico_City", createdAt: Date.now() });
      });
      await batch.commit();

      // 2. Sponsors
      progressCallback("Generating Brands...");
      batch = writeBatch(db);
      const sponsorIds: string[] = [];
      DEMO_SPONSORS.forEach((sp, i) => {
        const id = `demo-sp-${i}`;
        sponsorIds.push(id);
        const ref = doc(db, 'demo_sponsors', id);
        batch.set(ref, { ...sp, id, negotiatedCPM: 18.5, status: 'active', createdAt: Date.now() });
      });
      await batch.commit();

      // 3. Stores (1,800)
      progressCallback("Building 1,800 Stores across Mexico...");
      const storesPerState = Math.floor(1800 / 32);
      let storeCount = 0;
      let currentBatch = writeBatch(db);
      const storeIds: string[] = [];

      for (const state of mexicanStates) {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        for (let i = 1; i <= storesPerState; i++) {
          const sanitizedState = state.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0,3).toUpperCase();
          const storeId = `${sanitizedState}-${i.toString().padStart(3, '0')}`;
          storeIds.push(storeId);
          const ref = doc(db, 'demo_stores', storeId);
          currentBatch.set(ref, {
            id: storeId,
            name: `Coppel ${state} ${i}`,
            state,
            city: 'Simulated City',
            regionId: region.id,
            status: 'active',
            dailyTraffic: Math.floor(Math.random() * 2000) + 500,
            createdAt: Date.now()
          });
          storeCount++;

          if (storeCount % batchSize === 0) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            progressCallback(`Stores created: ${storeCount}/1800`);
          }
        }
      }
      await currentBatch.commit();

      // 4. Devices (approx 5,000)
      progressCallback("Deploying 5,000 Smart TVs...");
      let deviceCount = 0;
      currentBatch = writeBatch(db);
      for (let i = 0; i < 5000; i++) {
        const storeId = storeIds[i % storeIds.length];
        const deviceId = `${storeId}-${(Math.floor(i/storeIds.length) + 1).toString().padStart(3, '0')}`;
        const ref = doc(db, 'demo_devices', deviceId);
        
        const rand = Math.random();
        const status = rand > 0.08 ? 'online' : (rand > 0.03 ? 'unstable' : 'offline');

        currentBatch.set(ref, {
          id: deviceId,
          name: `TV ${i % 10 + 1}`,
          storeId,
          regionId: DEMO_REGIONS.find(r => r.states.some(s => storeId.startsWith(s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0,3).toUpperCase())))?.id || 'centro',
          status: status === 'offline' ? 'offline' : 'online',
          connectionStatus: status === 'online' ? 'active' : (status === 'unstable' ? 'error' : 'disconnected'),
          lastHeartbeat: status === 'online' ? Date.now() - (Math.random() * 10000) : Date.now() - (Math.random() * 500000),
          todayStats: { totalPlaybacks: Math.floor(Math.random() * 200) + 50 },
          currentPlaybackMode: 'regional-merged',
          updatedAt: Date.now()
        });
        deviceCount++;

        if (deviceCount % batchSize === 0) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          progressCallback(`Devices deployed: ${deviceCount}/5000`);
        }
      }
      await currentBatch.commit();

      // 5. Campaigns
      progressCallback("Seeding Annual Campaigns...");
      currentBatch = writeBatch(db);
      for (let i = 0; i < 20; i++) {
        const sponsorId = sponsorIds[i % sponsorIds.length];
        const sponsor = DEMO_SPONSORS[i % DEMO_SPONSORS.length];
        const id = `demo-camp-${i}`;
        const ref = doc(db, 'demo_campaigns', id);
        
        const target = 500000 + (Math.random() * 2000000);
        const progress = Math.random();
        const status = progress > 0.9 ? 'completed' : (progress < 0.1 ? 'scheduled' : 'active');

        currentBatch.set(ref, {
          id,
          name: `${sponsor.name} ${['Promo Q1', 'Summer Sale', 'National Launch', 'Flash Offer'][i % 4]}`,
          sponsorId,
          brandName: sponsor.name,
          status,
          targetImpressions: target,
          deliveredImpressions: status === 'completed' ? target : Math.floor(target * progress),
          targetPlaybacks: Math.floor(target / 2.5),
          deliveredPlaybacks: status === 'completed' ? Math.floor(target / 2.5) : Math.floor((target * progress) / 2.5),
          budget: (target / 1000) * 18.5,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          targetRegions: DEMO_REGIONS.map(r => r.id),
          priority: i % 5 === 0 ? 'high' : 'normal',
          createdAt: Date.now()
        });
      }
      await currentBatch.commit();

      progressCallback("Simulation Ready! Mode: DEMO ACTIVE.");
  } catch (error) {
      console.error("Critical error generating demo data:", error);
      throw error;
  }
}

export async function clearDemoDataset(progressCallback: (msg: string) => void) {
  const collections = ['demo_regions', 'demo_stores', 'demo_devices', 'demo_sponsors', 'demo_campaigns', 'demo_playbackLogs'];
  
  for (const colName of collections) {
    progressCallback(`Purging ${colName}...`);
    const snap = await getDocs(collection(db, colName));
    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 400) {
        chunks.push(snap.docs.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
  }
  progressCallback("Demo environment wiped.");
}