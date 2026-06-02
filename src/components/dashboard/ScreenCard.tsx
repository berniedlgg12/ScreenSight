'use client';

import type { Device, Store } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Wifi, WifiOff, Settings, PlayCircle, Hash, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditScreenDialog } from './EditScreenDialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn, getDeviceConnectionState } from '@/lib/utils';

interface ScreenCardProps {
  device: Device;
  storeName: string;
  stores: Store[];
}

export function ScreenCard({ device, storeName, stores }: ScreenCardProps) {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const getRelativeTime = () => {
    try {
      if (device.lastHeartbeat && device.lastHeartbeat > 0) {
        return formatDistanceToNow(device.lastHeartbeat, { addSuffix: true });
      }
    } catch (e) { }
    return 'never';
  }

  const connectionState = getDeviceConnectionState(device.lastHeartbeat);
  const lastHeartbeatText = getRelativeTime();

  const stateConfig = {
    online: {
        color: 'bg-green-500',
        text: 'Online',
        badge: 'bg-green-500/10 text-green-500 border-green-500/20',
        icon: <Wifi className="mr-2 h-3.5 w-3.5 text-green-500" />
    },
    unstable: {
        color: 'bg-amber-500',
        text: 'Inestable',
        badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        icon: <AlertCircle className="mr-2 h-3.5 w-3.5 text-amber-500" />
    },
    offline: {
        color: 'bg-muted-foreground',
        text: 'Offline',
        badge: 'bg-muted text-muted-foreground border-muted-foreground/20',
        icon: <WifiOff className="mr-2 h-3.5 w-3.5" />
    }
  }[connectionState];

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/tv?id=${device.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
          title: 'Link Copied',
          description: `Direct access link for ${device.id} copied.`,
      });
    } catch (err) {
      toast({
          title: 'Copy Failed',
          variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Card className={cn("flex flex-col border-l-4 transition-all", connectionState !== 'offline' ? "border-l-primary/40" : "border-l-muted opacity-80 bg-muted/5")}>
        <CardHeader>
          <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                  <div className={cn(
                      "w-3 h-3 rounded-full mt-1", 
                      stateConfig.color, 
                      connectionState === 'online' ? 'animate-pulse' : ''
                  )}></div>
                  <CardTitle className="text-lg font-bold">{device.id}</CardTitle>
              </div>
              <Badge 
                className={cn("uppercase text-[9px] font-black", stateConfig.badge)}
                variant={'outline'}
              >
                  {stateConfig.text}
              </Badge>
          </div>
          <CardDescription className="font-medium text-foreground">{device.name}</CardDescription>
          <CardDescription className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">{storeName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 flex-grow">
          <div className="flex items-center text-xs text-muted-foreground font-medium">
            <PlayCircle className="mr-2 h-3.5 w-3.5" />
            <span className='truncate'>Mode: {device.playbackMode || 'inactive'}</span>
          </div>
           <div className="flex items-center text-xs text-muted-foreground font-medium">
            <Hash className="mr-2 h-3.5 w-3.5" />
            <span className='truncate'>Today Plays: {device.todayStats?.totalPlaybacks || 0}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground font-medium">
            {stateConfig.icon}
            <span className="ml-0">Activity: {lastHeartbeatText}</span>
          </div>
        </CardContent>
        <CardFooter className="gap-2 border-t pt-4">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-black uppercase" onClick={() => setEditDialogOpen(true)}>
            <Settings className="mr-2 h-3.5 w-3.5" />
            Manage
          </Button>
           <Button variant="ghost" size="sm" className="px-2 h-8" onClick={handleCopyLink}>
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>
      <EditScreenDialog 
          isOpen={isEditDialogOpen} 
          setIsOpen={setEditDialogOpen} 
          device={device}
          stores={stores} 
      />
    </>
  );
}
