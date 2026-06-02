import { db, storage } from '../src/lib/firebase.js'; // Ajustar ruta según tu estructura local
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * MOTOR DE FUSIÓN LOCAL (FFmpeg)
 * 
 * Este script se ejecuta en tu Mac.
 * Uso: node scripts/generate-merged-video.mjs REGION_ID DATE
 */

async function main() {
  const regionId = process.argv[2];
  const date = process.argv[3] || new Date().toISOString().split('T')[0];

  if (!regionId) {
    console.error("Uso: node generate-merged-video.mjs <regionId> [date]");
    process.exit(1);
  }

  const playlistId = `${regionId}_${date}`;
  const playlistRef = doc(db, 'generatedPlaylists', playlistId);
  
  console.log(`\n=== INICIANDO MERGE: ${playlistId} ===`);

  try {
    const snap = await getDoc(playlistRef);
    if (!snap.exists()) throw new Error(`Documento ${playlistId} no encontrado.`);
    
    const data = snap.data();
    const items = data.playlistItems || [];

    if (items.length === 0) throw new Error("La playlist no tiene ítems.");

    const tempDir = path.join(process.cwd(), 'temp', playlistId);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const localFiles = [];

    // 1. DESCARGA
    console.log(`Descargando ${items.length} clips...`);
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const localPath = path.join(tempDir, `clip_${i}.mp4`);
        const response = await axios({ url: item.downloadURL, method: 'GET', responseType: 'stream' });
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        await new Promise((resolve) => writer.on('finish', resolve));
        localFiles.push(localPath);
    }

    // 2. NORMALIZACIÓN Y FUSIÓN (FFmpeg)
    console.log("Normalizando y uniendo con FFmpeg (1080p)...");
    const listPath = path.join(tempDir, 'files.txt');
    const fileContent = localFiles.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listPath, fileContent);

    const outputPath = path.join(tempDir, 'merged_output.mp4');
    // Forzamos escalado y bitrate para asegurar compatibilidad con TVs
    const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -s 1920x1080 -r 30 -c:a aac -b:a 128k "${outputPath}"`;
    execSync(ffmpegCmd, { stdio: 'inherit' });

    // 3. CARGA A STORAGE
    console.log("Subiendo archivo fusionado...");
    const storagePath = data.storagePath || `generatedPlaylists/${regionId}/${date}/merged_${Date.now()}.mp4`;
    const storageRef = ref(storage, storagePath);
    const fileBuffer = fs.readFileSync(outputPath);
    await uploadBytes(storageRef, fileBuffer);
    const downloadURL = await getDownloadURL(storageRef);

    // 4. ACTUALIZACIÓN DE ESTADOS (CRÍTICO)
    const now = Date.now();
    const actualDuration = items.reduce((s, p) => s + (p.duration || 30), 0);

    // Actualizar Playlist Individual
    await updateDoc(playlistRef, {
        status: 'ready',
        mergedVideoUrl: downloadURL,
        mergedDuration: actualDuration,
        syncStartTime: now,
        updatedAt: now
    });

    // Actualizar Configuración Global (Esto hace que el Dashboard se ponga verde y la TV cambie)
    const globalRef = doc(db, 'playback', 'global');
    await updateDoc(globalRef, {
        [`regionConfigs.${regionId}.status`]: 'ready',
        [`regionConfigs.${regionId}.currentVideoURL`]: downloadURL,
        [`regionConfigs.${regionId}.version`]: data.version || 1,
        [`regionConfigs.${regionId}.updatedAt`]: now
    });

    console.log(`\n✅ ÉXITO: ${regionId} está ONLINE.`);
    console.log(`URL: ${downloadURL}\n`);

    // Limpieza
    fs.rmSync(tempDir, { recursive: true, force: true });

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    await updateDoc(playlistRef, { status: 'failed', errorMessage: error.message });
    process.exit(1);
  }
}

main();