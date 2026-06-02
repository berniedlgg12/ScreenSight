'use client';

import { useState, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { mexicanStates } from '@/lib/mexican-states';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFleet } from '@/hooks/use-fleet';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Globe, Image as ImageIcon } from 'lucide-react';

interface CreateRegionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRegionDialog({ isOpen, onOpenChange }: CreateRegionDialogProps) {
  const { regions } = useFleet();
  const [name, setName] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [playbackStart, setPlaybackStart] = useState('08:00');
  const [playbackEnd, setPlaybackEnd] = useState('22:00');
  const [timezone, setTimezone] = useState('America/Mexico_City');
  const [standbyImage, setStandbyImage] = useState('reposo/reposo.avif');
  const [autoResume, setAutoResume] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const takenStates = useMemo(() => {
    const taken = new Set<string>();
    regions.forEach(r => {
      r.states?.forEach(s => taken.add(s));
    });
    return taken;
  }, [regions]);

  const toggleState = (state: string) => {
    setSelectedStates(prev => 
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const handleSave = async () => {
    if (!name || selectedStates.length === 0) {
      toast({ title: 'Incomplete Data', description: 'Please provide a name and at least one state.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const regionId = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

    try {
      await setDoc(doc(db, 'regions', regionId), {
        id: regionId,
        name,
        states: selectedStates,
        enabled,
        playbackStart,
        playbackEnd,
        timezone,
        standbyImage,
        autoResume,
        createdAt: Date.now(),
      });
      toast({ title: 'Region Created', description: `Territory "${name}" has been registered with schedule.` });
      onOpenChange(false);
      setName('');
      setSelectedStates([]);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to create region.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="uppercase font-black flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Define Territory
          </DialogTitle>
          <DialogDescription>Group states and set operational playback schedules.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region-name">Region Name</Label>
                <Input id="region-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Norte, Bajio" />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <div className="flex items-center space-x-2">
                  <Switch checked={enabled} onCheckedChange={setEnabled} id="region-enabled" />
                  <Label htmlFor="region-enabled">Territory Enabled (ON/OFF)</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Clock className="h-3 w-3" /> Playback Schedule
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={playbackStart} onChange={e => setPlaybackStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={playbackEnd} onChange={e => setPlaybackEnd(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Mexico_City">Mexico City (CST)</SelectItem>
                      <SelectItem value="America/Tijuana">Tijuana (PST)</SelectItem>
                      <SelectItem value="America/Mazatlan">Mazatlán (MST)</SelectItem>
                      <SelectItem value="America/Cancun">Cancún (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <ImageIcon className="h-3 w-3" /> Standby Mode
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Standby Image Path (Storage)</Label>
                  <Input value={standbyImage} onChange={e => setStandbyImage(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch checked={autoResume} onCheckedChange={setAutoResume} id="auto-resume" />
                  <Label htmlFor="auto-resume">Auto Resume Enabled</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Geographical Coverage</Label>
              <p className="text-[9px] text-muted-foreground uppercase mb-2">Select states to include in this territorial cluster.</p>
              <div className="grid grid-cols-2 gap-2 p-4 border rounded-md bg-muted/20 h-48 overflow-y-auto">
                {mexicanStates.map(state => {
                  const isTaken = takenStates.has(state);
                  return (
                    <div key={state} className="flex items-center gap-2">
                      <Checkbox 
                        id={state} 
                        checked={selectedStates.includes(state)} 
                        onCheckedChange={() => toggleState(state)}
                        disabled={isTaken}
                      />
                      <label 
                        htmlFor={state} 
                        className={`text-xs cursor-pointer ${isTaken ? 'text-muted-foreground/40 italic' : ''}`}
                      >
                        {state}
                        {isTaken && " (Assigned)"}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="font-black uppercase tracking-widest">
            {loading ? 'Creating...' : 'Register Territory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
