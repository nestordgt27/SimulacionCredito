import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../src/modules/auth/domain/refresh-token.repository';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '../../src/modules/auth/domain/usuario.repository';
import {
  abrirBaseDeDatosDePrueba,
  limpiarBaseDeDatos,
  type BaseDeDatosDePrueba,
} from './support/base-de-datos';
import { crearUsuario } from './support/datos-prueba';

const AHORA = new Date('2026-09-25T12:00:00Z');
const EN_7_DIAS = new Date('2026-10-02T12:00:00Z');

describe('Repositorios de auth (integración con SQLite)', () => {
  let db: BaseDeDatosDePrueba;
  let refreshTokens: RefreshTokenRepository;
  let usuarios: UsuarioRepository;
  let usuarioId: number;

  beforeAll(async () => {
    db = await abrirBaseDeDatosDePrueba();
    refreshTokens = db.app.get(REFRESH_TOKEN_REPOSITORY);
    usuarios = db.app.get(USUARIO_REPOSITORY);
  });

  beforeEach(async () => {
    await limpiarBaseDeDatos(db.prisma);
    usuarioId = (await crearUsuario(db.prisma, { username: 'admin' })).id;
  });

  afterAll(async () => {
    await db.cerrar();
  });

  describe('PrismaUsuarioRepository', () => {
    it('debe devolver el usuario de dominio cuando el username existe', async () => {
      const usuario = await usuarios.buscarPorUsername('admin');

      expect(usuario).toMatchObject({ id: usuarioId, username: 'admin', activo: true });
      expect(usuario?.puedeIniciarSesion()).toBe(true);
    });

    it('debe devolver null cuando el usuario no existe', async () => {
      await expect(usuarios.buscarPorUsername('nadie')).resolves.toBeNull();
      await expect(usuarios.buscarPorId(-1)).resolves.toBeNull();
    });
  });

  describe('PrismaRefreshTokenRepository', () => {
    const nuevo = (tokenHash: string, familiaId?: string) =>
      refreshTokens.crear({ usuarioId, tokenHash, expiraEn: EN_7_DIAS, familiaId });

    it('debe iniciar una familia nueva cuando no se indica familia', async () => {
      const primero = await nuevo('hash-1');
      const segundo = await nuevo('hash-2');

      expect(primero.familiaId).not.toBe(segundo.familiaId);
    });

    it('debe encontrar el token por su hash', async () => {
      const creado = await nuevo('hash-1');

      await expect(refreshTokens.buscarPorHash('hash-1')).resolves.toMatchObject({
        id: creado.id,
        familiaId: creado.familiaId,
        revocadoEn: null,
      });
    });

    it('debe rotar un token solo una vez aunque se intente dos veces', async () => {
      const actual = await nuevo('hash-1');
      const reemplazo = await nuevo('hash-2', actual.familiaId);

      const primeraVez = await refreshTokens.marcarRotado(actual.id, reemplazo.id, AHORA);
      const segundaVez = await refreshTokens.marcarRotado(actual.id, reemplazo.id, AHORA);

      expect([primeraVez, segundaVez]).toEqual([true, false]);
      await expect(
        db.prisma.refreshToken.findUniqueOrThrow({ where: { id: actual.id } }),
      ).resolves.toMatchObject({ revocadoEn: AHORA, reemplazadoPorId: reemplazo.id });
    });

    it('debe revocar solo los tokens de la familia indicada', async () => {
      const familiaA = await nuevo('hash-a1');
      await nuevo('hash-a2', familiaA.familiaId);
      const familiaB = await nuevo('hash-b1');

      await refreshTokens.revocarFamilia(familiaA.familiaId, AHORA);

      const revocados = await db.prisma.refreshToken.findMany({
        where: { revocadoEn: { not: null } },
      });
      expect(revocados.map((token) => token.familiaId)).toEqual([
        familiaA.familiaId,
        familiaA.familiaId,
      ]);
      await expect(refreshTokens.buscarPorHash('hash-b1')).resolves.toMatchObject({
        id: familiaB.id,
        revocadoEn: null,
      });
    });
  });
});
