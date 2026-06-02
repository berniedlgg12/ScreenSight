'use client';

import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Media, Sponsor } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from '@/components/ui/button';
import { Play, Plus, Trash2, Loader2, MoreHorizontal, Edit, Film, Briefcase, ShieldCheck } from 'lucide-react';
import { PreviewVideoDialog } from './PreviewVideoDialog';
import { useToast } from '@/hooks/use-toast';
import { UploadVideoDialog } from './UploadVideoDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditMediaDialog } from './EditMediaDialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const formatDuration = (seconds: number | undefined) => {
  if (seconds === undefined || isNaN(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const parts: string[] = [];
  if (hours > 0) parts.push(hours.toString());
  parts.push(minutes.toString().padStart(hours > 0 ? 2 : 1, '0'));
  parts.push(secs.toString().padStart(2, '0'));
  
  return parts.join(':');
};

export function MediaLibrary() {
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [mediaLibrary, setMediaLibrary] = useState<Media[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
      const q = query(collection(db, 'media'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Media));
          setMediaLibrary(items.sort((a,b) => {
              const dateA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any)?.toDate?.()?.getTime() || 0;
              const dateB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any)?.toDate?.()?.getTime() || 0;
              return dateB - dateA;
          }));
          setLoading(false);
      });
      return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sponsors'), (snap) => {
        setSponsors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sponsor)));
    });
    return () => unsub();
  }, []);

  const handlePreview = (video: Media) => {
    setSelectedMedia(video);
    setPreviewOpen(true);
  };

  const handleEdit = (video: Media) => {
    setSelectedMedia(video);
    setEditDialogOpen(true);
  };
  
  const handleDeleteRequest = (video: Media) => {
    setSelectedMedia(video);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMedia) return;
    setSaving(true);

    try {
        await deleteDoc(doc(db, 'media', selectedMedia.id));
        if (selectedMedia.storagePath) {
            try {
                const fileRef = ref(storage, selectedMedia.storagePath);
                await deleteObject(fileRef);
            } catch (storageError: any) {
                console.warn("Storage file already gone or inaccessible:", storageError.message);
            }
        }
        toast({ title: 'Media Deleted', description: `"${selectedMedia.title}" removed from library.` });
    } catch (error) {
        toast({ title: 'Deletion Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setSelectedMedia(null);
    }
  };

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Media Assets</h1>
            <p className="text-muted-foreground">Manage advertiser content for AdOps distribution.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setUploadOpen(true)} className="font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Upload Asset
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card/40 border-primary/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                        <Film className="h-3 w-3" /> Total Assets
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{mediaLibrary.length}</div>
                </CardContent>
            </Card>
            <Card className="bg-card/40 border-primary/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> Sponsors
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{sponsors.length}</div>
                </CardContent>
            </Card>
        </div>

        <Card className="border-primary/10">
            <CardHeader>
                <CardTitle className="text-lg font-bold">Asset Library</CardTitle>
                <CardDescription>
                All content must be linked to a Sponsor to be eligible for campaign distribution.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                <Table>
                    <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="text-[10px] font-black uppercase">Title</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Sponsor</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Duration</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {mediaLibrary.length > 0 ? (
                        mediaLibrary.map((item) => {
                          const isInternal = item.sponsorId === 'coppel-internal';
                          return (
                            <TableRow key={item.id} className={cn("hover:bg-muted/5 transition-colors", isInternal && "bg-primary/5 hover:bg-primary/10")}>
                                <TableCell className="font-bold text-primary">
                                  <div className="flex items-center gap-2">
                                    {isInternal && <ShieldCheck className="h-3 w-3 text-amber-500" />}
                                    {item.title}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-xs">
                                    <Badge variant={isInternal ? "default" : "secondary"} className={cn("font-mono text-[9px] uppercase tracking-tight", isInternal && "bg-amber-500/10 text-amber-600 border-amber-500/20")}>
                                        {item.sponsorName}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{formatDuration(item.duration)}</TableCell>
                                <TableCell>
                                    <Badge className="text-[9px] uppercase font-black" variant={item.status === 'active' ? 'default' : 'secondary'}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlePreview(item); }} className="font-medium">
                                        <Play className="mr-2 h-4 w-4" />
                                        <span>Preview</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleEdit(item); }} className="font-medium">
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit Info</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleDeleteRequest(item); }} className="text-destructive focus:bg-destructive/10 focus:text-destructive font-bold">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Remove</span>
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center">
                            <div className="flex flex-col items-center gap-2 opacity-50">
                                <Film className="h-8 w-8" />
                                <p className="font-black uppercase text-xs">Library is empty. Onboard assets to begin.</p>
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
      </div>

      <PreviewVideoDialog
        isOpen={isPreviewOpen}
        setIsOpen={setPreviewOpen}
        videoUrl={selectedMedia?.downloadURL ?? null}
        onClose={() => setSelectedMedia(null)}
      />
      <UploadVideoDialog
        isOpen={isUploadOpen}
        setIsOpen={setUploadOpen}
      />
       <EditMediaDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setEditDialogOpen}
        media={selectedMedia}
      />
       
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle className="uppercase font-black">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                  This will permanently delete the media asset <strong>"{selectedMedia?.title}"</strong>.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }} 
                  className={cn(buttonVariants({ variant: "destructive" }))}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete Asset
                </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}