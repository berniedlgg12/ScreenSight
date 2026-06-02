'use client';

import { useState } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Store as StoreIcon, PlusCircle, Search, Filter, Loader2, MoreHorizontal, Settings, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateStoreDialog } from './CreateStoreDialog';
import { EditStoreDialog } from './EditStoreDialog';
import type { Store } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function StoreManagement() {
  const { stores, regions, devices, loading } = useFleet();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!deletingStore) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'stores', deletingStore.id));
      toast({ title: 'Store Deleted', description: `"${deletingStore.name}" has been removed.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete store.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeletingStore(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Synchronizing store inventory...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Stores</h1>
          <p className="text-muted-foreground">Inventory of physical locations and deployment nodes.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Store
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, ID or city..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {stores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store ID</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Screens</TableHead>
                  <TableHead>Daily Traffic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-mono font-bold text-xs">{store.id}</TableCell>
                    <TableCell className="font-bold">{store.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                          <span>{store.city}, {store.state}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{regions.find(r => r.id === store.regionId)?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{devices.filter(d => d.storeId === store.id).length}</TableCell>
                    <TableCell>{(store.dailyTraffic || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="uppercase text-[10px]" variant={store.status === 'active' ? 'default' : 'secondary'}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingStore(store); }}>
                            <Settings className="mr-2 h-4 w-4" /> Edit Store
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDeletingStore(store); }} className="text-destructive font-bold">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Store
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
               <StoreIcon className="h-12 w-12 text-muted-foreground/30" />
               <h3 className="text-lg font-bold">No stores registered</h3>
               <p className="text-muted-foreground max-w-sm text-sm">Onboard your retail locations to start deploying TV screens and campaigns.</p>
               <Button onClick={() => setCreateOpen(true)}>Register Your First Store</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateStoreDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} regions={regions} />
      <EditStoreDialog 
        isOpen={!!editingStore} 
        onOpenChange={(open) => !open && setEditingStore(null)} 
        store={editingStore} 
        regions={regions} 
      />

      <AlertDialog open={!!deletingStore} onOpenChange={(open) => !open && setDeletingStore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black">Delete Store</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove store <strong>{deletingStore?.name}</strong>. Devices in this store will lose their assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
              className={cn(buttonVariants({ variant: 'destructive' }), "font-black uppercase")}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Yes, Delete Store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}