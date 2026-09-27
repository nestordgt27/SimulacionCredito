// Refresh token opaco (aleatorio, sin información) y su hash para persistirlo.
export interface RefreshTokenGenerator {
  generar(): string;
  hashear(refreshToken: string): string;
}

export const REFRESH_TOKEN_GENERATOR = Symbol('REFRESH_TOKEN_GENERATOR');
