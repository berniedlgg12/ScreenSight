'use client';

import { useState, useMemo } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Store as StoreIcon, PlusCircle, Search, Filter, Loader2, MoreHorizontal, Settings, Trash2, MapPin, FilterX } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StoreManagement() {
  const { stores, regions, devices, loading } = useFleet();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const { toast } = useToast();

  const filteredStores = useMemo(() => {
    return stores.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                             s.id.toLowerCase().includes(search.toLowerCase()) ||
                             s.city?.toLowerCase().includes(search.toLowerCase());
        
        const matchesRegion = regionFilter === 'all' || s.regionId === regionFilter;
        
        return matchesSearch && matchesRegion;
    });
  }, [stores, search, regionFilter]);

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

      <div className="flex flex-col md:flex-row items-center gap-4 bg-background border border-primary/10 p-3 rounded-2xl shadow-sm">
          <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search by name, ID or city..." 
                  className="pl-10 h-10 border-none bg-muted/20 shadow-none font-medium" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
              />
          </div>
          
          <div className="h-8 w-px bg-primary/10 hidden md:block" />

          <div className="flex items-center gap-2 w-full md:w-auto">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Territory:</span>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-full md:w-[220px] h-10 font-bold bg-muted/20 border-none shadow-none">
                      <SelectValue placeholder="All Territories" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">National Coverage (All)</SelectItem>
                      {regions.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>

          {(regionFilter !== 'all' || search) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setRegionFilter('all'); setSearch(''); }} 
                className="text-xs font-black uppercase text-rose-500 hover:bg-rose-500/10"
              >
                  <FilterX className="h-3 w-3 mr-2" /> Reset
              </Button>
          )}
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredStores.length > 0 ? (
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
                {filteredStores.slice(0, 100).map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-mono font-bold text-xs">{store.id}</TableCell>
                    <TableCell className="font-bold">{store.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                          <span>{store.city}, {store.state}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[9px] uppercase">{regions.find(r => r.id === store.regionId)?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="font-bold">{devices.filter(d => d.storeId === store.id).length}</TableCell>
                    <TableCell>{(store.dailyTraffic || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="uppercase text-[10px] font-black" variant={store.status === 'active' ? 'default' : 'secondary'}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
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
                {filteredStores.length > 100 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 bg-muted/5">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Showing first 100 of {filteredStores.length} nodes. Use region filter for precision.</span>
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
               <StoreIcon className="h-12 w-12 text-muted-foreground/30" />
               <h3 className="text-lg font-bold">No stores registered</h3>
               <p className="text-muted-foreground max-w-sm text-sm">No locations match your current search or filter criteria.</p>
               <Button onClick={() => { setRegionFilter('all'); setSearch(''); }}>Clear All Filters</Button>
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
