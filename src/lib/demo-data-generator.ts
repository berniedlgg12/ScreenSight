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
  const batchSize = 100; // Reducido para mayor estabilidad
  
  try {
      // 1. Regiones
      progressCallback("Generando Regiones...");
      let regionBatch = writeBatch(db);
      DEMO_REGIONS.forEach(reg => {
        const ref = doc(db, 'demo_regions', reg.id);
        regionBatch.set(ref, { 
            ...reg, 
            enabled: true, 
            playbackStart: "08:00", 
            playbackEnd: "22:00", 
            timezone: "America/Mexico_City", 
            createdAt: Date.now() 
        });
      });
      await regionBatch.commit();

      // 2. Sponsors
      progressCallback("Configurando Patrocinadores...");
      let sponsorBatch = writeBatch(db);
      const sponsorIds: string[] = [];
      DEMO_SPONSORS.forEach((sp, i) => {
        const id = `demo-sp-${i}`;
        sponsorIds.push(id);
        const ref = doc(db, 'demo_sponsors', id);
        sponsorBatch.set(ref, { ...sp, id, negotiatedCPM: 18.5, status: 'active', createdAt: Date.now() });
      });
      await sponsorBatch.commit();

      // 3. Tiendas (Reducido a 500 para el MVP inicial si 1800 falla, pero mantendremos la lógica escalable)
      progressCallback("Mapeando 1,800 Nodos en México...");
      const storesPerState = 56; // 56 * 32 = 1792 aprox
      let totalStoresCreated = 0;
      let currentBatch = writeBatch(db);
      const storeIds: string[] = [];

      for (const state of mexicanStates) {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        const stateCode = state.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0,3).toUpperCase();

        for (let i = 1; i <= storesPerState; i++) {
          const storeId = `${stateCode}-${i.toString().padStart(3, '0')}`;
          storeIds.push(storeId);
          const ref = doc(db, 'demo_stores', storeId);
          
          currentBatch.set(ref, {
            id: storeId,
            name: `Coppel ${state} ${i}`,
            state,
            city: `Ciudad ${stateCode}`,
            regionId: region.id,
            status: 'active',
            dailyTraffic: Math.floor(Math.random() * 2000) + 500,
            createdAt: Date.now()
          });
          
          totalStoresCreated++;

          if (totalStoresCreated % batchSize === 0) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            progressCallback(`Tiendas creadas: ${totalStoresCreated} / 1800`);
          }
        }
      }
      await currentBatch.commit();

      // 4. Dispositivos (Solo crearemos 2000 reales para no saturar, el Dashboard los escalará visualmente)
      progressCallback("Instalando Flota Digital...");
      let deviceCount = 0;
      currentBatch = writeBatch(db);
      
      for (let i = 0; i < 2000; i++) {
        const storeId = storeIds[i % storeIds.length];
        const deviceId = `${storeId}-${(Math.floor(i/storeIds.length) + 1).toString().padStart(3, '0')}`;
        const ref = doc(db, 'demo_devices', deviceId);
        
        const rand = Math.random();
        const isOnline = rand > 0.05;

        currentBatch.set(ref, {
          id: deviceId,
          name: `Display ${i % 5 + 1}`,
          storeId,
          regionId: DEMO_REGIONS.find(r => r.id === storeId.split('-')[0])?.id || 'centro',
          status: isOnline ? 'online' : 'offline',
          connectionStatus: isOnline ? 'active' : 'disconnected',
          lastHeartbeat: isOnline ? Date.now() - (Math.random() * 20000) : Date.now() - (Math.random() * 1000000),
          todayStats: { totalPlaybacks: Math.floor(Math.random() * 150) + 50 },
          currentPlaybackMode: 'regional-merged',
          updatedAt: Date.now()
        });
        
        deviceCount++;

        if (deviceCount % batchSize === 0) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          progressCallback(`Smart TVs activas: ${deviceCount} / 2000`);
        }
      }
      await currentBatch.commit();

      // 5. Campañas Anuales
      progressCallback("Inyectando Historial de Campañas...");
      currentBatch = writeBatch(db);
      for (let i = 0; i < 15; i++) {
        const sponsor = DEMO_SPONSORS[i % DEMO_SPONSORS.length];
        const id = `demo-camp-${i}`;
        const ref = doc(db, 'demo_campaigns', id);
        
        const target = 1000000 + (Math.random() * 4000000);
        const delivered = Math.floor(target * (0.4 + Math.random() * 0.6));

        currentBatch.set(ref, {
          id,
          name: `${sponsor.name} Campaign ${i + 1}`,
          sponsorId: `demo-sp-${i % DEMO_SPONSORS.length}`,
          brandName: sponsor.name,
          status: 'active',
          targetImpressions: Math.floor(target),
          deliveredImpressions: Math.floor(delivered),
          targetPlaybacks: Math.floor(target / 2.5),
          deliveredPlaybacks: Math.floor(delivered / 2.5),
          budget: (target / 1000) * 18.5,
          startDate: Date.now() - (60 * 24 * 60 * 60 * 1000),
          endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
          targetRegions: DEMO_REGIONS.map(r => r.id),
          priority: 'normal',
          createdAt: Date.now()
        });
      }
      await currentBatch.commit();

      progressCallback("Simulación lista: Modo Demo Activo.");
  } catch (error) {
      console.error("Error crítico en generación demo:", error);
      throw error;
  }
}

export async function clearDemoDataset(progressCallback: (msg: string) => void) {
  const collections = ['demo_regions', 'demo_stores', 'demo_devices', 'demo_sponsors', 'demo_campaigns', 'demo_playbackLogs'];
  
  for (const colName of collections) {
    progressCallback(`Limpiando ${colName}...`);
    const snap = await getDocs(collection(db, colName));
    
    let deleteBatch = writeBatch(db);
    let count = 0;
    
    for (const doc of snap.docs) {
        deleteBatch.delete(doc.ref);
        count++;
        if (count % 100 === 0) {
            await deleteBatch.commit();
            deleteBatch = writeBatch(db);
        }
    }
    await deleteBatch.commit();
  }
  progressCallback("Entorno demo purgado.");
}
