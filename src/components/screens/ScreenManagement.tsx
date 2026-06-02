'use client';

import { useState } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tv, RefreshCw, MoreHorizontal, Power, Link as LinkIcon, Loader2, Settings, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateDeviceDialog } from './CreateDeviceDialog';
import { EditScreenDialog } from '@/components/dashboard/EditScreenDialog';
import { useToast } from '@/hooks/use-toast';
import type { Device } from '@/lib/types';
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
import { cn, isDeviceOnline, getDeviceConnectionState } from '@/lib/utils';

export function ScreenManagement() {
  const { devices, stores, loading } = useFleet();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async (deviceId: string) => {
    const link = `${window.location.origin}/tv?id=${deviceId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
          title: 'Link Copied',
          description: `Direct access link for ${deviceId} copied.`,
      });
    } catch (err) {
      toast({
          title: 'Copy Failed',
          variant: 'destructive'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDevice) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'devices', deletingDevice.id));
      toast({ title: 'Device Removed', description: `Screen ${deletingDevice.id} has been deleted.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete device.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeletingDevice(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Synchronizing screen telemetry...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Screens</h1>
          <p className="text-muted-foreground">Fleet status, hardware telemetry and direct control.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Hard Refresh</Button>
            <Button onClick={() => setCreateOpen(true)}><Tv className="mr-2 h-4 w-4" /> New Device</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {devices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Device ID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Store & Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Specs</TableHead>
                  <TableHead>Today Plays</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const store = stores.find(s => s.id === device.storeId);
                  const connState = getDeviceConnectionState(device.lastHeartbeat);
                  
                  return (
                    <TableRow key={device.id} className={cn(connState === 'offline' && "opacity-60 bg-muted/5")}>
                      <TableCell className="font-mono font-black text-primary text-sm">{device.id}</TableCell>
                      <TableCell className="font-bold">{device.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {store?.name || 'Unassigned'} — {store?.city}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={connState === 'online' ? 'default' : 'secondary'} 
                          className={cn(
                            "uppercase text-[10px] font-black",
                            connState === 'online' && "bg-green-500 hover:bg-green-600",
                            connState === 'unstable' && "bg-amber-500 text-white hover:bg-amber-600",
                            connState === 'offline' && "bg-muted text-muted-foreground"
                          )}
                        >
                          {connState}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex flex-col text-[10px] uppercase font-black text-muted-foreground/60">
                              <span>{device.resolution || '1080p'}</span>
                              <span>{device.orientation || 'Landscape'}</span>
                          </div>
                      </TableCell>
                      <TableCell>
                          <span className="text-sm font-black text-primary">{device.todayStats?.totalPlaybacks || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingDevice(device); }}>
                              <Settings className="mr-2 h-4 w-4" /> Manage Device
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleCopyLink(device.id)}>
                              <LinkIcon className="mr-2 h-4 w-4" /> Copy Access Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDeletingDevice(device); }} className="text-destructive font-bold">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Screen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
               <Tv className="h-12 w-12 text-muted-foreground/30" />
               <h3 className="text-lg font-bold">No devices registered</h3>
               <p className="text-muted-foreground max-w-sm text-sm">Register your Smart TVs to start displaying synchronized content across your network.</p>
               <Button onClick={() => setCreateOpen(true)}>Add Your First Device</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CreateDeviceDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} stores={stores} />
      <EditScreenDialog 
        isOpen={!!editingDevice} 
        setIsOpen={(open) => !open && setEditingDevice(null)} 
        device={editingDevice} 
        stores={stores} 
      />

      <AlertDialog open={!!deletingDevice} onOpenChange={(open) => !open && setDeletingDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black">Delete Screen</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove device <strong>{deletingDevice?.id}</strong> from the fleet. This action cannot be undone.
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
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
