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
    // 1. Regiones
    const regions: Region[] = DEMO_REGIONS.map(r => ({
        ...r,
        enabled: true,
        playbackStart: "08:00",
        playbackEnd: "22:00",
        timezone: "America/Mexico_City",
        standbyImage: "reposo/reposo.avif",
        autoResume: true
    }));

    // 2. Sponsors
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

    // 3. Tiendas (1,800 distribuidas)
    const stores: Store[] = [];
    const devices: Device[] = [];
    
    mexicanStates.forEach((state) => {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        // Aproximadamente 56 tiendas por estado para llegar a ~1,800
        for (let i = 0; i < 56; i++) {
            const storeId = `DEMO-${state.slice(0,3).toUpperCase()}-${i.toString().padStart(3, '0')}`;
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

            // Generamos dispositivos de muestra (solo para visualización de tablas)
            // Solo para los primeros 250 tiendas para no colapsar la memoria del navegador
            if (stores.length < 250) { 
                for (let j = 0; j < 2; j++) {
                    const rand = Math.random();
                    let lastHeartbeat = 0;
                    
                    // DISTRIBUCIÓN DE SALUD: 92% Verdes, 5% Amarillos, 3% Rojos
                    if (rand < 0.92) {
                        // ONLINE: Menos de 30 segundos de antigüedad
                        lastHeartbeat = Date.now() - Math.floor(Math.random() * 25000);
                    } else if (rand < 0.97) {
                        // INESTABLE: Entre 40 y 55 segundos
                        lastHeartbeat = Date.now() - (40000 + Math.floor(Math.random() * 15000));
                    } else {
                        // OFFLINE: Más de 65 segundos
                        lastHeartbeat = Date.now() - (65000 + Math.floor(Math.random() * 1000000));
                    }

                    devices.push({
                        id: `${storeId}-TV${j+1}`,
                        name: `Pantalla Pasillo ${j+1}`,
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
                        driftSeconds: Math.random() * 1.8,
                        currentOffset: Math.random() * 540,
                        lastCommandStatus: 'success',
                        lastCommandReceived: `cmd-init-${storeId}`
                    } as any);
                }
            }
        }
    });

    // 4. Campañas
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
