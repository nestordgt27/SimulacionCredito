import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { RespuestaSesion } from '../auth/sesion';
import { sesionStore } from '../auth/sesion-store';

// Rutas relativas: en desarrollo las redirige el proxy de Vite y en Docker lo hará Nginx.
export const API_BASE_URL = '/api';

export const clienteHttp = axios.create({ baseURL: API_BASE_URL });

// El refresh usa un cliente sin interceptores para que un 401 del refresh no vuelva a
// disparar otro refresh.
const clienteRefresh = axios.create({ baseURL: API_BASE_URL });

// En estas rutas un 401 es la respuesta final (credenciales o refresh inválidos).
const RUTAS_SIN_REFRESH = ['/auth/login', '/auth/refresh'];

interface ConfiguracionReintentable extends InternalAxiosRequestConfig {
  _reintentada?: boolean;
}

let refreshEnCurso: Promise<string> | null = null;

/**
 * Rota el refresh token y devuelve el nuevo access token. Si varias peticiones reciben 401 a la
 * vez, comparten una sola llamada a /auth/refresh (el backend rechaza reutilizar un refresh
 * token ya rotado, así que dos refresh paralelos cerrarían la sesión).
 */
function refrescarSesion(): Promise<string> {
  refreshEnCurso ??= (async () => {
    const sesion = sesionStore.obtener();
    if (!sesion) {
      throw new Error('No hay sesión que refrescar');
    }
    try {
      const { data } = await clienteRefresh.post<RespuestaSesion>('/auth/refresh', {
        refreshToken: sesion.refreshToken,
      });
      sesionStore.guardar(data);
      return data.accessToken;
    } catch (error) {
      sesionStore.cerrar();
      throw error;
    }
  })().finally(() => {
    refreshEnCurso = null;
  });

  return refreshEnCurso;
}

clienteHttp.interceptors.request.use((configuracion) => {
  const accessToken = sesionStore.obtener()?.accessToken;
  if (accessToken) {
    configuracion.headers.Authorization = `Bearer ${accessToken}`;
  }
  return configuracion;
});

clienteHttp.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    throw error;
  }
  const configuracion = error.config as ConfiguracionReintentable;
  const esRutaSinRefresh = RUTAS_SIN_REFRESH.some((ruta) => configuracion.url?.startsWith(ruta));
  if (configuracion._reintentada || esRutaSinRefresh || !sesionStore.obtener()) {
    throw error;
  }

  configuracion._reintentada = true;
  let accessToken: string;
  try {
    accessToken = await refrescarSesion();
  } catch {
    // Se propaga el 401 original: la sesión ya se cerró y la app vuelve al login.
    throw error;
  }
  configuracion.headers.Authorization = `Bearer ${accessToken}`;
  return clienteHttp(configuracion);
});
