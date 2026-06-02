"use client";
import type { Store } from '@/lib/types';
import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface FiltersProps {
  stores: Store[];
  filters: { store: string; status: string; state: string };
  setFilters: (filters: { store: string; status: string; state: string }) => void;
}

export function Filters({ stores, filters, setFilters }: FiltersProps) {

  const states = useMemo(() => [...new Set(stores.map(s => s.state))].sort(), [stores]);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-4 p-4 border rounded-lg">
       <div className="flex items-center gap-2">
        <Label>State:</Label>
        <Select
          value={filters.state}
          onValueChange={(value) => setFilters({ ...filters, state: value, store: 'all' })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label>Store:</Label>
        <Select
          value={filters.store}
          onValueChange={(value) => setFilters({ ...filters, store: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores.filter(store => filters.state === 'all' || store.state === filters.state).map(store => (
              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <Label>Status:</Label>
        <RadioGroup
          defaultValue="all"
          className="flex items-center space-x-2"
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="r1" />
            <Label htmlFor="r1">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="online" id="r2" />
            <Label htmlFor="r2">Online</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="offline" id="r3" />
            <Label htmlFor="r3">Offline</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
