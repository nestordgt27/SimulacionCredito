import type { RespuestaSesion } from '../shared/auth/sesion';
import { sesionStore } from '../shared/auth/sesion-store';
import { SESION_DE_PRUEBA } from './msw/handlers';

/** Inicia una sesión de prueba (tokens `access-1` / `refresh-1`). */
export function conSesion(cambios: Partial<RespuestaSesion> = {}): void {
  sesionStore.guardar({ ...SESION_DE_PRUEBA, ...cambios });
}
