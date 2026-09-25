import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ES_PUBLICO } from '../../../core/auth/public.decorator';
import type { RequestAutenticada } from '../../../core/auth/usuario-actual.decorator';
import { AccessTokenInvalidoError } from '../domain/errores';
import { TOKEN_SERVICE, type TokenService } from '../domain/token.service';

// Guard global: toda ruta exige `Authorization: Bearer <access token>` salvo las marcadas con @Public().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean | undefined>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) {
      return true;
    }

    const request = contexto.switchToHttp().getRequest<RequestAutenticada>();
    const [esquema, token] = request.headers.authorization?.split(' ') ?? [];
    if (esquema !== 'Bearer' || !token) {
      throw new AccessTokenInvalidoError();
    }

    request.usuario = await this.tokens.verificarAccessToken(token);
    return true;
  }
}
