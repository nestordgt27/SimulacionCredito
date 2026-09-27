import { describe, expect, it } from 'vitest';
import { calcularCuotaNivelada } from './cuota-nivelada';
import { Periodicidad } from './periodicidad';

// Valores de referencia calculados con la fórmula en punto flotante y redondeados a 2 decimales.
describe('calcularCuotaNivelada', () => {
  it.each([
    { periodicidad: Periodicidad.MENSUAL, cuotas: 12, esperada: 888.49 },
    { periodicidad: Periodicidad.QUINCENAL, cuotas: 24, esperada: 443.21 },
    { periodicidad: Periodicidad.ANUAL, cuotas: 3, esperada: 4163.49 },
  ])(
    'debe calcular $esperada cuando la periodicidad es $periodicidad con $cuotas cuotas al 12 %',
    ({ periodicidad, cuotas, esperada }) => {
      const cuota = calcularCuotaNivelada(10_000, 12, cuotas, periodicidad);

      expect(cuota).toBe(esperada);
    },
  );

  it('debe redondear hacia arriba desde medio centavo cuando el resultado tiene más decimales', () => {
    const cuota = calcularCuotaNivelada(5_000, 18, 6, Periodicidad.MENSUAL);

    expect(cuota).toBe(877.63);
  });

  it('debe dividir el monto entre las cuotas cuando la tasa es 0', () => {
    const cuota = calcularCuotaNivelada(10_000, 0, 3, Periodicidad.MENSUAL);

    expect(cuota).toBe(3333.33);
  });

  it('debe devolver monto más interés de un periodo cuando hay una sola cuota', () => {
    const cuota = calcularCuotaNivelada(10_000, 12, 1, Periodicidad.ANUAL);

    expect(cuota).toBe(11_200);
  });

  it.each([
    { caso: 'el monto es 0', monto: 0, tasaAnual: 12, cuotas: 12, mensaje: /monto/ },
    { caso: 'el monto es negativo', monto: -1, tasaAnual: 12, cuotas: 12, mensaje: /monto/ },
    { caso: 'el monto no es finito', monto: Infinity, tasaAnual: 12, cuotas: 12, mensaje: /monto/ },
    {
      caso: 'el monto tiene 3 decimales',
      monto: 10.005,
      tasaAnual: 12,
      cuotas: 12,
      mensaje: /decimales/,
    },
    { caso: 'la tasa es negativa', monto: 1_000, tasaAnual: -1, cuotas: 12, mensaje: /tasa/ },
    { caso: 'la tasa es NaN', monto: 1_000, tasaAnual: NaN, cuotas: 12, mensaje: /tasa/ },
    { caso: 'las cuotas son 0', monto: 1_000, tasaAnual: 12, cuotas: 0, mensaje: /cuotas/ },
    {
      caso: 'las cuotas no son enteras',
      monto: 1_000,
      tasaAnual: 12,
      cuotas: 1.5,
      mensaje: /cuotas/,
    },
  ])('debe lanzar RangeError cuando $caso', ({ monto, tasaAnual, cuotas, mensaje }) => {
    const calcular = () => calcularCuotaNivelada(monto, tasaAnual, cuotas, Periodicidad.MENSUAL);

    expect(calcular).toThrow(RangeError);
    expect(calcular).toThrow(mensaje);
  });
});
