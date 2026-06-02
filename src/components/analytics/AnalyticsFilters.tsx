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
import { CalendarIcon, MapPin, Briefcase, Target, Clock } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Campaign, Store } from '@/lib/types';

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
    <div className="bg-background border border-primary/10 p-4 rounded-2xl shadow-sm flex flex-wrap items-center gap-6">
        {/* Date Range */}
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1">Timeframe</span>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-[240px] justify-start text-left font-bold h-9 bg-muted/20 border-none shadow-none",
                        !filters.dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
                        {filters.dateRange?.from ? (
                        filters.dateRange.to ? (
                            <span className="text-xs">
                            {format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}
                            </span>
                        ) : (
                            <span className="text-xs">{format(filters.dateRange.from, "LLL dd, y")}</span>
                        )
                        ) : (
                        <span className="text-xs">Pick a date range</span>
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
        </div>

        <div className="h-10 w-px bg-primary/10 hidden md:block" />

        {/* Brand */}
        <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1">Advertiser</span>
                <Select
                    value={filters.brand}
                    onValueChange={(value) => setFilters({ ...filters, brand: value, campaign: 'all' })}
                >
                    <SelectTrigger className="w-[160px] h-9 font-bold bg-muted/20 border-none shadow-none text-xs">
                        <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Network Wide</SelectItem>
                        {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Campaign */}
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1">Campaign Target</span>
                <Select
                    value={filters.campaign}
                    onValueChange={(value) => setFilters({ ...filters, campaign: value })}
                >
                    <SelectTrigger className="w-[200px] h-9 font-bold bg-muted/20 border-none shadow-none text-xs">
                        <SelectValue placeholder="All Campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Active Targets</SelectItem>
                        {campaigns
                            .filter(c => filters.brand === 'all' || c.brandName === filters.brand)
                            .map(campaign => (
                                <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                            ))
                        }
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        {/* Store */}
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1">Retail Node</span>
                <Select
                    value={filters.store}
                    onValueChange={(value) => setFilters({ ...filters, store: value })}
                >
                    <SelectTrigger className="w-[200px] h-9 font-bold bg-muted/20 border-none shadow-none text-xs">
                        <SelectValue placeholder="All Stores" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">National Fleet</SelectItem>
                        {stores.slice(0, 100).map(store => (
                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    </div>
  );
}
