import { describe, expect, it } from 'vitest';
import { Periodicidad } from './periodicidad';
import { calcularPlazoMeses } from './plazo';

describe('calcularPlazoMeses', () => {
  it.each([
    { cuotas: 12, periodicidad: Periodicidad.MENSUAL, meses: 12 },
    { cuotas: 24, periodicidad: Periodicidad.QUINCENAL, meses: 12 },
    { cuotas: 3, periodicidad: Periodicidad.ANUAL, meses: 36 },
    { cuotas: 3, periodicidad: Periodicidad.QUINCENAL, meses: 1.5 },
  ])(
    'debe devolver $meses meses cuando son $cuotas cuotas $periodicidad',
    ({ cuotas, periodicidad, meses }) => {
      expect(calcularPlazoMeses(cuotas, periodicidad)).toBe(meses);
    },
  );

  it('debe lanzar RangeError cuando las cuotas no son un entero positivo', () => {
    const calcular = () => calcularPlazoMeses(0, Periodicidad.MENSUAL);

    expect(calcular).toThrow(RangeError);
  });
});
