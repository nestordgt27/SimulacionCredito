import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import {
  REFRESH_TOKEN_GENERATOR,
  type RefreshTokenGenerator,
} from '../domain/refresh-token.generator';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../domain/refresh-token.repository';

export interface SolicitudCierreSesion {
  usuarioId: number;
  refreshToken: string;
}

// Revoca la familia del refresh token (la sesión completa). Es idempotente y no revela
// si el token existía: solo actúa si el token pertenece al usuario autenticado.
@Injectable()
export class CerrarSesionUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(REFRESH_TOKEN_GENERATOR) private readonly generador: RefreshTokenGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async ejecutar({ usuarioId, refreshToken }: SolicitudCierreSesion): Promise<void> {
    const registro = await this.refreshTokens.buscarPorHash(this.generador.hashear(refreshToken));

    if (registro?.perteneceA(usuarioId)) {
      await this.refreshTokens.revocarFamilia(registro.familiaId, this.clock.ahora());
    }
  }
}
