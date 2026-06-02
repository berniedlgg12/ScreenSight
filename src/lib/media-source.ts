import type { Media } from './types';

/**
 * SOURCE DEPRECATIVO: Se recomienda utilizar la biblioteca de medios 
 * cargada dinámicamente desde Firebase Storage.
 * Los archivos locales pesados han sido removidos para compatibilidad con GitHub.
 */

export const localMediaSource: Media[] = [
  {
    id: 'placeholder-system',
    title: 'Sistema en Espera',
    fileName: 'reposo.mp4',
    downloadURL: 'https://picsum.photos/seed/placeholder/1920/1080', // Placeholder
    duration: 10,
    sponsorId: 'coppel-internal',
    sponsorName: 'COPPEL INTERNAL',
    status: 'active',
    type: 'video',
    createdAt: Date.now(),
  }
];

export const localMediaSourceMap = new Map<string, Media>(localMediaSource.map(item => [item.id, item]));
