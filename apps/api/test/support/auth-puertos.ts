import { EmisorDeSesion } from '../../src/modules/auth/application/emisor-de-sesion';
import type { PasswordHasher } from '../../src/modules/auth/domain/password-hasher';
import { RefreshToken } from '../../src/modules/auth/domain/refresh-token';
import type { RefreshTokenGenerator } from '../../src/modules/auth/domain/refresh-token.generator';
import type { RefreshTokenRepository } from '../../src/modules/auth/domain/refresh-token.repository';
import type { TokenService } from '../../src/modules/auth/domain/token.service';
import type { UsuarioRepository } from '../../src/modules/auth/domain/usuario.repository';
import { FakeClock } from './fake-clock';

export const REFRESH_TOKEN_NUEVO = 'refresh-nuevo';
export const ID_REFRESH_TOKEN_NUEVO = 99;

// Solo se mockean puertos (CLAUDE.md §6.2). EmisorDeSesion es real y usa estos mocks.
export function crearPuertosAuth() {
  const clock = new FakeClock();

  const usuarios: jest.Mocked<UsuarioRepository> = {
    buscarPorUsername: jest.fn(),
    buscarPorId: jest.fn(),
  };
  const refreshTokens: jest.Mocked<RefreshTokenRepository> = {
    crear: jest.fn(({ usuarioId, expiraEn, familiaId }) =>
      Promise.resolve(
        new RefreshToken({
          id: ID_REFRESH_TOKEN_NUEVO,
          usuarioId,
          familiaId: familiaId ?? 'familia-nueva',
          expiraEn,
          revocadoEn: null,
        }),
      ),
    ),
    buscarPorHash: jest.fn(),
    marcarRotado: jest.fn().mockResolvedValue(true),
    revocarFamilia: jest.fn().mockResolvedValue(undefined),
  };
  const hasher: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(),
    verificar: jest.fn(),
  };
  const tokens: jest.Mocked<TokenService> = {
    firmarAccessToken: jest.fn().mockResolvedValue({ accessToken: 'access-jwt', expiresIn: 900 }),
    verificarAccessToken: jest.fn(),
  };
  const generador: jest.Mocked<RefreshTokenGenerator> = {
    generar: jest.fn().mockReturnValue(REFRESH_TOKEN_NUEVO),
    hashear: jest.fn((token: string) => `hash(${token})`),
  };

  const emisor = new EmisorDeSesion(tokens, generador, refreshTokens, clock, {
    refreshTokenTtlDias: 7,
  });

  return { clock, usuarios, refreshTokens, hasher, tokens, generador, emisor };
}
