'use client';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CreateSponsorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSponsorDialog({ isOpen, onOpenChange }: CreateSponsorDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactName: '',
    email: '',
    phone: '',
    negotiatedCPM: '15.00',
    totalBudget: '0',
    status: 'active' as const
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: 'Missing Info', description: 'Name and Email are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const sponsorId = `sp-${Date.now().toString().slice(-6)}`;

    try {
      await setDoc(doc(db, 'sponsors', sponsorId), {
        ...formData,
        id: sponsorId,
        negotiatedCPM: parseFloat(formData.negotiatedCPM) || 0,
        totalBudget: parseFloat(formData.totalBudget) || 0,
        createdAt: Date.now(),
      });
      toast({ title: 'Sponsor Created', description: `Advertiser "${formData.name}" is now active.` });
      onOpenChange(false);
      setFormData({ name: '', industry: '', contactName: '', email: '', phone: '', negotiatedCPM: '15.00', totalBudget: '0', status: 'active' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to onboard sponsor.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="uppercase font-black">Add New Sponsor</DialogTitle>
          <DialogDescription>Register an advertiser and set commercial terms.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} placeholder="e.g. Beverages, Tech" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Negotiated CPM ($)</Label>
              <Input type="number" value={formData.negotiatedCPM} onChange={e => setFormData({ ...formData, negotiatedCPM: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Allocated Budget ($)</Label>
              <Input type="number" value={formData.totalBudget} onChange={e => setFormData({ ...formData, totalBudget: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Onboard Partner'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
