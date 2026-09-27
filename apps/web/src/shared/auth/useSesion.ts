import { useSyncExternalStore } from 'react';
import type { Sesion } from './sesion';
import { sesionStore } from './sesion-store';

export function useSesion(): Sesion | null {
  return useSyncExternalStore(sesionStore.suscribir, sesionStore.obtener);
}
