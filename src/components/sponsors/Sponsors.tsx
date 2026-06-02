'use client';

import { useState } from 'react';
import { useFleet } from '@/hooks/use-fleet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, PlusCircle, MoreHorizontal, Mail, Loader2, BriefcaseIcon, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateSponsorDialog } from './CreateSponsorDialog';
import { EditSponsorDialog } from './EditSponsorDialog';
import type { Sponsor } from '@/lib/types';

export function Sponsors() {
  const { sponsors, loading } = useFleet();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  // Filtramos para no mostrar patrocinadores internos (como COPPEL INTERNAL)
  const commercialSponsors = sponsors.filter(s => !s.isInternal);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Synchronizing commercial partners...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Sponsors</h1>
          <p className="text-muted-foreground">Manage advertisers and commercial partnerships.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Sponsor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Partners</CardTitle>
          <CardDescription>Entities with negotiated CPM and active billing accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {commercialSponsors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total Budget</TableHead>
                  <TableHead>Negotiated CPM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commercialSponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {sponsor.name.charAt(0)}
                          </div>
                          <span className="font-bold">{sponsor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{sponsor.industry}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{sponsor.contactName}</span>
                          <span>{sponsor.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">${(sponsor.totalBudget || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-mono">${(sponsor.negotiatedCPM || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={sponsor.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                        {sponsor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingSponsor(sponsor); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Sponsor
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); /* Contact logic */ }}>
                            <Mail className="mr-2 h-4 w-4" /> Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); /* View campaigns logic */ }}>
                            <Briefcase className="mr-2 h-4 w-4" /> View Campaigns
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
               <BriefcaseIcon className="h-12 w-12 text-muted-foreground/30" />
               <h3 className="text-lg font-bold">No commercial sponsors added</h3>
               <p className="text-muted-foreground max-w-sm text-sm">Register brands and advertisers to start creating monetized DOOH campaigns.</p>
               <Button onClick={() => setCreateOpen(true)}>Add Your First Sponsor</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CreateSponsorDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
      <EditSponsorDialog 
        isOpen={!!editingSponsor} 
        onOpenChange={(open) => !open && setEditingSponsor(null)} 
        sponsor={editingSponsor} 
      />
    </div>
  );
}