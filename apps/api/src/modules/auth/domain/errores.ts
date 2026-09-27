import { ErrorDeDominio } from '../../../core/domain/error-de-dominio';

// Mensaje único para usuario inexistente, inactivo o contraseña incorrecta: no revela cuál falló.
export class CredencialesInvalidasError extends ErrorDeDominio {
  readonly tipo = 'NO_AUTENTICADO';
  readonly codigo = 'CREDENCIALES_INVALIDAS';

  constructor() {
    super('Usuario o contraseña incorrectos');
  }
}

export class RefreshTokenInvalidoError extends ErrorDeDominio {
  readonly tipo = 'NO_AUTENTICADO';
  readonly codigo = 'REFRESH_TOKEN_INVALIDO';

  constructor() {
    super('El refresh token no es válido o expiró');
  }
}

export class RefreshTokenReutilizadoError extends ErrorDeDominio {
  readonly tipo = 'NO_AUTENTICADO';
  readonly codigo = 'REFRESH_TOKEN_REUTILIZADO';

  constructor() {
    super(
      'El refresh token ya fue usado. Por seguridad se cerró la sesión; inicia sesión de nuevo',
    );
  }
}

export class AccessTokenInvalidoError extends ErrorDeDominio {
  readonly tipo = 'NO_AUTENTICADO';
  readonly codigo = 'ACCESS_TOKEN_INVALIDO';

  constructor() {
    super('El token de acceso no es válido o expiró');
  }
}
