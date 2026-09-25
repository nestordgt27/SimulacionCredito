import { describe, expect, it } from 'vitest';
import { Banco } from './banco';

describe('Banco', () => {
  // Los valores se guardan como texto en la base de datos: cambiarlos rompe los datos existentes.
  it('debe exponer exactamente los cuatro bancos permitidos para desembolso', () => {
    expect(Object.values(Banco)).toEqual(['LAFISE', 'FICOHSA', 'BAC_CREDOMATIC', 'BANPRO']);
  });
});
