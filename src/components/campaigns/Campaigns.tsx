'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, Region } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  PlusCircle, 
  Loader2, 
  Megaphone, 
  Target, 
  Activity, 
  MapPin, 
  MoreHorizontal, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateCampaignDialog } from './CreateCampaignDialog';
import { EditCampaignDialog } from './EditCampaignDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubCampaigns = onSnapshot(query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')), (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        startDate: (doc.data().startDate as any)?.toDate?.() || new Date(),
        endDate: (doc.data().endDate as any)?.toDate?.() || new Date(),
      } as Campaign)));
      setLoading(false);
    });

    const unsubRegions = onSnapshot(collection(db, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Region)));
    });

    return () => {
      unsubCampaigns();
      unsubRegions();
    };
  }, []);

  const globalStats = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active');
    const totalGoal = active.reduce((s, c) => s + (c.targetPlaybacks || 0), 0);
    const totalDelivered = active.reduce((s, c) => s + (c.deliveredPlaybacks || 0), 0);
    const pacing = totalGoal > 0 ? (totalDelivered / totalGoal) * 100 : 0;
    const revenue = campaigns.reduce((s, c) => s + (c.budget || 0), 0);

    return { active: active.length, pacing, revenue };
  }, [campaigns]);

  const getPacingColor = (progress: number) => {
      if (progress < 40) return "bg-amber-500";
      if (progress < 90) return "bg-primary";
      return "bg-green-500";
  };

  const getRegionNames = useCallback((regionIds: string[]) => {
    if (!regionIds || regionIds.length === 0) return 'Global';
    return regionIds.map(id => regions.find(r => r.id === id)?.name || id).join(', ');
  }, [regions]);

  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'campaigns', deletingCampaign.id));
      toast({ title: 'Campaign Removed', description: `Delivery target "${deletingCampaign.name}" deleted.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete campaign.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeletingCampaign(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Campaigns</h1>
            <p className="text-muted-foreground font-medium">Manage sponsor delivery targets and fulfillment pacing.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="font-bold">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Target
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Target className="h-4 w-4" /> Active Delivery
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-black">{globalStats.active}</div>
              </CardContent>
          </Card>
          <Card className="bg-card">
              <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Network Pacing
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-black">{globalStats.pacing.toFixed(1)}%</div>
              </CardContent>
          </Card>
           <Card className="bg-card">
              <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Megaphone className="h-4 w-4" /> Est. Revenue
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-black">${globalStats.revenue.toLocaleString()}</div>
              </CardContent>
          </Card>
      </div>
      
      <Card className="border-primary/10">
        <CardHeader>
            <CardTitle>Delivery Operations</CardTitle>
            <CardDescription>Live tracking of campaign fulfillment goals.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <span className="font-bold uppercase tracking-widest text-xs">Loading AdOps Core...</span>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px]">Campaign Target</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Sponsor</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Territories</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Goal Progress</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Impressions</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Delivery Dates</TableHead>
                  <TableHead className="font-black uppercase text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => {
                    const progress = (campaign.targetPlaybacks > 0) ? (campaign.deliveredPlaybacks / campaign.targetPlaybacks) * 100 : 0;
                    return (
                        <TableRow key={campaign.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-black text-primary">
                                <div className="flex flex-col">
                                    <span>{campaign.name}</span>
                                    <Badge variant={campaign.priority === 'high' ? 'default' : 'secondary'} className="uppercase text-[8px] w-fit mt-1">
                                        {campaign.priority} priority
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="font-bold">{campaign.brandName}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-xs font-medium">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="max-w-[150px] truncate" title={getRegionNames(campaign.targetRegions)}>
                                        {getRegionNames(campaign.targetRegions)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1 w-40">
                                    <Progress value={progress} className="h-1.5" indicatorClassName={getPacingColor(progress)} />
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                        {campaign.deliveredPlaybacks.toLocaleString()} / {campaign.targetPlaybacks.toLocaleString()} plays
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                                {(campaign.deliveredImpressions || 0).toLocaleString()} / {(campaign.targetImpressions || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-medium">
                                {format(new Date(campaign.startDate), 'MMM d')} - {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem 
                                    onSelect={(e) => { e.preventDefault(); setEditingCampaign(campaign); }}
                                    className="font-medium"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit Target</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onSelect={(e) => { e.preventDefault(); setDeletingCampaign(campaign); }}
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive font-bold"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Megaphone className="h-8 w-8" />
                        <p className="font-black uppercase text-xs">No active campaign targets deployed.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateCampaignDialog isOpen={isCreateDialogOpen} setIsOpen={setCreateDialogOpen} />
      
      <EditCampaignDialog 
        isOpen={!!editingCampaign} 
        setIsOpen={(open) => !open && setEditingCampaign(null)} 
        campaign={editingCampaign} 
      />

      <AlertDialog open={!!deletingCampaign} onOpenChange={(open) => !open && setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black">Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the delivery target <strong>{deletingCampaign?.name}</strong>. Historical playback logs will be preserved but the campaign will no longer be active.
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
              Yes, Delete Target
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
