export interface DatosRefreshToken {
  id: number;
  usuarioId: number;
  familiaId: string;
  expiraEn: Date;
  revocadoEn: Date | null;
}

// Registro persistido de un refresh token. El valor real del token nunca se guarda: solo su hash.
export class RefreshToken {
  readonly id: number;
  readonly usuarioId: number;
  /** Cadena de rotación a la que pertenece: se revoca completa si se detecta reutilización. */
  readonly familiaId: string;
  readonly expiraEn: Date;
  readonly revocadoEn: Date | null;

  constructor(datos: DatosRefreshToken) {
    this.id = datos.id;
    this.usuarioId = datos.usuarioId;
    this.familiaId = datos.familiaId;
    this.expiraEn = datos.expiraEn;
    this.revocadoEn = datos.revocadoEn;
  }

  estaRevocado(): boolean {
    return this.revocadoEn !== null;
  }

  haExpirado(ahora: Date): boolean {
    return ahora.getTime() >= this.expiraEn.getTime();
  }

  perteneceA(usuarioId: number): boolean {
    return this.usuarioId === usuarioId;
  }
}
