// Ejecuta `fn` en una transacción: si falla cualquier paso, no queda nada persistido.
// Las llamadas anidadas reutilizan la transacción en curso.
export interface UnitOfWork {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
