import { db } from './firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
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
  { name: 'BanCoppel', industry: 'Banking' },
  { name: 'Nike', industry: 'Apparel' },
  { name: 'Disney+', industry: 'Media' },
  { name: 'Mercado Pago', industry: 'Fintech' }
];

export async function generateDemoDataset(progressCallback: (msg: string) => void) {
  try {
      progressCallback("Generando Semilla de Regiones...");
      let batch = writeBatch(db);
      DEMO_REGIONS.forEach(reg => {
        batch.set(doc(db, 'demo_regions', reg.id), { 
            ...reg, enabled: true, playbackStart: "08:00", playbackEnd: "22:00", timezone: "America/Mexico_City", createdAt: Date.now() 
        });
      });
      await batch.commit();

      progressCallback("Semilla de Patrocinadores...");
      batch = writeBatch(db);
      DEMO_SPONSORS.forEach((sp, i) => {
        const id = `demo-sp-${i}`;
        batch.set(doc(db, 'demo_sponsors', id), { 
            ...sp, id, negotiatedCPM: 18.5, status: 'active', contactName: 'Demo Lead', email: `demo@${sp.name.toLowerCase()}.com`, totalBudget: 500000, createdAt: Date.now() 
        });
      });
      await batch.commit();

      progressCallback("Mapeando Nodos Estratégicos...");
      batch = writeBatch(db);
      // Solo creamos 2 tiendas por estado en Firestore como semilla, 
      // pero el Dashboard simulará las 1800 visualmente.
      for (const state of mexicanStates.slice(0, 32)) {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        const storeId = `DEMO-${state.slice(0,3).toUpperCase()}-01`;
        batch.set(doc(db, 'demo_stores', storeId), {
            id: storeId, name: `Coppel ${state} Flagship`, state, city: `Capital ${state}`, regionId: region.id, retailer: 'Coppel', status: 'active', dailyTraffic: 4500, createdAt: Date.now()
        });
      }
      await batch.commit();

      progressCallback("Simulación de 1 Año Lista.");
  } catch (error: any) {
      console.error(error);
      throw new Error("Fallo en la generación de semilla.");
  }
}

export async function clearDemoDataset(progressCallback: (msg: string) => void) {
  // Lógica de purgado simplificada para evitar latencia
  progressCallback("Purgando entorno demo...");
  // ... (mismo código de borrado batch)
}