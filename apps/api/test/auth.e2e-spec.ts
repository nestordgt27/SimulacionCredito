import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { CLOCK } from '../src/core/domain/clock';
import { configureApp } from '../src/core/http/configure-app';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/argon2-password-hasher';
import { PrismaService } from '../src/prisma/prisma.service';
import { sembrarUsuarioAdmin, USUARIO_ADMIN } from '../src/prisma/seed/usuario-admin.seed';
import { limpiarBaseDeDatos } from './integration/support/base-de-datos';
import { DIAS, FakeClock, MINUTOS } from './support/fake-clock';

interface SesionHttp {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

const INICIO = '2026-09-25T12:00:00Z';

describe('Auth (e2e)', () => {
  const reloj = new FakeClock(INICIO);
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(reloj)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    reloj.fijar(INICIO);
    await limpiarBaseDeDatos(prisma);
    await sembrarUsuarioAdmin(prisma, new Argon2PasswordHasher());
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function login(): Promise<SesionHttp> {
    const respuesta = await http()
      .post('/api/auth/login')
      .send({ username: USUARIO_ADMIN.username, password: USUARIO_ADMIN.password })
      .expect(200);
    return respuesta.body as SesionHttp;
  }

  const refresh = (refreshToken: string) => http().post('/api/auth/refresh').send({ refreshToken });

  const logout = (sesion: SesionHttp) =>
    http()
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .send({ refreshToken: sesion.refreshToken });

  describe('POST /api/auth/login', () => {
    it('debe devolver un access token de 15 minutos y un refresh token cuando las credenciales son válidas', async () => {
      const sesion = await login();

      expect(sesion).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
      expect(sesion.accessToken.split('.')).toHaveLength(3);
      expect(sesion.refreshToken).toEqual(expect.any(String));
    });

    it('debe guardar el refresh token hasheado y nunca en texto plano', async () => {
      const { refreshToken } = await login();

      const [guardado] = await prisma.refreshToken.findMany();
      expect(guardado?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(guardado?.tokenHash).not.toBe(refreshToken);
    });

    it('debe responder 401 sin revelar el motivo cuando la contraseña es incorrecta', async () => {
      const respuesta = await http()
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'incorrecta' });

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toMatchObject({ error: 'CREDENCIALES_INVALIDAS' });
    });

    it('debe responder 401 con el mismo error cuando el usuario no existe', async () => {
      const respuesta = await http()
        .post('/api/auth/login')
        .send({ username: 'nadie', password: 'Admin123!' });

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toMatchObject({ error: 'CREDENCIALES_INVALIDAS' });
    });

    it('debe responder 400 cuando falta la contraseña', async () => {
      const respuesta = await http().post('/api/auth/login').send({ username: 'admin' });

      expect(respuesta.status).toBe(400);
    });
  });

  describe('JwtAuthGuard', () => {
    it('debe permitir las rutas públicas sin token', async () => {
      await http().get('/api/health').expect(200);
    });

    it('debe responder 401 en una ruta protegida sin token', async () => {
      const respuesta = await http().post('/api/auth/logout').send({ refreshToken: 'x' });

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toMatchObject({ error: 'ACCESS_TOKEN_INVALIDO' });
    });

    it('debe responder 401 cuando el access token expiró a los 15 minutos', async () => {
      const sesion = await login();

      reloj.avanzar(15 * MINUTOS);
      const respuesta = await logout(sesion);

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toMatchObject({ error: 'ACCESS_TOKEN_INVALIDO' });
    });

    it('debe aceptar el access token antes de que expire', async () => {
      const sesion = await login();

      reloj.avanzar(14 * MINUTOS);

      await logout(sesion).expect(204);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('debe rotar el refresh token y entregar uno nuevo', async () => {
      const sesion = await login();

      const respuesta = await refresh(sesion.refreshToken).expect(200);
      const nueva = respuesta.body as SesionHttp;

      expect(nueva.refreshToken).not.toBe(sesion.refreshToken);
      expect(nueva.accessToken).toEqual(expect.any(String));
    });

    it('debe invalidar el refresh token anterior después de rotarlo', async () => {
      const sesion = await login();
      await refresh(sesion.refreshToken).expect(200);

      const tokens = await prisma.refreshToken.findMany({ orderBy: { id: 'asc' } });

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ reemplazadoPorId: tokens[1]?.id });
      expect(tokens[0]?.revocadoEn).not.toBeNull();
      expect(tokens[1]?.revocadoEn).toBeNull();
    });

    it('debe permitir encadenar rotaciones con el último refresh token', async () => {
      const sesion = await login();
      const primera = (await refresh(sesion.refreshToken).expect(200)).body as SesionHttp;

      await refresh(primera.refreshToken).expect(200);
    });

    it('debe responder 401 y revocar toda la sesión cuando se reutiliza un refresh token rotado', async () => {
      const sesion = await login();
      const rotada = (await refresh(sesion.refreshToken).expect(200)).body as SesionHttp;

      const reutilizado = await refresh(sesion.refreshToken);
      const legitimo = await refresh(rotada.refreshToken);

      expect(reutilizado.status).toBe(401);
      expect(reutilizado.body).toMatchObject({ error: 'REFRESH_TOKEN_REUTILIZADO' });
      expect(legitimo.status).toBe(401);
    });

    it('debe responder 401 cuando el refresh token expiró a los 7 días', async () => {
      const sesion = await login();

      reloj.avanzar(7 * DIAS);
      const respuesta = await refresh(sesion.refreshToken);

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toMatchObject({ error: 'REFRESH_TOKEN_INVALIDO' });
    });

    it('debe responder 401 cuando el refresh token no existe', async () => {
      const respuesta = await refresh('token-inventado');

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toMatchObject({ error: 'REFRESH_TOKEN_INVALIDO' });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('debe responder 204 y dejar inutilizable el refresh token de la sesión', async () => {
      const sesion = await login();

      await logout(sesion).expect(204);
      const respuesta = await refresh(sesion.refreshToken);

      expect(respuesta.status).toBe(401);
    });

    it('debe cerrar solo la sesión indicada y mantener las demás sesiones del usuario', async () => {
      const escritorio = await login();
      const celular = await login();

      await logout(escritorio).expect(204);

      await refresh(celular.refreshToken).expect(200);
    });
  });
});
