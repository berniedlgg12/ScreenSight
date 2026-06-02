'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Store } from '@/lib/types';

interface StoreSelectorProps {
  stores: Store[];
  onSelect: (store: Store) => void;
  selectedId?: string;
}

export function StoreSelector({ stores, onSelect, selectedId }: StoreSelectorProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-bold h-11 border-primary/20 bg-background hover:bg-muted/50"
        >
          {selectedId
            ? stores.find((s) => s.id === selectedId)?.name
            : "Buscar Sucursal..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}>
          <CommandInput placeholder="ID o Nombre de Tienda..." className="font-medium" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-xs font-bold uppercase opacity-50">
              No se encontró la sucursal.
            </CommandEmpty>
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={`${store.id} ${store.name}`}
                  onSelect={() => {
                    onSelect(store);
                    setOpen(false);
                  }}
                  className="cursor-pointer py-3"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-primary",
                      selectedId === store.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-sm uppercase tracking-tight">{store.name}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                        {store.id} — {store.city}, {store.state}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
