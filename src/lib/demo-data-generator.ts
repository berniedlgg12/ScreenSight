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
  const batchSize = 50; // Lotes más pequeños para mayor fiabilidad
  
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
        sponsorBatch.set(ref, { 
            ...sp, 
            id, 
            negotiatedCPM: 18.5, 
            status: 'active', 
            contactName: 'Demo Lead',
            email: `demo@${sp.name.toLowerCase().replace(/\s/g, '')}.com`,
            phone: '555-0000',
            totalBudget: 50000,
            createdAt: Date.now() 
        });
      });
      await sponsorBatch.commit();

      // 3. Tiendas (Reducido para asegurar que los permisos no bloqueen por cuotas)
      progressCallback("Mapeando Nodos en México...");
      const storesPerState = 15; // Reducido para mayor estabilidad en el primer despliegue
      let totalStoresCreated = 0;
      let currentBatch = writeBatch(db);
      const storeIds: string[] = [];

      for (const state of mexicanStates) {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        const stateCode = state.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0,3).toUpperCase().replace(/[^A-Z]/g, '');

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
            retailer: 'Coppel',
            status: 'active',
            dailyTraffic: Math.floor(Math.random() * 2000) + 500,
            createdAt: Date.now()
          });
          
          totalStoresCreated++;

          if (totalStoresCreated % batchSize === 0) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            progressCallback(`Tiendas creadas: ${totalStoresCreated}`);
          }
        }
      }
      await currentBatch.commit();

      // 4. Dispositivos
      progressCallback("Instalando Flota Digital...");
      let deviceCount = 0;
      currentBatch = writeBatch(db);
      
      // Creamos 2 dispositivos por tienda generada
      for (let i = 0; i < storeIds.length * 2; i++) {
        const storeId = storeIds[Math.floor(i / 2)];
        const deviceId = `${storeId}-${(i % 2 + 1).toString().padStart(3, '0')}`;
        const ref = doc(db, 'demo_devices', deviceId);
        
        const isOnline = Math.random() > 0.1;

        currentBatch.set(ref, {
          id: deviceId,
          name: `Display ${i % 2 + 1}`,
          storeId,
          regionId: DEMO_REGIONS.find(r => r.states.some(s => storeId.startsWith(s.slice(0,1))))?.id || 'centro',
          status: isOnline ? 'online' : 'offline',
          connectionStatus: isOnline ? 'active' : 'disconnected',
          lastHeartbeat: isOnline ? Date.now() - (Math.random() * 20000) : Date.now() - (Math.random() * 1000000),
          todayStats: { totalPlaybacks: Math.floor(Math.random() * 150) + 50 },
          currentPlaybackMode: 'regional-merged',
          resolution: '1920x1080',
          orientation: 'landscape',
          updatedAt: Date.now()
        });
        
        deviceCount++;

        if (deviceCount % batchSize === 0) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          progressCallback(`Smart TVs: ${deviceCount}`);
        }
      }
      await currentBatch.commit();

      // 5. Campañas
      progressCallback("Generando Campañas...");
      currentBatch = writeBatch(db);
      for (let i = 0; i < 10; i++) {
        const sponsor = DEMO_SPONSORS[i % DEMO_SPONSORS.length];
        const id = `demo-camp-${i}`;
        const ref = doc(db, 'demo_campaigns', id);
        
        const target = 2000000;
        const delivered = Math.floor(target * (0.6 + Math.random() * 0.4));

        currentBatch.set(ref, {
          id,
          name: `${sponsor.name} Nacional Q${(i%4)+1}`,
          sponsorId: `demo-sp-${i % DEMO_SPONSORS.length}`,
          brandName: sponsor.name,
          status: 'active',
          targetImpressions: target,
          deliveredImpressions: delivered,
          targetPlaybacks: Math.floor(target / 2.5),
          deliveredPlaybacks: Math.floor(delivered / 2.5),
          budget: (target / 1000) * 18.5,
          startDate: Date.now() - (30 * 24 * 60 * 60 * 1000),
          endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
          targetRegions: DEMO_REGIONS.map(r => r.id),
          priority: 'normal',
          mediaIds: ['placeholder-id'],
          createdAt: Date.now()
        });
      }
      await currentBatch.commit();

      progressCallback("Simulación lista.");
  } catch (error: any) {
      console.error("Error crítico en generación demo:", error);
      throw new Error(error.message || "Fallo al escribir en Firestore. Revisa las reglas.");
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
  progressCallback("Purgado completado.");
}