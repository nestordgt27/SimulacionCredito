// Identidad que el JwtAuthGuard adjunta a la petición a partir del access token.
export interface UsuarioAutenticado {
  id: number;
  username: string;
  rol: string;
}
