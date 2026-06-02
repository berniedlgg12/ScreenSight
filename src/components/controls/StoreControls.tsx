'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Store, TVCommand, Device } from '@/lib/types';
import { useFleet } from '@/hooks/use-fleet';
import { 
    Play, 
    Pause, 
    RotateCcw, 
    RefreshCw, 
    Power, 
    ShieldAlert, 
    Loader2, 
    Wifi, 
    MapPin,
    MonitorPlay,
    Tv,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn, getDeviceConnectionState } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StoreControlsProps {
  store: Store;
}

export function StoreControls({ store }: StoreControlsProps) {
  const { devices, regions } = useFleet();
  const { toast } = useToast();
  const [sending, setSending] = useState<string | null>(null);

  const storeDevices = devices.filter(d => d.storeId === store.id);
  const onlineDevices = storeDevices.filter(d => getDeviceConnectionState(d.lastHeartbeat) === 'online');
  const region = regions.find(r => r.id === store.regionId);

  // EXTREMELY IMPORTANT: We derive playback state from TV telemetry (currentPlaybackMode)
  // not from local optimistic state.
  const allDevicesInMode = (mode: string) => {
    if (storeDevices.length === 0) return false;
    return storeDevices.every(d => d.currentPlaybackMode === mode);
  };

  const sendCommand = async (command: TVCommand['command'], scope: "store" | "device", targetId?: string, payload = {}) => {
    setSending(command);
    const cmdId = `cmd-${Date.now()}`;
    const cmd: TVCommand = {
      command,
      commandId: cmdId,
      createdAt: Date.now(),
      createdBy: "dashboard",
      scope,
      payload
    };

    try {
      if (scope === 'store') {
        await updateDoc(doc(db, 'stores', store.id), { tvCommand: cmd });
      } else if (scope === 'device' && targetId) {
        await updateDoc(doc(db, 'devices', targetId), { tvCommand: cmd });
      }
      
      toast({ 
        title: `Señal Enviada: ${command.toUpperCase()}`, 
        description: `Esperando ACK de la flota...` 
      });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo emitir la señal.', variant: 'destructive' });
    } finally {
      setSending(null);
    }
  };

  const handleSOS = () => {
      const msg = prompt("Mensaje de Emergencia:");
      if (msg) sendCommand('emergency', 'store', undefined, { message: msg });
  };

  const controlButtons = [
    { id: 'play', icon: Play, label: 'PLAY', color: 'text-emerald-500', activeBg: 'bg-emerald-500', playbackMode: 'playing' },
    { id: 'pause', icon: Pause, label: 'PAUSA', color: 'text-amber-500', activeBg: 'bg-amber-500', playbackMode: 'paused' },
    { id: 'standby', icon: Power, label: 'SLEEP', color: 'text-rose-500', activeBg: 'bg-rose-500', playbackMode: 'standby' },
    { id: 'resync', icon: RefreshCw, label: 'SYNC', color: 'text-sky-500', activeBg: 'bg-sky-500' },
    { id: 'reload', icon: RotateCcw, label: 'RELOAD', color: 'text-primary', activeBg: 'bg-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card border-primary/10 overflow-hidden">
            <CardHeader className="pb-2 bg-muted/5 border-b">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Ubicación Operativa
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex flex-col">
                    <span className="text-2xl font-black uppercase tracking-tighter">{store.name}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">{store.city}, {store.state}</span>
                    <Badge variant="outline" className="mt-2 w-fit font-mono border-primary/20 text-primary">REGION: {region?.name || 'N/A'}</Badge>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-card border-primary/10 overflow-hidden">
            <CardHeader className="pb-2 bg-muted/5 border-b">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                    <Wifi className="h-4 w-4" /> Salud de Conexión
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">{onlineDevices.length}</span>
                    <span className="text-xl font-bold text-muted-foreground mb-1">/ {storeDevices.length}</span>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground mt-1">Smart TVs Activas</p>
            </CardContent>
        </Card>

        <Card className="bg-card border-primary/10 overflow-hidden">
            <CardHeader className="pb-2 bg-muted/5 border-b">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                    <MonitorPlay className="h-4 w-4" /> Estado Operativo
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex flex-col gap-1">
                    <span className={cn(
                        "text-2xl font-black uppercase",
                        allDevicesInMode('playing') ? "text-emerald-500" :
                        allDevicesInMode('paused') ? "text-amber-500" :
                        allDevicesInMode('standby') ? "text-rose-500" :
                        "text-orange-500"
                    )}>
                        {allDevicesInMode('playing') ? 'REPRODUCIENDO' : 
                         allDevicesInMode('paused') ? 'EN PAUSA' :
                         allDevicesInMode('standby') ? 'REPOSO' : 'MIXTO/SYNC'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                        Sincronización en tiempo real vía Firebase
                    </span>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-muted/5">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                        Control Masivo de Sucursal
                    </CardTitle>
                    <p className="text-xs font-medium text-muted-foreground">Las órdenes se ejecutan en todas las TVs de la tienda simultáneamente.</p>
                </div>
                <Badge variant="outline" className="border-primary/40 font-black uppercase">Store ID: {store.id}</Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {controlButtons.map((btn) => {
                    const isActive = btn.playbackMode && allDevicesInMode(btn.playbackMode);
                    return (
                        <Button
                            key={btn.id}
                            variant="outline"
                            className={cn(
                                "h-16 flex flex-col gap-1 font-black uppercase text-[10px] transition-all duration-300",
                                isActive 
                                    ? `${btn.activeBg} text-white border-none shadow-lg scale-105` 
                                    : `bg-background hover:bg-muted/10`
                            )}
                            onClick={() => sendCommand(btn.id as any, 'store')}
                            disabled={!!sending || storeDevices.length === 0}
                        >
                            {sending === btn.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <btn.icon className={cn("h-5 w-5", isActive ? "text-white" : btn.color)} />
                            )}
                            {btn.label}
                        </Button>
                    );
                })}
                <Button
                    variant="destructive"
                    className={cn(
                        "h-16 flex flex-col gap-1 font-black uppercase text-[10px] transition-all",
                        allDevicesInMode('emergency') ? "animate-pulse bg-red-600" : ""
                    )}
                    onClick={handleSOS}
                    disabled={!!sending || storeDevices.length === 0}
                >
                    <ShieldAlert className="h-5 w-5" />
                    EMERGENCIA
                </Button>
            </div>
            
            <div className="mt-6 flex gap-2 pt-4 border-t border-primary/10">
                <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase h-7 opacity-60 hover:opacity-100" onClick={() => sendCommand('clear_emergency', 'store')}>
                    Limpiar Alertas
                </Button>
                <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase h-7 opacity-60 hover:opacity-100" onClick={() => sendCommand('wake', 'store')}>
                    Despertar Flota
                </Button>
                <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase h-7 opacity-60 hover:opacity-100" onClick={() => sendCommand('restart', 'store')}>
                    Reiniciar Loop
                </Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="text-lg font-black uppercase">Inventario NOC de Pantallas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-black uppercase text-[10px]">Nodo ID</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Nombre</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Conexión</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Motor Playback</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Telemetría NOC</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Resultado Comando</TableHead>
                        <TableHead className="font-black uppercase text-[10px] text-right">Acciones Rápidas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {storeDevices.length > 0 ? (
                        storeDevices.map((device) => {
                            const conn = getDeviceConnectionState(device.lastHeartbeat);
                            const isPending = store.tvCommand && device.lastCommandReceived !== store.tvCommand.commandId;

                            return (
                                <TableRow key={device.id} className={cn(conn === 'offline' && "opacity-50")}>
                                    <TableCell className="font-mono font-bold text-xs">{device.id}</TableCell>
                                    <TableCell className="font-black uppercase text-xs">{device.name}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="outline" 
                                            className={cn(
                                                "uppercase text-[9px] font-black",
                                                conn === 'online' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                conn === 'unstable' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                "bg-muted text-muted-foreground border-muted-foreground/20"
                                            )}
                                        >
                                            {conn}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase",
                                                device.currentPlaybackMode === 'playing' ? "text-emerald-500" :
                                                device.currentPlaybackMode === 'paused' ? "text-amber-500" :
                                                device.currentPlaybackMode === 'emergency' ? "text-red-500 animate-pulse" :
                                                device.currentPlaybackMode === 'standby' ? "text-rose-400" :
                                                "text-muted-foreground"
                                            )}>{device.currentPlaybackMode || 'booting...'}</span>
                                            <span className="text-[9px] text-muted-foreground font-mono">
                                                v: {device.currentPlaylistId?.slice(-4) || '---'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                Drift: <span className={cn(
                                                    (device.driftSeconds || 0) > 2 ? "text-red-500" : "text-emerald-500"
                                                )}>{device.driftSeconds?.toFixed(2)}s</span>
                                            </span>
                                            <span className="text-[9px] font-black uppercase text-muted-foreground">
                                                Offset: {device.currentOffset?.toFixed(1)}s
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1">
                                                {isPending ? (
                                                    <Clock className="h-3 w-3 text-amber-500 animate-spin" />
                                                ) : device.lastCommandStatus === 'success' ? (
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                ) : device.lastCommandStatus === 'error' ? (
                                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                                ) : null}
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase",
                                                    isPending ? "text-amber-500" :
                                                    device.lastCommandStatus === 'success' ? "text-emerald-500" : "text-muted-foreground"
                                                )}>
                                                    {isPending ? 'PENDIENTE' : device.lastCommandStatus ? device.lastCommandStatus : 'SIN SEÑAL'}
                                                </span>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground font-mono">
                                                ID: {device.lastCommandReceived?.slice(-6) || '---'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" title="Sincronizar" onClick={() => sendCommand('resync', 'device', device.id)}>
                                            <RefreshCw className="h-3 w-3 text-sky-500" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-7 w-7" title="Recargar App" onClick={() => sendCommand('reload', 'device', device.id)}>
                                            <RotateCcw className="h-3 w-3 text-primary" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-7 w-7" title="Sleep" onClick={() => sendCommand('standby', 'device', device.id)}>
                                            <Power className="h-3 w-3 text-rose-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center">
                                <div className="flex flex-col items-center gap-2 opacity-30">
                                    <Tv className="h-8 w-8" />
                                    <p className="font-black uppercase text-xs">No hay TVs registradas en esta sucursal.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}