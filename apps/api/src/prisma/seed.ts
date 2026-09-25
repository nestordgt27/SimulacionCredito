import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Argon2PasswordHasher } from '../modules/auth/infrastructure/argon2-password-hasher';
import { sembrarUsuarioAdmin } from './seed/usuario-admin.seed';

// Punto de entrada de `prisma db seed` (configurado en prisma.config.ts).
// Prisma carga DATABASE_URL desde .env antes de ejecutarlo.
const logger = new Logger('Seed');

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de desarrollo no se ejecuta con NODE_ENV=production');
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
