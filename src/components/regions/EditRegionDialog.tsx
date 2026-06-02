'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Region } from '@/lib/types';
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
import { Loader2, Trash2, AlertCircle, Clock, Globe, Image as ImageIcon } from 'lucide-react';
import { useFleet } from '@/hooks/use-fleet';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditRegionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  region: Region | null;
}

export function EditRegionDialog({ isOpen, onOpenChange, region }: EditRegionDialogProps) {
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { toast } = useToast();
  const lastRegionId = useRef<string | null>(null);

  useEffect(() => {
    if (region && isOpen) {
      if (region.id !== lastRegionId.current) {
        setName(region.name);
        setSelectedStates(region.states || []);
        setEnabled(region.enabled ?? true);
        setPlaybackStart(region.playbackStart || '08:00');
        setPlaybackEnd(region.playbackEnd || '22:00');
        setTimezone(region.timezone || 'America/Mexico_City');
        setStandbyImage(region.standbyImage || 'reposo/reposo.avif');
        setAutoResume(region.autoResume ?? true);
        setShowConfirmDelete(false);
        lastRegionId.current = region.id;
      }
    } else if (!isOpen) {
      lastRegionId.current = null;
    }
  }, [region, isOpen]);

  const takenStates = useMemo(() => {
    const taken = new Set<string>();
    regions.forEach(r => {
      if (r.id !== region?.id) {
        r.states?.forEach(s => taken.add(s));
      }
    });
    return taken;
  }, [regions, region]);

  const toggleState = (state: string) => {
    setSelectedStates(prev => 
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const handleSave = async () => {
    if (!region) return;
    if (!name || selectedStates.length === 0) {
      toast({ title: 'Incomplete Data', description: 'Please provide a name and at least one state.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'regions', region.id), {
        name,
        states: selectedStates,
        enabled,
        playbackStart,
        playbackEnd,
        timezone,
        standbyImage,
        autoResume,
        updatedAt: Date.now(),
      });
      toast({ title: 'Region Updated', description: `Territory schedule and coverage saved for "${name}".` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update region.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!region) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'regions', region.id));
      toast({ title: 'Region Deleted', description: `The territory "${region.name}" has been removed.` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!region) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="uppercase font-black flex items-center gap-2 text-primary">
            {showConfirmDelete ? <AlertCircle className="text-destructive h-5 w-5" /> : <Globe className="h-5 w-5" />}
            {showConfirmDelete ? "Confirm Deletion" : "Territory Settings"}
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] uppercase">Region ID: {region.id}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {showConfirmDelete ? (
            <div className="py-12 flex flex-col items-center text-center gap-4 bg-destructive/5 rounded-lg border border-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div className="space-y-1 px-8">
                <p className="font-black uppercase text-lg">Warning: Destructive Action</p>
                <p className="text-sm text-muted-foreground">Deleting "{region.name}" will orphan associated stores and screens. All regional playback for this area will stop.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-region-name">Region Name</Label>
                  <Input id="edit-region-name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <div className="flex items-center space-x-2">
                    <Switch checked={enabled} onCheckedChange={setEnabled} id="edit-region-enabled" />
                    <Label htmlFor="edit-region-enabled" className="text-xs uppercase font-black">Region Active</Label>
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
                    <Switch checked={autoResume} onCheckedChange={setAutoResume} id="edit-auto-resume" />
                    <Label htmlFor="edit-auto-resume" className="text-[10px] uppercase font-black">Auto Resume</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Geographical Coverage</Label>
                <div className="grid grid-cols-2 gap-2 p-4 border rounded-md bg-muted/20 h-40 overflow-y-auto">
                  {mexicanStates.map(state => {
                    const isTaken = takenStates.has(state);
                    return (
                      <div key={state} className="flex items-center gap-2">
                        <Checkbox 
                          id={`edit-${state}`} 
                          checked={selectedStates.includes(state)} 
                          onCheckedChange={() => toggleState(state)} 
                          disabled={isTaken}
                        />
                        <label 
                          htmlFor={`edit-${state}`} 
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
          )}
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10">
          {showConfirmDelete ? (
            <>
              <Button variant="outline" onClick={() => setShowConfirmDelete(false)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="font-black uppercase tracking-widest">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Confirm Delete Region
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirmDelete(true)} 
                disabled={loading}
                className="mr-auto text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} className="font-black uppercase tracking-widest px-8">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
