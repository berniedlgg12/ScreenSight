'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Region, OperatingHours, DayHours } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mexicanStates } from '@/lib/mexican-states';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Clock, CalendarDays } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

const stateAbbreviations: { [key: string]: string } = {
  'Aguascalientes': 'AGS',
  'Baja California': 'BC',
  'Baja California Sur': 'BCS',
  'Campeche': 'CAMP',
  'Chiapas': 'CHIS',
  'Chihuahua': 'CHIH',
  'Ciudad de México': 'CDMX',
  'Coahuila': 'COAH',
  'Colima': 'COL',
  'Durango': 'DGO',
  'Guanajuato': 'GTO',
  'Guerrero': 'GRO',
  'Hidalgo': 'HGO',
  'Jalisco': 'JAL',
  'México': 'MEX',
  'Michoacán': 'MICH',
  'Morelos': 'MOR',
  'Nayarit': 'NAY',
  'Nuevo León': 'NL',
  'Oaxaca': 'OAX',
  'Puebla': 'PUE',
  'Querétaro': 'QRO',
  'Quintana Roo': 'QROO',
  'San Luis Potosí': 'SLP',
  'Sinaloa': 'SIN',
  'Sonora': 'SON',
  'Tabasco': 'TAB',
  'Tamaulipas': 'TAMPS',
  'Tlaxcala': 'TLAX',
  'Veracruz': 'VER',
  'Yucatán': 'YUC',
  'Zacatecas': 'ZAC',
};

const defaultHours: DayHours = { open: '09:00', close: '21:00', closed: false };

const initialOperatingHours: OperatingHours = {
  monday: { ...defaultHours },
  tuesday: { ...defaultHours },
  wednesday: { ...defaultHours },
  thursday: { ...defaultHours },
  friday: { ...defaultHours },
  saturday: { ...defaultHours },
  sunday: { ...defaultHours },
};

interface CreateStoreDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  regions: Region[];
}

export function CreateStoreDialog({ isOpen, onOpenChange, regions }: CreateStoreDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    regionId: '',
    dailyTraffic: '',
    status: 'active' as const
  });
  
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(initialOperatingHours);
  const [detectedRegionName, setDetectedRegionName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (formData.state && regions.length > 0) {
      const region = regions.find(r => r.states?.includes(formData.state));
      if (region) {
        setFormData(prev => ({ ...prev, regionId: region.id }));
        setDetectedRegionName(region.name);
      } else {
        setFormData(prev => ({ ...prev, regionId: '' }));
        setDetectedRegionName('');
      }
    }
  }, [formData.state, regions]);

  const handleHourChange = (day: keyof OperatingHours, field: keyof DayHours, value: string | boolean) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.state) {
      toast({ title: 'Validation Error', description: 'Name and State are mandatory.', variant: 'destructive' });
      return;
    }

    if (!formData.regionId) {
      toast({ title: 'Region Missing', description: 'The selected state does not belong to any defined region.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const abbrev = stateAbbreviations[formData.state] || 'ST';
      const q = query(collection(db, 'stores'), where('state', '==', formData.state));
      const snap = await getDocs(q);
      const nextIndex = snap.size + 1;
      const storeId = `${abbrev}${nextIndex}`;

      await setDoc(doc(db, 'stores', storeId), {
        ...formData,
        id: storeId,
        retailer: 'Coppel',
        dailyTraffic: parseInt(formData.dailyTraffic) || 0,
        operatingHours,
        createdAt: Date.now(),
      });
      
      toast({ title: 'Store Added', description: `Store registered as ${storeId} in ${detectedRegionName}.` });
      onOpenChange(false);
      setFormData({ name: '', city: '', state: '', regionId: '', dailyTraffic: '', status: 'active' });
      setOperatingHours(initialOperatingHours);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add store.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const days: { key: keyof OperatingHours; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="uppercase font-black text-2xl tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Register New Store
          </DialogTitle>
          <DialogDescription>IDs are generated automatically based on state sequence.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label className="font-bold">Store Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Forum Tlaquepaque" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label className="font-bold">State</Label>
                    <Select value={formData.state} onValueChange={v => setFormData({ ...formData, state: v })}>
                        <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>
                        {mexicanStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-2">
                    <Label className="font-bold">Region (Auto)</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50">
                        {detectedRegionName ? (
                        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                            <MapPin className="h-3 w-3" />
                            {detectedRegionName}
                        </Badge>
                        ) : (
                        <span className="text-xs text-muted-foreground italic">Select state</span>
                        )}
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label className="font-bold">City</Label>
                    <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                    <Label className="font-bold">Traffic Estimate (Daily)</Label>
                    <Input type="number" value={formData.dailyTraffic} onChange={e => setFormData({ ...formData, dailyTraffic: e.target.value })} />
                    </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2 text-primary mb-4">
                        <Clock className="h-5 w-5" />
                        <h3 className="font-black uppercase tracking-tighter">Operating Hours</h3>
                    </div>
                    
                    <div className="space-y-3 bg-muted/20 p-4 rounded-lg border">
                        {days.map((day) => (
                            <div key={day.key} className="flex items-center justify-between gap-4">
                                <div className="w-24 flex items-center gap-2">
                                    <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm font-bold capitalize">{day.label}</span>
                                </div>
                                
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input 
                                            type="time" 
                                            className="h-8" 
                                            value={operatingHours[day.key].open} 
                                            disabled={operatingHours[day.key].closed}
                                            onChange={(e) => handleHourChange(day.key, 'open', e.target.value)}
                                        />
                                        <span className="text-xs text-muted-foreground uppercase font-black">to</span>
                                        <Input 
                                            type="time" 
                                            className="h-8" 
                                            value={operatingHours[day.key].close} 
                                            disabled={operatingHours[day.key].closed}
                                            onChange={(e) => handleHourChange(day.key, 'close', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Closed</span>
                                        <Switch 
                                            checked={operatingHours[day.key].closed}
                                            onCheckedChange={(val) => handleHourChange(day.key, 'closed', val)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="font-black uppercase tracking-widest px-8">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Registering...' : 'Add Store'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}