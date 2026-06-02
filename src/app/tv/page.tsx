'use client';
import { Suspense } from 'react';
import { TvPlayer } from '@/components/tv/TvPlayer';

/**
 * TV Player Route
 * 
 * Accessible at:
 * - https://dlg.cc/tv
 * - https://dlg.cc/tv?id=DEVICE_ID
 */
export default function TvClientPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <TvPlayer />
    </Suspense>
  );
}
