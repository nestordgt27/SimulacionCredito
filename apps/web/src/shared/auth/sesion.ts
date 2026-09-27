export interface UsuarioSesion {
  id: number;
  username: string;
  nombreCompleto: string;
  rol: string;
}

/** Respuesta de POST /auth/login y POST /auth/refresh. */
export interface RespuestaSesion {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: UsuarioSesion;
}

export interface Sesion {
  /** Solo en memoria: tras recargar la página es null hasta el primer refresh. */
  accessToken: string | null;
  refreshToken: string;
  usuario: UsuarioSesion;
}
