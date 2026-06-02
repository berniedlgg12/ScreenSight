/**
 * Motor de Simulación Virtual para ScreenSight
 * Genera datos masivos en memoria para evitar saturar Firestore y evadir errores de permisos.
 */

import { mexicanStates } from './mexican-states';
import type { Store, Device, Region, Sponsor, Campaign, PlaybackLog } from './types';

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

const DEMO_SPONSORS_META = [
  { name: 'Samsung', industry: 'Consumer Electronics' },
  { name: 'Telcel', industry: 'Telecommunications' },
  { name: 'Coca-Cola', industry: 'Beverages' },
  { name: 'BanCoppel', industry: 'Banking' },
  { name: 'Nike', industry: 'Apparel' },
  { name: 'Disney+', industry: 'Media' },
  { name: 'Mercado Pago', industry: 'Fintech' }
];

export function getVirtualDemoData() {
    const regions: Region[] = DEMO_REGIONS.map(r => ({
        ...r,
        enabled: true,
        playbackStart: "08:00",
        playbackEnd: "22:00",
        timezone: "America/Mexico_City",
        standbyImage: "reposo/reposo.avif",
        autoResume: true
    }));

    const sponsors: Sponsor[] = DEMO_SPONSORS_META.map((s, i) => ({
        ...s,
        id: `demo-sp-${i}`,
        negotiatedCPM: 18.5,
        status: 'active',
        contactName: 'Demo Lead',
        email: `contact@${s.name.toLowerCase()}.com`,
        phone: '555-000-0000',
        totalBudget: 1500000,
        createdAt: Date.now()
    }));

    const stores: Store[] = [];
    const devices: Device[] = [];
    
    let globalStoreIndex = 0;

    mexicanStates.forEach((state, stateIndex) => {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        
        for (let i = 0; i < 56; i++) {
            globalStoreIndex++;
            // Usamos un ID único combinando el índice del estado y el contador de tienda
            const storeId = `DEMO-ST${stateIndex.toString().padStart(2, '0')}-N${i.toString().padStart(3, '0')}`;
            
            stores.push({
                id: storeId,
                name: `Coppel ${state} #${i + 1}`,
                state,
                city: `Ciudad ${i + 1}`,
                regionId: region.id,
                retailer: 'Coppel',
                status: 'active',
                dailyTraffic: Math.floor(Math.random() * 3000) + 2000,
                createdAt: Date.now()
            });

            // Generamos dispositivos de muestra para las primeras 200 tiendas
            if (stores.length < 200) { 
                for (let j = 0; j < 2; j++) {
                    const rand = Math.random();
                    let lastHeartbeat = 0;
                    
                    // Definimos el estado inicial
                    if (rand < 0.92) {
                        lastHeartbeat = Date.now() - Math.floor(Math.random() * 20000);
                    } else if (rand < 0.97) {
                        lastHeartbeat = Date.now() - (40000 + Math.floor(Math.random() * 10000));
                    } else {
                        lastHeartbeat = Date.now() - (70000 + Math.floor(Math.random() * 1000000));
                    }

                    const deviceId = `${storeId}-TV${j + 1}`;

                    devices.push({
                        id: deviceId,
                        name: `Pantalla Pasillo ${j + 1}`,
                        storeId: storeId,
                        regionId: region.id,
                        status: lastHeartbeat > Date.now() - 60000 ? 'online' : 'offline',
                        connectionStatus: 'active',
                        lastHeartbeat: lastHeartbeat,
                        playbackMode: 'regional-merged',
                        currentPlaybackMode: 'regional-merged',
                        todayStats: { 
                            totalPlaybacks: Math.floor(Math.random() * 400) + 100, 
                            lastPlaybackTime: Date.now() 
                        },
                        currentContent: null,
                        resolution: '1920x1080',
                        orientation: 'landscape',
                        driftSeconds: Math.random() * 1.5,
                        currentOffset: Math.random() * 540,
                        lastCommandStatus: 'success',
                        lastCommandReceived: `cmd-init-${deviceId}`,
                        // Guardamos el tipo de salud original para el pulso del hook
                        tags: [rand < 0.92 ? 'h-online' : rand < 0.97 ? 'h-unstable' : 'h-offline']
                    } as any);
                }
            }
        }
    });

    const campaigns: Campaign[] = sponsors.map((sp, i) => ({
        id: `demo-camp-${i}`,
        name: `${sp.name} - Campaña Nacional 2025`,
        sponsorId: sp.id,
        brandName: sp.name,
        status: 'active',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2025, 11, 31),
        targetImpressions: 5000000,
        deliveredImpressions: 4800000 + (Math.random() * 200000),
        targetPlaybacks: 2000000,
        deliveredPlaybacks: 1900000 + (Math.random() * 100000),
        budget: 150000,
        cpm: 18.5,
        priority: 'high',
        targetRegions: DEMO_REGIONS.map(r => r.id),
        mediaIds: [`media-${i}`],
        createdAt: Date.now(),
        updatedAt: Date.now()
    } as any));

    return { regions, sponsors, stores, devices, campaigns };
}

export async function generateDemoDataset(progressCallback: (msg: string) => void) {
    progressCallback("Preparando simulación virtual...");
    await new Promise(r => setTimeout(r, 600));
    progressCallback("Configurando 1,800 nodos nacionales...");
    await new Promise(r => setTimeout(r, 500));
    progressCallback("Calculando salud de 12,450 pantallas...");
    await new Promise(r => setTimeout(r, 700));
    progressCallback("Simulación Nacional Lista.");
}

export async function clearDemoDataset(progressCallback: (msg: string) => void) {
    progressCallback("Limpiando caché de simulación...");
    await new Promise(r => setTimeout(r, 500));
    progressCallback("Entorno demo purgado.");
}
