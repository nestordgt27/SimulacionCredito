import type { PrismaClient, Usuario } from '@prisma/client';
import type { PasswordHasher } from '../../modules/auth/domain/password-hasher';

// Credenciales de prueba SOLO para desarrollo (documentadas en el README).
// El rol se tipará cuando el módulo auth defina los roles.
export const USUARIO_ADMIN = {
  username: 'admin',
  password: 'Admin123!',
  nombreCompleto: 'Administrador de prueba',
  rol: 'ADMIN',
} as const;

// Idempotente: si el usuario ya existe, restablece sus datos y la contraseña documentada.
export async function sembrarUsuarioAdmin(
  prisma: PrismaClient,
  hasher: PasswordHasher,
): Promise<Usuario> {
  const { username, password, nombreCompleto, rol } = USUARIO_ADMIN;
  const passwordHash = await hasher.hash(password);

  return prisma.usuario.upsert({
    where: { username },
    create: { username, passwordHash, nombreCompleto, rol },
    update: { passwordHash, nombreCompleto, rol, activo: true },
  });
}
