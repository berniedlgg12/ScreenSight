
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { exec } from 'child_process';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

console.log('📡 ScreenSight Merge Watcher iniciado...');
console.log('Esperando trabajos de sincronización regional (pending_merge)...');

const query = db.collection('generatedPlaylists').where('status', '==', 'pending_merge');

query.onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added' || change.type === 'modified') {
      const data = change.doc.data();
      const regionId = data.regionId;
      const date = data.date;

      console.log(`\n======================================`);
      console.log(`🎯 TRABAJO DETECTADO: ${change.doc.id}`);
      console.log(`Región: ${regionId}`);
      console.log(`Fecha: ${date}`);
      console.log(`======================================`);

      const command = `node scripts/generate-merged-video.mjs ${regionId} ${date}`;
      
      const process = exec(command);

      process.stdout.on('data', data => {
        console.log(data.toString().trim());
      });

      process.stderr.on('data', data => {
        console.error('⚠️ [FFmpeg Log]:', data.toString().trim());
      });

      process.on('exit', code => {
        console.log(`\n🏁 Proceso de fusión terminado con código: ${code}`);
      });
    }
  });
}, err => {
  console.error('❌ Firestore Listen Error:', err);
});
