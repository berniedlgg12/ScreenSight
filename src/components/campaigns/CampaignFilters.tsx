'use client';

import { useMemo } from 'react';
import type { Campaign } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CampaignStatus } from '@/lib/types';

interface CampaignFiltersProps {
  campaigns: Campaign[];
  filters: { brand: string; status: string };
  setFilters: (filters: { brand: string; status: string }) => void;
}

export function CampaignFilters({ campaigns, filters, setFilters }: CampaignFiltersProps) {
  const brands = useMemo(() => [...new Set(campaigns.map(c => c.brandName))].sort(), [campaigns]);
  const statuses = useMemo(() => [...new Set(campaigns.map(c => c.status as CampaignStatus))].sort(), [campaigns]);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <Label>Brand:</Label>
        <Select
          value={filters.brand}
          onValueChange={(value) => setFilters({ ...filters, brand: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label>Status:</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{capitalize(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
