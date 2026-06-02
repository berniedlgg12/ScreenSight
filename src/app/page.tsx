'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Root Page Redirect Logic
 * 
 * - https://dlg.cc/ -> redirects to /dashboard (Admin)
 * - https://dlg.cc/?id=DEVICE_ID -> redirects to /tv?id=DEVICE_ID (TV Player)
 */
function RootRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const deviceId = searchParams.get('id');
    
    if (deviceId) {
      // If a specific device ID is provided via query param at root,
      // we assume it's a TV screen following a short link.
      router.replace(`/tv?id=${deviceId}`);
    } else {
      // Otherwise, the root domain acts as the entry point for admins.
      router.replace('/dashboard');
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}

export default function RootPage() {
  return (
    <Suspense fallback={null}>
      <RootRedirect />
    </Suspense>
  );
}
