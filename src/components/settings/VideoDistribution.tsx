'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Store } from '@/lib/types';
import { Upload } from 'lucide-react';

interface VideoDistributionProps {
  stores: Store[];
}

export function VideoDistribution({ stores }: VideoDistributionProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [stateFilter, setStateFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const states = useMemo(() => [...new Set(stores.map(s => s.state))].sort(), [stores]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };

  const handleDistribute = async () => {
    if (!videoFile) {
      toast({
        title: 'No video selected',
        description: 'Please select a video file to distribute.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // In a real application, you would upload the file to a storage service (like Firebase Storage)
    // and then update the Firestore documents for the filtered devices with the new video URL.
    console.log('Distributing video:', videoFile.name);
    console.log('Filters:', { state: stateFilter, store: storeFilter });

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: 'Distribution Started',
      description: `The video "${videoFile.name}" is being distributed to the selected screens.`,
    });

    setLoading(false);
    setVideoFile(null);
    // You might want to reset the file input visually, which is a bit tricky.
    // A common approach is to manage the input's key to force a re-render.
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Distribution</CardTitle>
        <CardDescription>Upload a video and distribute it to a group of screens.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="video-upload">Video File</Label>
          <Input id="video-upload" type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} />
        </div>

        <div className="space-y-4">
            <h3 className="text-md font-medium">Distribution Filters</h3>
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Label className="min-w-fit">State:</Label>
                    <Select value={stateFilter} onValueChange={(value) => { setStateFilter(value); setStoreFilter('all'); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Label className="min-w-fit">Store:</Label>
                    <Select value={storeFilter} onValueChange={setStoreFilter} disabled={stateFilter === 'all' && storeFilter === 'all'}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Stores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stores</SelectItem>
                            {stores.filter(store => stateFilter === 'all' || store.state === stateFilter).map(store => (
                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        <Button onClick={handleDistribute} disabled={loading || !videoFile}>
          {loading ? 'Distributing...' : 'Distribute Video'}
          <Upload className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
