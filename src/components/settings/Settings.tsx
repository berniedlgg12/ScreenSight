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
import { Settings as SettingsIcon, Monitor, Activity, ShieldCheck, RefreshCcw, FlaskConical, Loader2 } from 'lucide-react';
import { useMode } from '@/hooks/use-mode';
import { useLanguage } from '@/hooks/use-language';
import { Language } from '@/lib/translations';
import { generateDemoDataset, clearDemoDataset } from '@/lib/demo-data-generator';

export function Settings() {
    const { toast } = useToast();
    const { mode, setMode } = useMode();
    const { language, setLanguage, t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [demoProgress, setDemoProgress] = useState("");

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

    const handleGenerateDemo = async () => {
        setDemoLoading(true);
        try {
            await generateDemoDataset((msg) => setDemoProgress(msg));
            toast({ 
                title: "Simulación Activada", 
                description: "La capa de inteligencia nacional de 1 año está lista." 
            });
            localStorage.setItem('screensight_demo_initialized', 'true');
        } catch (e: any) {
            toast({ 
                title: "Error de Simulación", 
                description: "Fallo al preparar el motor virtual.", 
                variant: "destructive" 
            });
        } finally {
            setDemoLoading(false);
            setDemoProgress("");
        }
    };

    const handleClearDemo = async () => {
        setDemoLoading(true);
        try {
            await clearDemoDataset((msg) => setDemoProgress(msg));
            localStorage.removeItem('screensight_demo_initialized');
            toast({ title: "Dataset Purgado", description: "El entorno virtual ha sido reiniciado." });
        } catch (e) {
            toast({ title: "Error", description: "No se pudo limpiar el entorno.", variant: "destructive" });
        } finally {
            setDemoLoading(false);
            setDemoProgress("");
        }
    };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 border">
        <TabsTrigger value="general" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <SettingsIcon className="h-3.5 w-3.5" /> {t('general')}
        </TabsTrigger>
        <TabsTrigger value="devices" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <Monitor className="h-3.5 w-3.5" /> {t('playback')}
        </TabsTrigger>
        <TabsTrigger value="network" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <Activity className="h-3.5 w-3.5" /> {t('network')}
        </TabsTrigger>
        <TabsTrigger value="demo" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest text-orange-500">
            <FlaskConical className="h-3.5 w-3.5" /> {t('demoMode')}
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" /> {t('security')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{t('platformIdentity')}</CardTitle>
            <CardDescription>Manage how ScreenSight appears across the organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="platform-name" className="text-xs uppercase font-black opacity-60">Platform Identifier</Label>
                    <Input id="platform-name" defaultValue="ScreenSight AdOps" className="font-bold" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="language" className="text-xs uppercase font-black opacity-60">{t('language')}</Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                        <SelectTrigger id="language" className="font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English (US)</SelectItem>
                            <SelectItem value="es">Español (ES)</SelectItem>
                            <SelectItem value="fr">Français (FR)</SelectItem>
                            <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                            <SelectItem value="zh">中文 (Mandarin)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="demo" className="space-y-4">
        <Card className="border-orange-500/20 bg-orange-500/5 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-500">
                        <FlaskConical className="h-5 w-5" /> Virtual Simulation Engine
                    </CardTitle>
                    <CardDescription>Zero-Write high performance demo mode.</CardDescription>
                </div>
                <div className="flex items-center gap-4 bg-background/50 p-2 rounded-lg border border-orange-500/20">
                    <span className={`text-[10px] font-black uppercase ${mode === 'real' ? 'text-primary' : 'text-muted-foreground'}`}>Real Mode</span>
                    <Switch 
                        checked={mode === 'demo'} 
                        onCheckedChange={(v) => setMode(v ? 'demo' : 'real')} 
                    />
                    <span className={`text-[10px] font-black uppercase ${mode === 'demo' ? 'text-orange-500' : 'text-muted-foreground'}`}>Demo Mode</span>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-600">Zero-Impact Demo</p>
                    <p className="text-xs text-amber-700/80 leading-relaxed">
                        This mode uses <strong>Virtual Data</strong> generated in memory. It does not write to Firestore and has zero cost. 
                        Perfect for presentations where you need to show thousands of nodes without risk of performance lag.
                    </p>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-orange-500/10">
                <div className="flex flex-col gap-2">
                    <Label className="text-xs uppercase font-black opacity-60">National Scale Projections</Label>
                    <p className="text-muted-foreground">Toggle the high-fidelity simulator (1,800 Stores / 12,450 TVs).</p>
                </div>
                <div className="flex gap-4">
                    <Button 
                        onClick={handleGenerateDemo} 
                        disabled={demoLoading}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2"
                    >
                        {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        {demoLoading ? "Calculando..." : "Project 1-Year National Simulation"}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleClearDemo}
                        disabled={demoLoading}
                        className="border-destructive/20 text-destructive hover:bg-destructive/10 font-bold"
                    >
                        Reset Virtual Environment
                    </Button>
                </div>
                {demoProgress && (
                    <div className="flex items-center gap-3 p-3 bg-background rounded border border-orange-500/10">
                        <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500">{demoProgress}</span>
                    </div>
                )}
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
          </CardContent>
        </Card>
      </TabsContent>
      
      <div className="flex justify-end gap-4 pt-6 border-t">
          <Button variant="ghost" className="font-bold uppercase text-xs tracking-widest">Discard Changes</Button>
          <Button onClick={handleSave} disabled={loading} className="font-black uppercase text-xs tracking-widest px-8">
            {loading ? 'Saving...' : t('saveChanges')}
          </Button>
      </div>
    </Tabs>
  );
}
