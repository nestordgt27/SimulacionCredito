import { http, HttpResponse } from 'msw';
import { errorApi, SESION_DE_PRUEBA } from '../../test/msw/handlers';
import { server } from '../../test/msw/server';
import { conSesion } from '../../test/sesion';
import { sesionStore } from '../auth/sesion-store';
import { clienteHttp } from './cliente-http';

const SESION_ROTADA = { ...SESION_DE_PRUEBA, accessToken: 'access-2', refreshToken: 'refresh-2' };

// Recurso protegido que solo acepta el access token indicado.
function recursoQueAcepta(accessTokenValido: string) {
  const llamadas: (string | null)[] = [];
  server.use(
    http.get('*/api/recurso', ({ request }) => {
      const autorizacion = request.headers.get('Authorization');
      llamadas.push(autorizacion);
      return autorizacion === `Bearer ${accessTokenValido}`
        ? HttpResponse.json({ ok: true })
        : errorApi(401, 'ACCESS_TOKEN_INVALIDO', 'El token de acceso no es válido o expiró');
    }),
  );
  return llamadas;
}

// Endpoint de refresh que cuenta las llamadas y responde según `responder`.
function refreshQue(responder: () => Response) {
  const cuerpos: unknown[] = [];
  server.use(
    http.post('*/api/auth/refresh', async ({ request }) => {
      cuerpos.push(await request.json());
      return responder();
    }),
  );
  return cuerpos;
}

const rotar = () => HttpResponse.json(SESION_ROTADA);
const rechazarRefresh = () =>
  errorApi(401, 'REFRESH_TOKEN_REUTILIZADO', 'El refresh token ya fue usado');

describe('clienteHttp', () => {
  it('debe adjuntar el access token de la sesión en Authorization', async () => {
    conSesion();
    const llamadas = recursoQueAcepta('access-1');

    await clienteHttp.get('/recurso');

    expect(llamadas).toEqual(['Bearer access-1']);
  });

  it('debe no enviar Authorization cuando no hay sesión', async () => {
    const llamadas = recursoQueAcepta('access-1');

    await expect(clienteHttp.get('/recurso')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(llamadas).toEqual([null]);
  });

  describe('ante un 401', () => {
    it('debe refrescar con el refresh token y reintentar con el nuevo access token', async () => {
      conSesion();
      const llamadas = recursoQueAcepta('access-2');
      const refrescos = refreshQue(rotar);

      const respuesta = await clienteHttp.get('/recurso');

      expect(respuesta.data).toEqual({ ok: true });
      expect(refrescos).toEqual([{ refreshToken: 'refresh-1' }]);
      expect(llamadas).toEqual(['Bearer access-1', 'Bearer access-2']);
    });

    it('debe guardar los tokens rotados en la sesión', async () => {
      conSesion();
      recursoQueAcepta('access-2');
      refreshQue(rotar);

      await clienteHttp.get('/recurso');

      expect(sesionStore.obtener()).toMatchObject({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      });
    });

    it('debe hacer un solo refresh cuando varias peticiones reciben 401 a la vez', async () => {
      conSesion();
      recursoQueAcepta('access-2');
      const refrescos = refreshQue(rotar);

      const respuestas = await Promise.all([
        clienteHttp.get('/recurso'),
        clienteHttp.get('/recurso'),
        clienteHttp.get('/recurso'),
      ]);

      expect(respuestas.map((r) => r.status)).toEqual([200, 200, 200]);
      expect(refrescos).toHaveLength(1);
    });

    it('debe reintentar una sola vez aunque la petición vuelva a dar 401', async () => {
      conSesion();
      const llamadas = recursoQueAcepta('nunca-valido');
      // Solo el primer refresh funciona: si el interceptor reintentara de más, fallaría
      // rápido en vez de quedar en un ciclo infinito de refresh y reintento.
      let refreshDisponible = true;
      const refrescos = refreshQue(() => {
        const respuesta = refreshDisponible ? rotar() : rechazarRefresh();
        refreshDisponible = false;
        return respuesta;
      });

      await expect(clienteHttp.get('/recurso')).rejects.toMatchObject({
        response: { status: 401 },
      });
      expect(refrescos).toHaveLength(1);
      expect(llamadas).toHaveLength(2);
    });

    it('debe cerrar la sesión y propagar el 401 cuando el refresh falla', async () => {
      conSesion();
      recursoQueAcepta('access-2');
      refreshQue(rechazarRefresh);

      await expect(clienteHttp.get('/recurso')).rejects.toMatchObject({
        response: { status: 401 },
      });
      expect(sesionStore.obtener()).toBeNull();
    });

    it('debe no intentar refresh cuando falla el login', async () => {
      conSesion();
      const refrescos = refreshQue(rotar);

      await expect(
        clienteHttp.post('/auth/login', { username: 'admin', password: 'mala' }),
      ).rejects.toMatchObject({ response: { status: 401 } });
      expect(refrescos).toHaveLength(0);
    });

    it('debe no intentar refresh cuando no hay sesión', async () => {
      recursoQueAcepta('access-2');
      const refrescos = refreshQue(rotar);

      await expect(clienteHttp.get('/recurso')).rejects.toMatchObject({
        response: { status: 401 },
      });
      expect(refrescos).toHaveLength(0);
    });
  });

  it('debe recuperar el access token con un refresh tras recargar la página', async () => {
    conSesion();
    sesionStore.restaurar(); // Simula la recarga: solo queda lo persistido, sin access token.
    const llamadas = recursoQueAcepta('access-2');
    refreshQue(rotar);

    await clienteHttp.get('/recurso');

    expect(llamadas).toEqual([null, 'Bearer access-2']);
  });

  it('debe propagar sin refrescar los errores que no son 401', async () => {
    conSesion();
    server.use(http.get('*/api/recurso', () => errorApi(409, 'CONFLICTO', 'Conflicto')));
    const refrescos = refreshQue(rotar);

    await expect(clienteHttp.get('/recurso')).rejects.toMatchObject({
      response: { status: 409 },
    });
    expect(refrescos).toHaveLength(0);
  });
});
