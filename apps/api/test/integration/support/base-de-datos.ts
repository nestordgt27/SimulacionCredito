import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

export interface BaseDeDatosDePrueba {
  prisma: PrismaService;
  cerrar(): Promise<void>;
}

// Levanta la app con .env.test (Jest define NODE_ENV=test), por lo que usa data/test.db.
export async function abrirBaseDeDatosDePrueba(): Promise<BaseDeDatosDePrueba> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  await moduleRef.init();

  return {
    prisma: moduleRef.get(PrismaService),
    cerrar: () => moduleRef.close(),
  };
}

// Orden inverso a las llaves foráneas: primero los hijos, después los padres.
export async function limpiarBaseDeDatos(prisma: PrismaService): Promise<void> {
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
