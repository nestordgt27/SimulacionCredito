import { unRefreshToken, unUsuario } from '../../../../test/support/auth-builders';
import {
  crearPuertosAuth,
  ID_REFRESH_TOKEN_NUEVO,
  REFRESH_TOKEN_NUEVO,
} from '../../../../test/support/auth-puertos';
import { FakeUnitOfWork } from '../../../../test/support/fake-unit-of-work';
import { RefreshTokenInvalidoError, RefreshTokenReutilizadoError } from '../domain/errores';
import { RefrescarSesionUseCase } from './refrescar-sesion.use-case';

describe('RefrescarSesionUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosAuth>;
  let useCase: RefrescarSesionUseCase;

  beforeEach(() => {
    puertos = crearPuertosAuth();
    useCase = new RefrescarSesionUseCase(
      puertos.refreshTokens,
      puertos.usuarios,
      puertos.generador,
      new FakeUnitOfWork(),
      puertos.clock,
      puertos.emisor,
    );
    puertos.usuarios.buscarPorId.mockResolvedValue(unUsuario().build());
  });

  describe('cuando el refresh token está vigente', () => {
    beforeEach(() => {
      puertos.refreshTokens.buscarPorHash.mockResolvedValue(unRefreshToken().conId(10).build());
    });

    it('debe devolver una sesión nueva con otro refresh token', async () => {
      const sesion = await useCase.ejecutar('refresh-actual');

      expect(sesion).toMatchObject({
        accessToken: 'access-jwt',
        refreshToken: REFRESH_TOKEN_NUEVO,
      });
    });

    it('debe buscar el token por su hash y no por el valor en texto plano', async () => {
      await useCase.ejecutar('refresh-actual');

      expect(puertos.refreshTokens.buscarPorHash).toHaveBeenCalledWith('hash(refresh-actual)');
    });

    it('debe crear el nuevo refresh token hasheado en la misma familia', async () => {
      await useCase.ejecutar('refresh-actual');

      expect(puertos.refreshTokens.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHash: `hash(${REFRESH_TOKEN_NUEVO})`,
          familiaId: 'familia-1',
        }),
      );
    });

    it('debe revocar el token anterior enlazándolo con su reemplazo', async () => {
      await useCase.ejecutar('refresh-actual');

      expect(puertos.refreshTokens.marcarRotado).toHaveBeenCalledWith(
        10,
        ID_REFRESH_TOKEN_NUEVO,
        puertos.clock.ahora(),
      );
    });
  });

  it('debe lanzar RefreshTokenInvalidoError cuando el token no existe', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(null);

    await expect(useCase.ejecutar('desconocido')).rejects.toThrow(RefreshTokenInvalidoError);
  });

  it('debe lanzar RefreshTokenInvalidoError sin revocar la familia cuando el token expiró', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(
      unRefreshToken().expiraEn('2026-09-25T12:00:00Z').build(),
    );

    await expect(useCase.ejecutar('expirado')).rejects.toThrow(RefreshTokenInvalidoError);
    expect(puertos.refreshTokens.revocarFamilia).not.toHaveBeenCalled();
  });

  it('debe revocar toda la familia cuando se reutiliza un token ya rotado', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(unRefreshToken().revocado().build());

    await expect(useCase.ejecutar('reutilizado')).rejects.toThrow(RefreshTokenReutilizadoError);
    expect(puertos.refreshTokens.revocarFamilia).toHaveBeenCalledWith(
      'familia-1',
      puertos.clock.ahora(),
    );
  });

  it('debe tratar como reutilización un token revocado aunque también haya expirado', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(
      unRefreshToken().revocado().expiraEn('2026-09-01T00:00:00Z').build(),
    );

    await expect(useCase.ejecutar('viejo')).rejects.toThrow(RefreshTokenReutilizadoError);
  });

  it('debe no emitir tokens cuando se reutiliza un token ya rotado', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(unRefreshToken().revocado().build());

    await useCase.ejecutar('reutilizado').catch(() => undefined);

    expect(puertos.refreshTokens.crear).not.toHaveBeenCalled();
  });

  it('debe revocar la familia cuando otra petición rotó el mismo token al mismo tiempo', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(unRefreshToken().build());
    puertos.refreshTokens.marcarRotado.mockResolvedValue(false);

    await expect(useCase.ejecutar('concurrente')).rejects.toThrow(RefreshTokenReutilizadoError);
    expect(puertos.refreshTokens.revocarFamilia).toHaveBeenCalledWith(
      'familia-1',
      puertos.clock.ahora(),
    );
  });

  it('debe revocar la familia y rechazar cuando el usuario fue desactivado', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(unRefreshToken().build());
    puertos.usuarios.buscarPorId.mockResolvedValue(unUsuario().inactivo().build());

    await expect(useCase.ejecutar('vigente')).rejects.toThrow(RefreshTokenInvalidoError);
    expect(puertos.refreshTokens.revocarFamilia).toHaveBeenCalledWith(
      'familia-1',
      puertos.clock.ahora(),
    );
  });
});
