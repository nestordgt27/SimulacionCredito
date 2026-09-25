import { unRefreshToken } from '../../../../test/support/auth-builders';
import { crearPuertosAuth } from '../../../../test/support/auth-puertos';
import { CerrarSesionUseCase } from './cerrar-sesion.use-case';

describe('CerrarSesionUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosAuth>;
  let useCase: CerrarSesionUseCase;

  beforeEach(() => {
    puertos = crearPuertosAuth();
    useCase = new CerrarSesionUseCase(puertos.refreshTokens, puertos.generador, puertos.clock);
  });

  it('debe revocar la familia del refresh token cuando pertenece al usuario autenticado', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(unRefreshToken().deUsuario(1).build());

    await useCase.ejecutar({ usuarioId: 1, refreshToken: 'refresh-actual' });

    expect(puertos.refreshTokens.revocarFamilia).toHaveBeenCalledWith(
      'familia-1',
      puertos.clock.ahora(),
    );
  });

  it('debe ignorar el refresh token cuando pertenece a otro usuario', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(unRefreshToken().deUsuario(2).build());

    await useCase.ejecutar({ usuarioId: 1, refreshToken: 'ajeno' });

    expect(puertos.refreshTokens.revocarFamilia).not.toHaveBeenCalled();
  });

  it('debe terminar sin error cuando el refresh token no existe', async () => {
    puertos.refreshTokens.buscarPorHash.mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ usuarioId: 1, refreshToken: 'desconocido' }),
    ).resolves.toBeUndefined();
  });
});
