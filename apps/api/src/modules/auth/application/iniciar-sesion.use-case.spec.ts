import { unUsuario } from '../../../../test/support/auth-builders';
import { crearPuertosAuth, REFRESH_TOKEN_NUEVO } from '../../../../test/support/auth-puertos';
import { CredencialesInvalidasError } from '../domain/errores';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';

describe('IniciarSesionUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosAuth>;
  let useCase: IniciarSesionUseCase;

  beforeEach(() => {
    puertos = crearPuertosAuth();
    useCase = new IniciarSesionUseCase(puertos.usuarios, puertos.hasher, puertos.emisor);
  });

  it('debe devolver access y refresh token cuando las credenciales son válidas', async () => {
    puertos.usuarios.buscarPorUsername.mockResolvedValue(unUsuario().build());
    puertos.hasher.verificar.mockResolvedValue(true);

    const sesion = await useCase.ejecutar({ username: 'admin', password: 'Admin123!' });

    expect(sesion).toEqual({
      accessToken: 'access-jwt',
      refreshToken: REFRESH_TOKEN_NUEVO,
      tokenType: 'Bearer',
      expiresIn: 900,
      usuario: { id: 1, username: 'admin', nombreCompleto: 'Administrador', rol: 'ADMIN' },
    });
  });

  it('debe guardar solo el hash del refresh token en una familia nueva con vencimiento a 7 días', async () => {
    puertos.usuarios.buscarPorUsername.mockResolvedValue(unUsuario().build());
    puertos.hasher.verificar.mockResolvedValue(true);

    await useCase.ejecutar({ username: 'admin', password: 'Admin123!' });

    expect(puertos.refreshTokens.crear).toHaveBeenCalledWith({
      usuarioId: 1,
      tokenHash: `hash(${REFRESH_TOKEN_NUEVO})`,
      expiraEn: new Date('2026-10-02T12:00:00Z'),
      familiaId: undefined,
    });
  });

  it('debe lanzar CredencialesInvalidasError cuando el usuario no existe', async () => {
    puertos.usuarios.buscarPorUsername.mockResolvedValue(null);

    const iniciar = useCase.ejecutar({ username: 'nadie', password: 'Admin123!' });

    await expect(iniciar).rejects.toThrow(CredencialesInvalidasError);
  });

  it('debe lanzar CredencialesInvalidasError cuando la contraseña es incorrecta', async () => {
    puertos.usuarios.buscarPorUsername.mockResolvedValue(unUsuario().build());
    puertos.hasher.verificar.mockResolvedValue(false);

    const iniciar = useCase.ejecutar({ username: 'admin', password: 'incorrecta' });

    await expect(iniciar).rejects.toThrow(CredencialesInvalidasError);
  });

  it('debe lanzar CredencialesInvalidasError cuando el usuario está inactivo', async () => {
    puertos.usuarios.buscarPorUsername.mockResolvedValue(unUsuario().inactivo().build());
    puertos.hasher.verificar.mockResolvedValue(true);

    const iniciar = useCase.ejecutar({ username: 'admin', password: 'Admin123!' });

    await expect(iniciar).rejects.toThrow(CredencialesInvalidasError);
  });

  it('debe no emitir tokens cuando las credenciales son inválidas', async () => {
    puertos.usuarios.buscarPorUsername.mockResolvedValue(unUsuario().build());
    puertos.hasher.verificar.mockResolvedValue(false);

    await useCase.ejecutar({ username: 'admin', password: 'incorrecta' }).catch(() => undefined);

    expect(puertos.refreshTokens.crear).not.toHaveBeenCalled();
    expect(puertos.tokens.firmarAccessToken).not.toHaveBeenCalled();
  });
});
