import { Argon2PasswordHasher } from '../../src/modules/auth/infrastructure/argon2-password-hasher';
import { sembrarUsuarioAdmin, USUARIO_ADMIN } from '../../src/prisma/seed/usuario-admin.seed';
import {
  abrirBaseDeDatosDePrueba,
  limpiarBaseDeDatos,
  type BaseDeDatosDePrueba,
} from './support/base-de-datos';

describe('Seed de usuario admin (integración con SQLite)', () => {
  const hasher = new Argon2PasswordHasher();
  let db: BaseDeDatosDePrueba;

  beforeAll(async () => {
    db = await abrirBaseDeDatosDePrueba();
  });

  beforeEach(async () => {
    await limpiarBaseDeDatos(db.prisma);
  });

  afterAll(async () => {
    await db.cerrar();
  });

  it('debe crear el usuario admin activo con la contraseña documentada hasheada', async () => {
    await sembrarUsuarioAdmin(db.prisma, hasher);

    const admin = await db.prisma.usuario.findUniqueOrThrow({
      where: { username: USUARIO_ADMIN.username },
    });
    expect(admin).toMatchObject({ rol: 'ADMIN', activo: true });
    expect(admin.passwordHash).not.toBe(USUARIO_ADMIN.password);
    await expect(hasher.verificar('Admin123!', admin.passwordHash)).resolves.toBe(true);
  });

  it('debe mantener un solo usuario admin cuando el seed se ejecuta dos veces', async () => {
    await sembrarUsuarioAdmin(db.prisma, hasher);

    await sembrarUsuarioAdmin(db.prisma, hasher);

    await expect(
      db.prisma.usuario.count({ where: { username: USUARIO_ADMIN.username } }),
    ).resolves.toBe(1);
  });

  it('debe restablecer la contraseña y reactivar el admin cuando ya existía modificado', async () => {
    const { id } = await sembrarUsuarioAdmin(db.prisma, hasher);
    await db.prisma.usuario.update({
      where: { id },
      data: { activo: false, passwordHash: await hasher.hash('OtraClave1!') },
    });

    const admin = await sembrarUsuarioAdmin(db.prisma, hasher);

    expect(admin.activo).toBe(true);
    await expect(hasher.verificar(USUARIO_ADMIN.password, admin.passwordHash)).resolves.toBe(true);
  });
});
