import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

export interface BaseDeDatosDePrueba {
  prisma: PrismaService;
  /** Módulo de la app, para obtener repositorios y el UnitOfWork reales. */
  app: TestingModule;
  cerrar(): Promise<void>;
}

// Levanta la app con .env.test (Jest define NODE_ENV=test), por lo que usa data/test.db.
export async function abrirBaseDeDatosDePrueba(): Promise<BaseDeDatosDePrueba> {
  const app: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  await app.init();

  return {
    prisma: app.get(PrismaService),
    app,
    cerrar: () => app.close(),
  };
}

// Barrera de seguridad: las pruebas nunca deben borrar la base de desarrollo.
function asegurarBaseDePrueba(): void {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.endsWith('/test.db')) {
    throw new Error(`Las pruebas solo pueden limpiar data/test.db, pero DATABASE_URL=${url}`);
  }
}

// Orden inverso a las llaves foráneas: primero los hijos, después los padres.
export async function limpiarBaseDeDatos(prisma: PrismaService): Promise<void> {
  asegurarBaseDePrueba();
  await prisma.$transaction([
    prisma.desembolso.deleteMany(),
    prisma.cuotaPlan.deleteMany(),
    prisma.credito.deleteMany(),
    prisma.solicitudHistorial.deleteMany(),
    prisma.solicitud.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.usuario.deleteMany(),
    prisma.secuencia.deleteMany(),
  ]);
}
