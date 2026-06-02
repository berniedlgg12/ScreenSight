'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Device, Store } from '@/lib/types';
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
import { Loader2, Settings } from 'lucide-react';

interface EditScreenDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  device: Device | null;
  stores: Store[];
}

export function EditScreenDialog({ isOpen, setIsOpen, device, stores }: EditScreenDialogProps) {
  const [name, setName] = useState('');
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const lastDeviceId = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && device) {
      if (device.id !== lastDeviceId.current) {
        setName(device.name || '');
        setStoreId(device.storeId || '');
        lastDeviceId.current = device.id;
      }
    } else if (!isOpen) {
      lastDeviceId.current = null;
    }
  }, [isOpen, device]);

  if (!device) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const selectedStore = stores.find(s => s.id === storeId);
      const regionId = selectedStore?.regionId || '';

      const deviceRef = doc(db, 'devices', device.id);
      await updateDoc(deviceRef, {
        name,
        storeId,
        // Maintain region consistency on update
        regionId,
        currentRegionId: regionId,
        updatedAt: Date.now()
      });
      toast({
        title: 'Screen Updated',
        description: `Successfully updated ${name}.`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update the screen.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="uppercase font-black flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" /> Configure Screen
          </DialogTitle>
          <DialogDescription className="font-mono text-xs uppercase">
            ID: {device.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TV Front Desk" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store">Store Assignment</Label>
            <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name} ({store.id})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="font-black uppercase">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
