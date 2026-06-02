
'use client';

import { Settings } from '@/components/settings/Settings';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SettingsPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/10">
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-8 pt-6 pb-24 space-y-6 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between space-y-2 border-b border-primary/10 pb-6">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">System Configuration</h1>
              <p className="text-muted-foreground font-medium">Global AdOps parameters and network preferences.</p>
            </div>
          </div>
          <Settings />
        </div>
      </ScrollArea>
    </div>
  );
}
