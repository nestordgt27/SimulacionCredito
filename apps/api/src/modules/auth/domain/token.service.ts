import type { UsuarioAutenticado } from '../../../core/auth/usuario-autenticado';

export interface AccessTokenFirmado {
  accessToken: string;
  /** Segundos de vigencia del access token. */
  expiresIn: number;
}

// Access token JWT de corta duración.
export interface TokenService {
  firmarAccessToken(usuario: UsuarioAutenticado): Promise<AccessTokenFirmado>;
  /** Lanza AccessTokenInvalidoError si la firma no es válida o el token expiró. */
  verificarAccessToken(accessToken: string): Promise<UsuarioAutenticado>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
