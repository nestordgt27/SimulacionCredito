import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { CLOCK } from '../../src/core/domain/clock';
import { configureApp } from '../../src/core/http/configure-app';
import { Argon2PasswordHasher } from '../../src/modules/auth/infrastructure/argon2-password-hasher';
import { PrismaService } from '../../src/prisma/prisma.service';
import { sembrarUsuarioAdmin, USUARIO_ADMIN } from '../../src/prisma/seed/usuario-admin.seed';
import { limpiarBaseDeDatos } from '../integration/support/base-de-datos';
import type { FakeClock } from './fake-clock';

export interface AppE2E {
  app: INestApplication<App>;
  prisma: PrismaService;
  http(): ReturnType<typeof request>;
  /** Limpia test.db, siembra el admin y devuelve su access token. */
  reiniciarConAdmin(): Promise<string>;
}

// App completa sobre data/test.db con el Clock reemplazado por un reloj controlable.
export async function crearAppE2E(reloj: FakeClock): Promise<AppE2E> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CLOCK)
    .useValue(reloj)
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  const http = () => request(app.getHttpServer());

  return {
    app,
    prisma,
    http,
    async reiniciarConAdmin() {
      await limpiarBaseDeDatos(prisma);
      await sembrarUsuarioAdmin(prisma, new Argon2PasswordHasher());
      const respuesta = await http()
        .post('/api/auth/login')
        .send({ username: USUARIO_ADMIN.username, password: USUARIO_ADMIN.password })
        .expect(200);
      return (respuesta.body as { accessToken: string }).accessToken;
    },
  };
}
