import { http, HttpResponse } from 'msw';
import type { RespuestaSesion } from '../../shared/auth/sesion';

// Imitan las respuestas reales de la API (formato de éxito y de error del backend).
export const SESION_DE_PRUEBA: RespuestaSesion = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  tokenType: 'Bearer',
  expiresIn: 900,
  usuario: { id: 1, username: 'admin', nombreCompleto: 'Administrador de prueba', rol: 'ADMIN' },
};

export const errorApi = (status: number, error: string, message: string) =>
  HttpResponse.json({ statusCode: status, error, message }, { status });

export const handlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    const { username, password } = (await request.json()) as Record<string, string>;
    if (username === 'admin' && password === 'Admin123!') {
      return HttpResponse.json(SESION_DE_PRUEBA);
    }
    return errorApi(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos');
  }),
  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
];
