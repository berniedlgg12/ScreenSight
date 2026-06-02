'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Campaign, Store } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AnalyticsFiltersProps {
  campaigns: Campaign[];
  stores: Store[];
  filters: {
    dateRange: DateRange | undefined;
    brand: string;
    campaign: string;
    store: string;
  };
  setFilters: (filters: AnalyticsFiltersProps['filters']) => void;
}

export function AnalyticsFilters({ campaigns, stores, filters, setFilters }: AnalyticsFiltersProps) {
  const brands = [...new Set(campaigns.map(c => c.brandName))].sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row flex-wrap gap-4 items-center">
        {/* Date Range */}
        <div className="flex items-center gap-2">
            <Label>Date Range:</Label>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                        <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date range</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => setFilters({ ...filters, dateRange: range })}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-2">
            <Label>Brand:</Label>
            <Select
                value={filters.brand}
                onValueChange={(value) => setFilters({ ...filters, brand: value, campaign: 'all' })}
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

        {/* Campaign */}
        <div className="flex items-center gap-2">
            <Label>Campaign:</Label>
            <Select
                value={filters.campaign}
                onValueChange={(value) => setFilters({ ...filters, campaign: value })}
            >
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns
                        .filter(c => filters.brand === 'all' || c.brandName === filters.brand)
                        .map(campaign => (
                            <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                        ))
                    }
                </SelectContent>
            </Select>
        </div>
        
        {/* Store */}
        <div className="flex items-center gap-2">
            <Label>Store:</Label>
            <Select
                value={filters.store}
                onValueChange={(value) => setFilters({ ...filters, store: value })}
            >
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardContent>
    </Card>
  );
}
