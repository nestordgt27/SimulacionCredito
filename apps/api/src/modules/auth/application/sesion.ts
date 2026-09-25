export interface Sesion {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Segundos de vigencia del access token. */
  expiresIn: number;
  usuario: {
    id: number;
    username: string;
    nombreCompleto: string;
    rol: string;
  };
}
