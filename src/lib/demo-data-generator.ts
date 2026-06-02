/**
 * Motor de Simulación Virtual para ScreenSight
 * Genera datos masivos en memoria para evitar saturar Firestore y evadir errores de permisos.
 */

import { mexicanStates } from './mexican-states';
import type { Store, Device, Region, Sponsor, Campaign, Media } from './types';

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
  { name: 'Samsung', industry: 'Consumer Electronics', spots: ['Galaxy S26 Launch 15s', 'Neo QLED Expo'] },
  { name: 'LG', industry: 'Consumer Electronics', spots: ['OLED Weekend Promo 30s', 'InstaView Kitchen'] },
  { name: 'Motorola', industry: 'Mobile', spots: ['Edge 50 Ultra Reveal'] },
  { name: 'Telcel', industry: 'Telecommunications', spots: ['Red 5G Nacional 30s', 'Amigo Kit Promo'] },
  { name: 'AT&T', industry: 'Telecommunications', spots: ['AT&T Conecta 20s'] },
  { name: 'Movistar', industry: 'Telecommunications', spots: ['Movistar Cloud Promo'] },
  { name: 'BBVA', industry: 'Banking', spots: ['App BBVA Beneficios'] },
  { name: 'Banorte', industry: 'Banking', spots: ['Banorte Móvil Promo'] },
  { name: 'Santander', industry: 'Banking', spots: ['Santander Like U'] },
  { name: 'Mercado Pago', industry: 'Fintech', spots: ['QR Promo 20s', 'Préstamos Personales'] },
  { name: 'Netflix', industry: 'Streaming', spots: ['Stranger Things New Season', 'Squid Game S2'] },
  { name: 'Disney+', industry: 'Streaming', spots: ['Family Plan Promo 15s', 'Marvel Collection'] },
  { name: 'Spotify', industry: 'Streaming', spots: ['Spotify Premium Duo'] },
  { name: 'Coca-Cola', industry: 'Beverages', spots: ['Verano Sin Fin 15s', 'Coca-Cola No Sugar'] },
  { name: 'Pepsi', industry: 'Beverages', spots: ['Pepsi Black Challenge'] },
  { name: 'Nestlé', industry: 'CPG', spots: ['KitKat Take a Break'] },
  { name: 'L’Oréal', industry: 'Beauty', spots: ['Revitalift Night Spot'] },
  { name: 'Nike', industry: 'Apparel', spots: ['Back to School 10s', 'Air Max Day'] },
  { name: 'Adidas', industry: 'Apparel', spots: ['Run for the Oceans'] },
  { name: 'Apple', industry: 'Technology', spots: ['iPhone 16 Pro Reveal', 'MacBook Air M3'] },
  { name: 'Huawei', industry: 'Technology', spots: ['Watch GT5 Promo'] },
  { name: 'Xiaomi', industry: 'Technology', spots: ['Redmi Note 14 Series'] },
  { name: 'Coppel', industry: 'Retail', spots: ['Mejora tu Hogar', 'Motos en Oferta'] },
  { name: 'BanCoppel', industry: 'Banking', spots: ['Crédito Personal 20s', 'Tarjeta de Débito'] },
  { name: 'Afore Coppel', industry: 'Finanzas', spots: ['Tu Futuro Hoy'] },
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
        id: `demo-sp-${i}`,
        name: s.name,
        industry: s.industry,
        negotiatedCPM: 18.5,
        status: 'active',
        contactName: 'Demo Lead',
        email: `contact@${s.name.toLowerCase().replace(/\s/g, '')}.com`,
        phone: '555-000-0000',
        totalBudget: 1500000,
        createdAt: Date.now()
    }));

    const media: Media[] = [];
    DEMO_SPONSORS_META.forEach((s, sIdx) => {
        s.spots.forEach((spotName, spotIdx) => {
            media.push({
                id: `demo-media-${sIdx}-${spotIdx}`,
                title: spotName,
                fileName: `${spotName.toLowerCase().replace(/\s/g, '_')}.mp4`,
                downloadURL: `https://picsum.photos/seed/${sIdx}${spotIdx}/1920/1080`,
                sponsorId: `demo-sp-${sIdx}`,
                sponsorName: s.name,
                duration: spotName.includes('30s') ? 30 : 15,
                status: 'active',
                type: 'video',
                createdAt: Date.now()
            });
        });
    });

    const stores: Store[] = [];
    const devices: Device[] = [];
    
    // Generador de Tiendas (1,800 unidades distribuidas)
    mexicanStates.forEach((state, stateIndex) => {
        const region = DEMO_REGIONS.find(r => r.states.includes(state)) || DEMO_REGIONS[4];
        
        // Generamos ~56 tiendas por estado para llegar a ~1,800
        for (let i = 0; i < 56; i++) {
            const storeIdx = stateIndex * 100 + i;
            const storeId = `ST-${state.substring(0, 3).toUpperCase()}-${i.toString().padStart(3, '0')}`;
            
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

            // Generamos dispositivos solo para una muestra (Primeras 250 tiendas para no saturar memoria)
            if (stores.length < 250) { 
                for (let j = 0; j < 3; j++) {
                    const rand = Math.random();
                    let lastHeartbeat = 0;
                    let healthTag = 'h-online';

                    if (rand < 0.92) {
                        lastHeartbeat = Date.now() - Math.floor(Math.random() * 25000);
                        healthTag = 'h-online';
                    } else if (rand < 0.97) {
                        lastHeartbeat = Date.now() - (40000 + Math.floor(Math.random() * 15000));
                        healthTag = 'h-unstable';
                    } else {
                        lastHeartbeat = Date.now() - (70000 + Math.floor(Math.random() * 1000000));
                        healthTag = 'h-offline';
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
                        driftSeconds: Math.random() * 1.2,
                        currentOffset: Math.random() * 540,
                        lastCommandStatus: 'success',
                        lastCommandReceived: `cmd-init-${deviceId}`,
                        tags: [healthTag]
                    } as any);
                }
            }
        }
    });

    const campaigns: Campaign[] = sponsors.slice(0, 20).map((sp, i) => {
        const statuses: Campaign['status'][] = ['active', 'active', 'completed', 'active', 'scheduled'];
        const status = statuses[i % statuses.length];
        
        // Pacing realism
        let completion = 0.5;
        if (status === 'completed') completion = 1.0;
        if (i % 3 === 0) completion = 0.94; // On track
        if (i % 5 === 0) completion = 0.12; // Just started
        
        const targetPlays = 2000000;
        const deliveredPlays = Math.floor(targetPlays * completion);
        const targetImps = targetPlays * 2.5;
        const deliveredImps = Math.floor(targetImps * completion);

        return {
            id: `demo-camp-${i}`,
            name: `${sp.name} - ${i % 2 === 0 ? 'Campaña Nacional' : 'Promo Regional'} 2025`,
            sponsorId: sp.id,
            brandName: sp.name,
            status: status,
            startDate: new Date(2024, 0, 1),
            endDate: new Date(2025, 11, 31),
            targetImpressions: targetImps,
            deliveredImpressions: deliveredImps,
            targetPlaybacks: targetPlays,
            deliveredPlaybacks: deliveredPlays,
            budget: 150000,
            cpm: 18.5,
            priority: i % 4 === 0 ? 'high' : 'normal',
            targetRegions: DEMO_REGIONS.map(r => r.id),
            mediaIds: [`demo-media-${i}-0`],
            createdAt: Date.now(),
            updatedAt: Date.now()
        } as any;
    });

    return { regions, sponsors, stores, devices, campaigns, media };
}

export async function generateDemoDataset(progressCallback: (msg: string) => void) {
    progressCallback("Preparando simulación virtual...");
    await new Promise(r => setTimeout(r, 600));
    progressCallback("Configurando 1,800 nodos nacionales...");
    await new Promise(r => setTimeout(r, 500));
    progressCallback("Inyectando 25 marcas y sus campañas...");
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
