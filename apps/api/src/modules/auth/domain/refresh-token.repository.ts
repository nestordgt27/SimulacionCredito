import type { RefreshToken } from './refresh-token';

export interface NuevoRefreshToken {
  usuarioId: number;
  tokenHash: string;
  expiraEn: Date;
  /** Si se omite, el token inicia una familia nueva (inicio de sesión). */
  familiaId?: string;
}

export interface RefreshTokenRepository {
  crear(datos: NuevoRefreshToken): Promise<RefreshToken>;
  buscarPorHash(tokenHash: string): Promise<RefreshToken | null>;
  /**
   * Revoca el token y lo enlaza con su reemplazo, solo si seguía vigente.
   * Devuelve `false` si otro proceso ya lo había revocado (uso concurrente = reutilización).
   */
  marcarRotado(id: number, reemplazadoPorId: number, fecha: Date): Promise<boolean>;
  revocarFamilia(familiaId: string, fecha: Date): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
