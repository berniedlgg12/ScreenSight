'use client';

import { useState, useMemo } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { StoreControls } from '@/components/controls/StoreControls';
import { StoreSelector } from '@/components/controls/StoreSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gamepad2, Loader2 } from 'lucide-react';
import type { Store } from '@/lib/types';

export default function ControlesPage() {
  const { stores, loading } = useFleet();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // EXTREMELY IMPORTANT: We find the store in the reactive 'stores' array 
  // to ensure the UI updates in real-time when stores/{id}.tvCommand changes.
  const activeStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return stores.find(s => s.id === selectedStoreId) || null;
  }, [selectedStoreId, stores]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground uppercase font-black tracking-widest text-xs">Cargando Consola de Mando...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/10">
      <div className="p-4 md:p-8 border-b bg-background shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Gamepad2 className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Mando de Operaciones</h1>
                    <p className="text-muted-foreground text-sm font-medium">Control directo de Smart TVs por nodo de venta.</p>
                </div>
            </div>
            <div className="w-80">
                <StoreSelector 
                    stores={stores} 
                    onSelect={(s) => setSelectedStoreId(s.id)} 
                    selectedId={selectedStoreId || undefined} 
                />
            </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto w-full">
            {activeStore ? (
                <StoreControls store={activeStore} />
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] border-4 border-dashed rounded-3xl opacity-40">
                    <Gamepad2 className="h-24 w-24 mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Selecciona una Tienda</h2>
                    <p className="text-sm font-medium">Utiliza el buscador superior para activar la consola de la sucursal.</p>
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
