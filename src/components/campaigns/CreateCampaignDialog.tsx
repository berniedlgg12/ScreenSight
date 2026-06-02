'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, Media, Sponsor, Region } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Target, Loader2, Rocket, MapPin, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateCampaignDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function CreateCampaignDialog({ isOpen, setIsOpen }: CreateCampaignDialogProps) {
  const [name, setName] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [mediaId, setMediaId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetImpressions, setTargetImpressions] = useState('10000');
  const [cpm, setCpm] = useState('15.00');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [loading, setLoading] = useState(false);
  
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const unsubS = onSnapshot(collection(db, 'sponsors'), (s) => setSponsors(s.docs.map(d => ({id: d.id, ...d.data()} as any))));
    const unsubM = onSnapshot(collection(db, 'media'), (s) => setMediaItems(s.docs.map(d => ({id: d.id, ...d.data()} as any))));
    const unsubR = onSnapshot(collection(db, 'regions'), (s) => setRegions(s.docs.map(d => ({id: d.id, ...d.data()} as any))));
    return () => { unsubS(); unsubM(); unsubR(); };
  }, []);

  const budget = useMemo(() => {
    const imps = parseInt(targetImpressions, 10) || 0;
    const rate = parseFloat(cpm) || 0;
    return (imps / 1000) * rate;
  }, [targetImpressions, cpm]);

  const toggleRegion = (regionId: string) => {
    setSelectedRegions(prev => 
      prev.includes(regionId) ? prev.filter(id => id !== regionId) : [...prev, regionId]
    );
  };

  const handleSave = async () => {
    if (!name || !sponsorId || !mediaId || !startDate || !endDate || selectedRegions.length === 0) {
      toast({ 
        title: 'Missing Data', 
        description: 'Complete all mandatory fields, including at least one target region.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    const selectedSponsor = sponsors.find(s => s.id === sponsorId);

    const campaign: Omit<Campaign, 'id'> = {
      name,
      sponsorId,
      brandName: selectedSponsor?.name || 'Unknown',
      mediaIds: [mediaId],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      targetRegions: selectedRegions,
      status: 'active',
      targetImpressions: parseInt(targetImpressions, 10),
      deliveredImpressions: 0,
      targetPlaybacks: Math.floor(parseInt(targetImpressions, 10) / 2.5), 
      deliveredPlaybacks: 0,
      cpm: parseFloat(cpm),
      budget,
      priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
        await addDoc(collection(db, 'campaigns'), campaign);
        toast({ title: 'Campaign Launched', description: `Delivery targeted to ${selectedRegions.length} regions.` });
        setIsOpen(false);
        // Reset state
        setName('');
        setSponsorId('');
        setMediaId('');
        setSelectedRegions([]);
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to deploy campaign.', variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" /> Create Ad Delivery Target
          </DialogTitle>
          <DialogDescription>Define audience goals and regional distribution for the DOOH network.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Campaign Identifier</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q2 Electronics Promo" />
                    </div>
                    <div className="space-y-2">
                        <Label>Advertiser Sponsor</Label>
                        <Select value={sponsorId} onValueChange={setSponsorId}>
                            <SelectTrigger className="font-bold"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                            <SelectContent>
                                {sponsors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Playback Asset</Label>
                        <Select value={mediaId} onValueChange={setMediaId}>
                            <SelectTrigger className="font-bold"><SelectValue placeholder="Select Media" /></SelectTrigger>
                            <SelectContent>
                                {mediaItems.filter(m => m.sponsorId === sponsorId).map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.title} ({Math.round(m.duration)}s)</SelectItem>
                                ))}
                                {mediaItems.filter(m => m.sponsorId === sponsorId).length === 0 && (
                                    <div className="p-2 text-xs text-muted-foreground italic">No media found for this sponsor.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Delivery Priority</Label>
                        <Select value={priority} onValueChange={v => setPriority(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">High (Guaranteed)</SelectItem>
                                <SelectItem value="normal">Normal (Standard)</SelectItem>
                                <SelectItem value="low">Low (Backfill)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <Label className="flex items-center gap-2 font-black text-primary uppercase text-xs tracking-widest">
                        <MapPin className="h-4 w-4" /> Target Geographical Regions
                    </Label>
                    <div className="border rounded-lg p-4 bg-muted/20">
                        {regions.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {regions.map((region) => (
                                    <div key={region.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`region-${region.id}`} 
                                            checked={selectedRegions.includes(region.id)}
                                            onCheckedChange={() => toggleRegion(region.id)}
                                        />
                                        <label 
                                            htmlFor={`region-${region.id}`}
                                            className="text-sm font-medium leading-none cursor-pointer hover:text-primary transition-colors"
                                        >
                                            {region.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                <Info className="h-5 w-5 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-600 font-medium italic">
                                  No regions defined. Initialize territories in the <strong>Regions</strong> page first.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-6 text-xs font-black uppercase text-primary tracking-widest">
                        <Target className="h-4 w-4" /> Goal & Finance Estimates
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black">Target Impressions</Label>
                            <Input type="number" value={targetImpressions} onChange={e => setTargetImpressions(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black">CPM Rate ($)</Label>
                            <Input type="number" value={cpm} onChange={e => setCpm(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black">Est. Budget</Label>
                            <div className="h-10 flex items-center font-black text-2xl text-emerald-500">
                                ${budget.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
        
        <DialogFooter className="p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="font-black uppercase tracking-widest px-8">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Deploy Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}