import { describe, expect, it } from 'vitest';
import { calcularIndicadoresFinancieros, type ParametrosIndicadores } from './indicadores';
import { Periodicidad } from './periodicidad';

function unCredito(parametros: Partial<ParametrosIndicadores> = {}): ParametrosIndicadores {
  return {
    monto: 10_000,
    tasaAnual: 12,
    cuotas: 12,
    periodicidad: Periodicidad.MENSUAL,
    ingresoMensual: 25_000,
    ...parametros,
  };
}

// Valores esperados obtenidos con un cálculo independiente (amortización en centavos enteros).
describe('calcularIndicadoresFinancieros', () => {
  it.each([
    {
      caso: { periodicidad: Periodicidad.MENSUAL, cuotas: 12 },
      esperado: {
        cuotaNivelada: 888.49,
        cuotaMensualEquivalente: 888.49,
        relacionCuotaIngreso: 3.55,
        totalAPagar: 10_661.86,
        totalIntereses: 661.86,
      },
    },
    {
      caso: { periodicidad: Periodicidad.QUINCENAL, cuotas: 24 },
      esperado: {
        cuotaNivelada: 443.21,
        cuotaMensualEquivalente: 886.42,
        relacionCuotaIngreso: 3.55,
        totalAPagar: 10_636.94,
        totalIntereses: 636.94,
      },
    },
    {
      caso: { periodicidad: Periodicidad.ANUAL, cuotas: 3 },
      esperado: {
        cuotaNivelada: 4_163.49,
        cuotaMensualEquivalente: 346.96,
        relacionCuotaIngreso: 1.39,
        totalAPagar: 12_490.47,
        totalIntereses: 2_490.47,
      },
    },
  ])(
    'debe calcular los indicadores con $caso.cuotas cuotas $caso.periodicidad',
    ({ caso, esperado }) => {
      expect(calcularIndicadoresFinancieros(unCredito(caso))).toEqual(esperado);
    },
  );

  it('debe sumar el total a pagar con la última cuota ajustada, no cuota × cantidad', () => {
    const { totalAPagar, cuotaNivelada } = calcularIndicadoresFinancieros(unCredito());

    expect(totalAPagar).not.toBe(cuotaNivelada * 12);
    expect(totalAPagar).toBe(10_661.86);
  });

  it('debe devolver intereses en 0 cuando la tasa es 0', () => {
    const indicadores = calcularIndicadoresFinancieros(unCredito({ tasaAnual: 0, cuotas: 10 }));

    expect(indicadores).toMatchObject({
      cuotaNivelada: 1_000,
      totalAPagar: 10_000,
      totalIntereses: 0,
    });
  });

  it('debe redondear la relación cuota / ingreso a 2 decimales (ROUND_HALF_UP)', () => {
    // 888.49 / 25 000.50 = 3.5538…% → 3.55
    const { relacionCuotaIngreso } = calcularIndicadoresFinancieros(
      unCredito({ ingresoMensual: 25_000.5 }),
    );

    expect(relacionCuotaIngreso).toBe(3.55);
  });

  it('debe devolver la relación cuota / ingreso en null cuando el ingreso es 0', () => {
    const { relacionCuotaIngreso } = calcularIndicadoresFinancieros(
      unCredito({ ingresoMensual: 0 }),
    );

    expect(relacionCuotaIngreso).toBeNull();
  });

  it('debe lanzar RangeError cuando el ingreso es negativo', () => {
    const calcular = () => calcularIndicadoresFinancieros(unCredito({ ingresoMensual: -1 }));

    expect(calcular).toThrow(RangeError);
  });
});
