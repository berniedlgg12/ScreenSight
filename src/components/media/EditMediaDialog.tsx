'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Media, Sponsor } from '@/lib/types';
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
import { Loader2, Trash2, AlertCircle, Film, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditMediaDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  media: Media | null;
}

export function EditMediaDialog({ isOpen, setIsOpen, media }: EditMediaDialogProps) {
  const [title, setTitle] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { toast } = useToast();
  const lastMediaId = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sponsors'), (snap) => {
      setSponsors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sponsor)));
    });
    return () => unsub();
  }, []);

  const sortedSponsors = useMemo(() => {
    return [...sponsors].sort((a, b) => {
        if (a.isInternal && !b.isInternal) return -1;
        if (!a.isInternal && b.isInternal) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [sponsors]);

  useEffect(() => {
    if (media && isOpen) {
      if (media.id !== lastMediaId.current) {
        setTitle(media.title || '');
        setSponsorId(media.sponsorId || '');
        setShowConfirmDelete(false);
        lastMediaId.current = media.id;
      }
    } else if (!isOpen) {
      lastMediaId.current = null;
    }
  }, [media, isOpen]);

  const handleSave = async () => {
    if (!media) return;
    if (!title || !sponsorId) {
      toast({ title: 'Missing Information', description: 'Title and Sponsor are mandatory.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const selectedSponsor = sortedSponsors.find(s => s.id === sponsorId);
      const mediaRef = doc(db, 'media', media.id);
      await updateDoc(mediaRef, {
        title,
        sponsorId,
        sponsorName: selectedSponsor?.name || 'Unknown',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Asset Updated', description: `Successfully updated metadata for "${title}".` });
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating media:', error);
      toast({ title: 'Update Failed', description: 'Could not update media metadata.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!media) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'media', media.id));
      if (media.storagePath) {
        const fileRef = ref(storage, media.storagePath);
        await deleteObject(fileRef).catch(e => console.warn("Storage file removal failed:", e));
      }
      toast({ title: 'Asset Removed', description: `"${media.title}" deleted from AdOps library.` });
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({ title: 'Delete Failed', description: 'Could not remove the media asset.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="uppercase font-black flex items-center gap-2">
            {showConfirmDelete ? <AlertCircle className="text-destructive h-5 w-5" /> : <Film className="text-primary h-5 w-5" />}
            {showConfirmDelete ? "Confirm Removal" : "Edit Asset Info"}
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] uppercase">
            Asset ID: {media.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
            {showConfirmDelete ? (
                <div className="py-6 flex flex-col items-center text-center gap-4 bg-destructive/5 border border-destructive/10 rounded-lg">
                    <div className="space-y-2 px-4">
                        <p className="font-black uppercase text-destructive tracking-tight text-sm">Warning: Destructive Action</p>
                        <p className="text-xs text-muted-foreground font-medium">
                            Deleting <span className="text-foreground font-bold">"{media.title}"</span> will permanently remove the file from storage and orphan active campaigns.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Asset Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 Promo Video" />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Linked Sponsor</Label>
                        <Select value={sponsorId} onValueChange={setSponsorId}>
                            <SelectTrigger className="font-bold">
                                <SelectValue placeholder="Select Advertiser" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortedSponsors.map(s => (
                                    <SelectItem 
                                        key={s.id} 
                                        value={s.id} 
                                        className={cn(s.isInternal && "bg-primary/5 font-black text-primary border-b border-primary/10 mb-1")}
                                    >
                                        <div className="flex items-center gap-2">
                                            {s.isInternal && <ShieldCheck className="h-4 w-4 text-amber-500" />}
                                            {s.name} {s.isInternal && "(System Filler)"}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-black text-muted-foreground">Duration</span>
                            <span className="text-sm font-mono">{Math.round(media.duration)}s</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-black text-muted-foreground">Orientation</span>
                            <span className="text-sm font-mono uppercase">{media.orientation || 'Landscape'}</span>
                        </div>
                    </div>
                </div>
            )}
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10">
          {showConfirmDelete ? (
            <>
              <Button variant="outline" onClick={() => setShowConfirmDelete(false)} disabled={isDeleting} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto font-black uppercase tracking-widest text-xs">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Confirm Delete
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirmDelete(true)} 
                disabled={loading}
                className="sm:mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} className="font-black uppercase tracking-widest text-xs">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}