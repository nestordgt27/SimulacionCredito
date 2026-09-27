import { describe, expect, it } from 'vitest';
import { TipoEmpleo } from './tipo-empleo';

describe('TipoEmpleo', () => {
  // Los valores se guardan como texto en la base de datos: cambiarlos rompe los datos existentes.
  it('debe exponer exactamente los tipos de empleo asalariado e independiente', () => {
    expect(Object.values(TipoEmpleo)).toEqual(['ASALARIADO', 'INDEPENDIENTE']);
  });
});
