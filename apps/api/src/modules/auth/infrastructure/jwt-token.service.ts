import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { UsuarioAutenticado } from '../../../core/auth/usuario-autenticado';
import type { Env } from '../../../core/config/env';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import { AccessTokenInvalidoError } from '../domain/errores';
import type { AccessTokenFirmado, TokenService } from '../domain/token.service';

interface PayloadAccessToken {
  sub: string;
  username: string;
  rol: string;
  iat: number;
  exp: number;
}

// `iat`, `exp` y la verificación usan el Clock (no la hora del sistema) para que la
// expiración sea determinista en pruebas.
@Injectable()
export class JwtTokenService implements TokenService {
  private readonly ttlSegundos: number;

  constructor(
    private readonly jwt: JwtService,
    @Inject(CLOCK) private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.ttlSegundos = config.get('JWT_ACCESS_TTL_SEGUNDOS', { infer: true });
  }

  async firmarAccessToken(usuario: UsuarioAutenticado): Promise<AccessTokenFirmado> {
    const iat = this.segundosActuales();
    const payload: PayloadAccessToken = {
      sub: String(usuario.id),
      username: usuario.username,
      rol: usuario.rol,
      iat,
      exp: iat + this.ttlSegundos,
    };

    return { accessToken: await this.jwt.signAsync(payload), expiresIn: this.ttlSegundos };
  }

  async verificarAccessToken(accessToken: string): Promise<UsuarioAutenticado> {
    try {
      const payload = await this.jwt.verifyAsync<PayloadAccessToken>(accessToken, {
        algorithms: ['HS256'],
        clockTimestamp: this.segundosActuales(),
      });
      return { id: Number(payload.sub), username: payload.username, rol: payload.rol };
    } catch {
      throw new AccessTokenInvalidoError();
    }
  }

  private segundosActuales(): number {
    return Math.floor(this.clock.ahora().getTime() / 1000);
  }
}
