import { clienteHttp } from '../../../shared/api/cliente-http';
import type { RespuestaSesion } from '../../../shared/auth/sesion';
import type { Credenciales } from '../schemas/login.schema';

export async function iniciarSesion(credenciales: Credenciales): Promise<RespuestaSesion> {
  const { data } = await clienteHttp.post<RespuestaSesion>('/auth/login', credenciales);
  return data;
}

export async function cerrarSesion(refreshToken: string): Promise<void> {
  await clienteHttp.post('/auth/logout', { refreshToken });
}
