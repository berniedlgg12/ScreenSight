'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sponsor } from '@/lib/types';
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
import { Loader2, Trash2, AlertCircle } from 'lucide-react';

interface EditSponsorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor: Sponsor | null;
}

export function EditSponsorDialog({ isOpen, onOpenChange, sponsor }: EditSponsorDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactName: '',
    email: '',
    phone: '',
    negotiatedCPM: '15.00',
    totalBudget: '0',
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { toast } = useToast();
  const lastSponsorId = useRef<string | null>(null);

  useEffect(() => {
    if (sponsor && isOpen) {
      if (sponsor.id !== lastSponsorId.current) {
        setFormData({
          name: sponsor.name,
          industry: sponsor.industry || '',
          contactName: sponsor.contactName || '',
          email: sponsor.email || '',
          phone: sponsor.phone || '',
          negotiatedCPM: (sponsor.negotiatedCPM || 15.00).toString(),
          totalBudget: (sponsor.totalBudget || 0).toString(),
          status: sponsor.status
        });
        setShowConfirmDelete(false);
        lastSponsorId.current = sponsor.id;
      }
    } else if (!isOpen) {
      lastSponsorId.current = null;
    }
  }, [sponsor, isOpen]);

  const handleSave = async () => {
    if (!sponsor) return;
    if (!formData.name || !formData.email) {
      toast({ title: 'Missing Info', description: 'Name and Email are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'sponsors', sponsor.id), {
        ...formData,
        negotiatedCPM: parseFloat(formData.negotiatedCPM) || 0,
        totalBudget: parseFloat(formData.totalBudget) || 0,
        updatedAt: Date.now(),
      });
      toast({ title: 'Sponsor Updated', description: `Advertiser "${formData.name}" has been updated.` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update sponsor.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sponsor) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'sponsors', sponsor.id));
      toast({ title: 'Sponsor Deleted', description: `"${sponsor.name}" has been removed.` });
      onOpenChange(false);
    } catch (e) {
      console.error('Error deleting sponsor:', e);
      toast({ title: 'Error', description: 'Failed to delete sponsor. Please try again.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!sponsor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="uppercase font-black">
            {showConfirmDelete ? "Delete Sponsor" : "Edit Sponsor"}
          </DialogTitle>
          <DialogDescription>
            {showConfirmDelete 
              ? `Are you sure you want to delete "${sponsor.name}"? This will orphan its associated campaigns.` 
              : "Modify commercial terms for this advertiser."}
          </DialogDescription>
        </DialogHeader>

        {showConfirmDelete ? (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg">Confirm Advertiser Deletion</p>
              <p className="text-sm text-muted-foreground">Deleting this sponsor cannot be undone.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Negotiated CPM ($)</Label>
                <Input type="number" value={formData.negotiatedCPM} onChange={e => setFormData({ ...formData, negotiatedCPM: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input type="number" value={formData.totalBudget} onChange={e => setFormData({ ...formData, totalBudget: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showConfirmDelete ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDelete(false)} 
                disabled={isDeleting} 
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isDeleting} 
                className="w-full sm:w-auto"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Yes, Delete Sponsor
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirmDelete(true)} 
                disabled={loading}
                className="sm:mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
