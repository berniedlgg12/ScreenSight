'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
import { Progress } from '@/components/ui/progress';
import { Loader2, Film, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UploadVideoDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function UploadVideoDialog({ isOpen, setIsOpen }: UploadVideoDialogProps) {
  const [title, setTitle] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const { toast } = useToast();

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

  const coppelExists = useMemo(() => sortedSponsors.some(s => s.isInternal), [sortedSponsors]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (!selectedFile.type.startsWith('video/')) {
          toast({ title: "Invalid File", description: "Select a valid video asset.", variant: "destructive" });
          return;
      }
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    if (!file || !title || !sponsorId) {
      toast({ title: 'Missing Info', description: 'Select a sponsor and title.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    const duration = await getVideoDuration(file);
    setIsProcessing(false);
    setIsUploading(true);

    const storagePath = `media/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        toast({ title: "Upload Failed", description: "Verify Storage Rules in Firebase Console.", variant: 'destructive' });
        setIsUploading(false);
        setUploadProgress(0);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const selectedSponsor = sortedSponsors.find(s => s.id === sponsorId);

        const newMedia: Omit<Media, 'id'> = {
          title,
          sponsorId,
          sponsorName: selectedSponsor?.name || 'Unknown',
          fileName: file.name,
          downloadURL,
          storagePath,
          duration,
          status: 'active',
          type: 'video',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'media'), newMedia);
        toast({ title: 'Asset Onboarded', description: `"${title}" linked to ${newMedia.sponsorName}` });
        setIsOpen(false);
        setFile(null);
        setTitle('');
        setSponsorId('');
        setIsUploading(false);
        setUploadProgress(0);
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 bg-card border-primary/20">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" /> Onboard Video Asset
          </DialogTitle>
          <DialogDescription>Every asset must be linked to a Sponsor for playback tracking.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
            <div className="grid gap-6">
                {!coppelExists && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                        <div className="text-xs text-amber-600 font-medium">
                            <strong>System Note:</strong> COPPEL INTERNAL is not yet initialized. Please go to <strong>Regions</strong> and click <strong>Initialize AdOps Env</strong> to enable filler ads.
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Linked Sponsor / Brand</Label>
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
                            {sortedSponsors.length === 0 && (
                                <div className="p-4 text-center text-xs text-muted-foreground italic">
                                    No sponsors found.
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Asset Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 Promo Video" />
                </div>
                <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Video File</Label>
                    <Input type="file" accept="video/*" onChange={handleFileChange} className="cursor-pointer" />
                </div>
                {isUploading && (
                    <div className="space-y-2 pt-2">
                        <Progress value={uploadProgress} />
                        <p className="text-[10px] text-center font-black uppercase text-primary tracking-widest animate-pulse">
                            {Math.round(uploadProgress)}% Uploading...
                        </p>
                    </div>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isUploading || isProcessing || !file} className="font-black uppercase tracking-widest">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {isUploading ? "Uploading" : "Onboard Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}