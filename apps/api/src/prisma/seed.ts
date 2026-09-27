import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Argon2PasswordHasher } from '../modules/auth/infrastructure/argon2-password-hasher';
import { sembradoPermitido } from './seed/sembrado-permitido';
import { sembrarUsuarioAdmin } from './seed/usuario-admin.seed';

// Punto de entrada de `prisma db seed` (configurado en prisma.config.ts).
// Prisma carga DATABASE_URL desde .env antes de ejecutarlo. En Docker se ejecuta compilado
// (node dist/prisma/seed.js) con las variables del contenedor.
const logger = new Logger('Seed');

async function main(): Promise<void> {
  if (!sembradoPermitido(process.env)) {
    throw new Error(
      'El seed de desarrollo no se ejecuta con NODE_ENV=production salvo con SEMBRAR_USUARIO_PRUEBA=true',
    );
  }

  const prisma = new PrismaClient();
  try {
    const admin = await sembrarUsuarioAdmin(prisma, new Argon2PasswordHasher());
    logger.log(`Usuario de prueba listo: ${admin.username} (rol ${admin.rol})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
