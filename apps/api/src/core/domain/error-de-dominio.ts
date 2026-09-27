// Categorías de error de dominio. El filtro global las traduce a HTTP (CLAUDE.md §3.1):
// NO_AUTENTICADO → 401, NO_ENCONTRADO → 404, CONFLICTO → 409, REGLA_NEGOCIO → 422.
export type TipoErrorDeDominio = 'NO_AUTENTICADO' | 'NO_ENCONTRADO' | 'CONFLICTO' | 'REGLA_NEGOCIO';

export abstract class ErrorDeDominio extends Error {
  abstract readonly tipo: TipoErrorDeDominio;
  /** Identificador estable para el cliente (ej. CREDENCIALES_INVALIDAS). */
  abstract readonly codigo: string;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}
