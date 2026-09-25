import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../core/domain/unit-of-work';
import { RefreshTokenInvalidoError, RefreshTokenReutilizadoError } from '../domain/errores';
import {
  REFRESH_TOKEN_GENERATOR,
  type RefreshTokenGenerator,
} from '../domain/refresh-token.generator';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../domain/refresh-token.repository';
import { USUARIO_REPOSITORY, type UsuarioRepository } from '../domain/usuario.repository';
import { EmisorDeSesion } from './emisor-de-sesion';
import type { Sesion } from './sesion';

type ResultadoRotacion =
  | { tipo: 'ROTADO'; sesion: Sesion }
  | { tipo: 'INVALIDO' }
  | { tipo: 'REUTILIZADO'; usuarioId: number };

// Rota el refresh token: revoca el actual y emite uno nuevo en la misma familia.
// Si llega un token ya revocado (reutilización = posible robo), revoca toda la familia.
@Injectable()
export class RefrescarSesionUseCase {
  private readonly logger = new Logger(RefrescarSesionUseCase.name);

  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(REFRESH_TOKEN_GENERATOR) private readonly generador: RefreshTokenGenerator,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly emisor: EmisorDeSesion,
  ) {}

  async ejecutar(refreshToken: string): Promise<Sesion> {
    // Las revocaciones se confirman antes de lanzar el error: por eso la transacción
    // devuelve un resultado en lugar de lanzar (un throw dentro haría rollback).
    const resultado = await this.unitOfWork.run(() => this.rotar(refreshToken));

    switch (resultado.tipo) {
      case 'ROTADO':
        return resultado.sesion;
      case 'REUTILIZADO':
        this.logger.warn(
          `Reutilización de refresh token del usuario ${resultado.usuarioId}: familia revocada`,
        );
        throw new RefreshTokenReutilizadoError();
      case 'INVALIDO':
        throw new RefreshTokenInvalidoError();
    }
  }

  private async rotar(refreshToken: string): Promise<ResultadoRotacion> {
    const ahora = this.clock.ahora();
    const actual = await this.refreshTokens.buscarPorHash(this.generador.hashear(refreshToken));

    if (!actual) {
      return { tipo: 'INVALIDO' };
    }
    // Un token revocado cuenta como reutilización aunque además haya expirado.
    if (actual.estaRevocado()) {
      await this.refreshTokens.revocarFamilia(actual.familiaId, ahora);
      return { tipo: 'REUTILIZADO', usuarioId: actual.usuarioId };
    }
    if (actual.haExpirado(ahora)) {
      return { tipo: 'INVALIDO' };
    }

    const usuario = await this.usuarios.buscarPorId(actual.usuarioId);
    if (!usuario?.puedeIniciarSesion()) {
      await this.refreshTokens.revocarFamilia(actual.familiaId, ahora);
      return { tipo: 'INVALIDO' };
    }

    const { sesion, refreshTokenId } = await this.emisor.emitir(usuario, actual.familiaId);
    const rotado = await this.refreshTokens.marcarRotado(actual.id, refreshTokenId, ahora);
    if (!rotado) {
      await this.refreshTokens.revocarFamilia(actual.familiaId, ahora);
      return { tipo: 'REUTILIZADO', usuarioId: actual.usuarioId };
    }

    return { tipo: 'ROTADO', sesion };
  }
}
