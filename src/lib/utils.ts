import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DeviceConnectionState = 'online' | 'unstable' | 'offline';

/**
 * Determina el estado de conexión exacto basado en la antigüedad del latido.
 * - Online: < 35s (Normal)
 * - Inestable: 35s - 60s (Retraso de red)
 * - Offline: > 60s (Desconectado)
 */
export function getDeviceConnectionState(lastHeartbeat?: number): DeviceConnectionState {
  if (!lastHeartbeat || lastHeartbeat <= 0) return 'offline';
  const age = Date.now() - Number(lastHeartbeat);

  if (age < 35000) return 'online';
  if (age < 60000) return 'unstable';
  return 'offline';
}

/**
 * Helper booleano para compatibilidad. 
 * Se considera "online" (visible/operable) si no está totalmente offline.
 */
export function isDeviceOnline(lastHeartbeat?: number): boolean {
  return getDeviceConnectionState(lastHeartbeat) !== 'offline';
}