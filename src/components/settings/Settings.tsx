
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Monitor, Activity, ShieldCheck, Database, RefreshCcw } from 'lucide-react';

export function Settings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast({
                title: 'Settings Saved',
                description: 'Global system configuration has been updated successfully.',
            });
        }, 800);
    };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 border">
        <TabsTrigger value="general" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <SettingsIcon className="h-3.5 w-3.5" /> General
        </TabsTrigger>
        <TabsTrigger value="devices" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <Monitor className="h-3.5 w-3.5" /> Playback
        </TabsTrigger>
        <TabsTrigger value="network" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <Activity className="h-3.5 w-3.5" /> Network
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" /> AdOps Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Platform Identity</CardTitle>
            <CardDescription>Manage how ScreenSight appears across the organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="platform-name" className="text-xs uppercase font-black opacity-60">Platform Identifier</Label>
                    <Input id="platform-name" defaultValue="ScreenSight AdOps" className="font-bold" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-xs uppercase font-black opacity-60">Master Timezone</Label>
                    <Select defaultValue="America/Mexico_City">
                        <SelectTrigger id="timezone" className="font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="America/Mexico_City">Mexico City (CST)</SelectItem>
                            <SelectItem value="America/Tijuana">Tijuana (PST)</SelectItem>
                            <SelectItem value="America/Mazatlan">Mazatlan (MST)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight">Global Refresh Sync</p>
                    <p className="text-xs text-muted-foreground">Force all dashboard instances to resync telemetry every 60s.</p>
                </div>
                <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="devices" className="space-y-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Hardware & Telemetry</CardTitle>
            <CardDescription>Adjust how Smart TVs interact with the AdOps Core.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="heartbeat" className="text-xs uppercase font-black opacity-60">Heartbeat Frequency (sec)</Label>
                    <Input id="heartbeat" type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timeout" className="text-xs uppercase font-black opacity-60">Offline Expiration (sec)</Label>
                    <Input id="timeout" type="number" defaultValue="15" />
                </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Aggressive Drift Correction</Label>
                        <p className="text-xs text-muted-foreground">Correct video playback if it deviates more than 0.2s from master clock.</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Auto-Resume Playback</Label>
                        <p className="text-xs text-muted-foreground">Resume video loop immediately after a power outage or reboot.</p>
                    </div>
                    <Switch defaultChecked />
                </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="network" className="space-y-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Regional Distribution Settings</CardTitle>
            <CardDescription>Configure storage and CDN preferences for regional merged files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label className="text-xs uppercase font-black opacity-60">Master Storage Bucket</Label>
                <Input defaultValue="gs://studio-8383673190-f5959.firebasestorage.app" disabled className="bg-muted/50 font-mono text-xs" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-xs uppercase font-black opacity-60">Cache TTL (Hours)</Label>
                    <Input type="number" defaultValue="24" />
                </div>
                 <div className="space-y-2">
                    <Label className="text-xs uppercase font-black opacity-60">Max Loop Duration (min)</Label>
                    <Input type="number" defaultValue="15" />
                </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-4">
         <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                <ShieldCheck className="h-5 w-5" /> AdOps Shield
            </CardTitle>
            <CardDescription>Security policies for advertising content and TV nodes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Content Approval Workflow</Label>
                    <p className="text-xs text-muted-foreground">Require administrator sign-off for all uploaded media assets before emission.</p>
                </div>
                <Switch />
            </div>
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Node Lockdown Mode</Label>
                    <p className="text-xs text-muted-foreground">Block all manual TV interactions and local player reloads.</p>
                </div>
                <Switch defaultChecked />
            </div>
            <div className="pt-4 border-t flex gap-4">
                <Button variant="outline" className="flex-1 gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                    <Database className="h-4 w-4" /> Purge Old Logs
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                    <RefreshCcw className="h-4 w-4" /> Reset Sync Keys
                </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="flex justify-end gap-4 pt-6 border-t">
          <Button variant="ghost" className="font-bold uppercase text-xs tracking-widest">Discard Changes</Button>
          <Button onClick={handleSave} disabled={loading} className="font-black uppercase text-xs tracking-widest px-8">
            {loading ? 'Saving...' : 'Apply System Config'}
          </Button>
      </div>
    </Tabs>
  );
}
