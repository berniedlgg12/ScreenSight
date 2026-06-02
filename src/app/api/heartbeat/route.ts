import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { 
        deviceId, 
        currentPlaybackMode, 
        currentContent, 
        lastSeenUrl,
        driftSeconds,
        currentOffset,
        currentPlaylistId
    } = payload;

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    const deviceRef = doc(db, 'devices', deviceId);
    const now = Date.now();

    // CRITICAL: We ONLY update telemetry fields. 
    // We NEVER overwrite storeId, regionId, or name to prevent data loss.
    await updateDoc(deviceRef, {
        lastHeartbeat: now,
        status: 'online',
        connectionStatus: 'active',
        playbackMode: currentPlaybackMode || 'standalone',
        currentPlaybackMode: currentPlaybackMode || 'standalone',
        currentContentId: currentContent || 'none',
        currentPlaylistId: currentPlaylistId || null,
        lastSeenUrl: lastSeenUrl || '',
        driftSeconds: driftSeconds || 0,
        currentOffset: currentOffset || 0,
        updatedAt: now
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Failed to process heartbeat' }, { status: 500 });
  }
}
