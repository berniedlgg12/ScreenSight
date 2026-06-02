'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useEffect } from 'react';

interface PreviewVideoDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  videoUrl: string | null;
  onClose?: () => void;
}

export function PreviewVideoDialog({ isOpen, setIsOpen, videoUrl, onClose }: PreviewVideoDialogProps) {
  
  useEffect(() => {
    if (!isOpen && onClose) {
      onClose();
    }
  }, [isOpen, onClose]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Video Preview</DialogTitle>
          <DialogDescription>
            Playing from: {videoUrl}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 aspect-video">
          {videoUrl && (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              autoPlay
              className="h-full w-full rounded-lg bg-black"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
