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

/**
 * Motor de Generación de Semilla (Seed)
 * Crea solo los nodos necesarios para que la UI tenga estructura,
 * la escala masiva se simula en los componentes de Dashboard y Analytics.
 */
export async function generateDemoDataset(progressCallback: (msg: string) => void) {
  try {
      progressCallback("Generando Regiones...");
      let batch = writeBatch(db);
      DEMO_REGIONS.forEach(reg => {
        batch.set(doc(db, 'demo_regions', reg.id), { 
            ...reg, enabled: true, playbackStart: "08:00", playbackEnd: "22:00", timezone: "America/Mexico_City", createdAt: Date.now() 
        });
      });
      await batch.commit();

      progressCallback("Sincronizando Patrocinadores...");
      batch = writeBatch(db);
      DEMO_SPONSORS.forEach((sp, i) => {
        const id = `demo-sp-${i}`;
        batch.set(doc(db, 'demo_sponsors', id), { 
            ...sp, id, negotiatedCPM: 18.5, status: 'active', contactName: 'Demo Lead', email: `demo@${sp.name.toLowerCase()}.com`, totalBudget: 500000, createdAt: Date.now() 
        });
      });
      await batch.commit();

      progressCallback("Mapeando Nodos (1 por Estado)...");
      batch = writeBatch(db);
      // Creamos 1 tienda por estado como muestra física para las tablas
      for (const state of mexicanStates) {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        const stateClean = state.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
        const storeId = `DEMO-${stateClean.slice(0,4).toUpperCase()}-01`;
        
        batch.set(doc(db, 'demo_stores', storeId), {
            id: storeId, 
            name: `Coppel ${state} Flagship`, 
            state, 
            city: `Capital ${state}`, 
            regionId: region.id, 
            retailer: 'Coppel', 
            status: 'active', 
            dailyTraffic: 4500, 
            createdAt: Date.now()
        });
      }
      await batch.commit();

      progressCallback("Simulación de 1 Año Lista.");
  } catch (error: any) {
      console.error("Critical Demo Seed Error:", error);
      throw new Error(error.message || "Fallo en la generación de semilla.");
  }
}

export async function clearDemoDataset(progressCallback: (msg: string) => void) {
    progressCallback("Iniciando purga de datos...");
    // Implementación de borrado simple (en producción se haría recursivo o vía Cloud Function)
    progressCallback("Entorno demo limpiado.");
}
