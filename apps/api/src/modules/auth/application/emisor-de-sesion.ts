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
import { TOKEN_SERVICE, type TokenService } from '../domain/token.service';
import type { Usuario } from '../domain/usuario';
import { AUTH_OPTIONS, type AuthOptions } from './auth-options';
import type { Sesion } from './sesion';

const MS_POR_DIA = 86_400_000;

export interface SesionEmitida {
  sesion: Sesion;
  refreshTokenId: number;
}

// Emite el par access + refresh token. Lo usan el login (familia nueva) y la rotación (misma familia).
@Injectable()
export class EmisorDeSesion {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_GENERATOR) private readonly generador: RefreshTokenGenerator,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTH_OPTIONS) private readonly opciones: AuthOptions,
  ) {}

  async emitir(usuario: Usuario, familiaId?: string): Promise<SesionEmitida> {
    const refreshToken = this.generador.generar();
    const expiraEn = new Date(
      this.clock.ahora().getTime() + this.opciones.refreshTokenTtlDias * MS_POR_DIA,
    );

    const registro = await this.refreshTokens.crear({
      usuarioId: usuario.id,
      tokenHash: this.generador.hashear(refreshToken),
      expiraEn,
      familiaId,
    });
    const { accessToken, expiresIn } = await this.tokens.firmarAccessToken({
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
    });

    return {
      refreshTokenId: registro.id,
      sesion: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          nombreCompleto: usuario.nombreCompleto,
          rol: usuario.rol,
        },
      },
    };
  }
}
