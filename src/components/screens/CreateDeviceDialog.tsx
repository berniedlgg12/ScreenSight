'use client';

import { useState } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Store } from '@/lib/types';
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
import { Loader2 } from 'lucide-react';

interface CreateDeviceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
}

export function CreateDeviceDialog({ isOpen, onOpenChange, stores }: CreateDeviceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    storeId: '',
    orientation: 'landscape',
    resolution: '1920x1080'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.name || !formData.storeId) {
      toast({ title: 'Validation Error', description: 'Name and Store assignment are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Find the region assigned to the selected store
      const selectedStore = stores.find(s => s.id === formData.storeId);
      const regionId = selectedStore?.regionId || '';

      // Generate Smart Device ID (StoreID-Sequence)
      const q = query(collection(db, 'devices'), where('storeId', '==', formData.storeId));
      const snap = await getDocs(q);
      const nextIndex = snap.size + 1;
      const deviceId = `${formData.storeId}-${nextIndex.toString().padStart(3, '0')}`;

      await setDoc(doc(db, 'devices', deviceId), {
        id: deviceId,
        name: formData.name,
        storeId: formData.storeId,
        // Ensure initial region consistency
        regionId,
        currentRegionId: regionId,
        orientation: formData.orientation,
        resolution: formData.resolution,
        status: 'offline',
        connectionStatus: 'disconnected',
        lastHeartbeat: 0,
        todayStats: { totalPlaybacks: 0, lastPlaybackTime: null },
        createdAt: Date.now(),
      });
      
      toast({ title: 'Device Registered', description: `Screen registered with ID ${deviceId}.` });
      onOpenChange(false);
      setFormData({ name: '', storeId: '', orientation: 'landscape', resolution: '1920x1080' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to register device.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="uppercase font-black">Register Device</DialogTitle>
          <DialogDescription>IDs are generated as StoreID-00X.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. TV Lobby Right" />
          </div>
          <div className="space-y-2">
            <Label>Store Assignment</Label>
            <Select value={formData.storeId} onValueChange={v => setFormData({ ...formData, storeId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Store" /></SelectTrigger>
              <SelectContent>
                {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select value={formData.orientation} onValueChange={v => setFormData({ ...formData, orientation: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={formData.resolution} onValueChange={v => setFormData({ ...formData, resolution: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1080p (FHD)</SelectItem>
                  <SelectItem value="3840x2160">4K (UHD)</SelectItem>
                  <SelectItem value="1280x720">720p (HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Registering...' : 'Add Device'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
