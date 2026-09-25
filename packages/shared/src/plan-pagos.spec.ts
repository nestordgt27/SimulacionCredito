import { describe, expect, it } from 'vitest';
import { Periodicidad } from './periodicidad';
import { generarPlanPagos, type CuotaPlan, type ParametrosPlanPagos } from './plan-pagos';

function unPlan(parametros: Partial<ParametrosPlanPagos> = {}): ParametrosPlanPagos {
  return {
    monto: 10_000,
    tasaAnual: 12,
    cuotas: 12,
    periodicidad: Periodicidad.MENSUAL,
    fechaInicio: new Date('2026-01-31T00:00:00Z'),
    ...parametros,
  };
}

// Se suma en centavos enteros para no arrastrar errores de punto flotante en la verificación.
const aCentavos = (valor: number) => Math.round(valor * 100);
const sumaCentavos = (plan: CuotaPlan[], campo: 'capital' | 'interes') =>
  plan.reduce((total, fila) => total + aCentavos(fila[campo]), 0);

describe('generarPlanPagos', () => {
  describe.each([
    { periodicidad: Periodicidad.MENSUAL, cuotas: 12 },
    { periodicidad: Periodicidad.QUINCENAL, cuotas: 24 },
    { periodicidad: Periodicidad.ANUAL, cuotas: 3 },
    { periodicidad: Periodicidad.MENSUAL, cuotas: 7, tasaAnual: 0 },
    { periodicidad: Periodicidad.QUINCENAL, cuotas: 13, monto: 12_345.67, tasaAnual: 27.5 },
  ])('con $cuotas cuotas $periodicidad', (caso) => {
    const parametros = unPlan(caso);

    it('debe generar exactamente una fila por cuota numerada desde 1', () => {
      const plan = generarPlanPagos(parametros);

      expect(plan.map((fila) => fila.numero)).toEqual(
        Array.from({ length: parametros.cuotas }, (_, indice) => indice + 1),
      );
    });

    it('debe sumar capital igual al monto cuando se completan todas las cuotas', () => {
      const plan = generarPlanPagos(parametros);

      expect(sumaCentavos(plan, 'capital')).toBe(aCentavos(parametros.monto));
    });

    it('debe dejar el saldo final exactamente en 0', () => {
      const plan = generarPlanPagos(parametros);

      expect(plan.at(-1)?.saldo).toBe(0);
    });

    it('debe cumplir cuota = capital + interés en cada fila', () => {
      const plan = generarPlanPagos(parametros);

      for (const fila of plan) {
        expect(aCentavos(fila.cuota)).toBe(aCentavos(fila.capital) + aCentavos(fila.interes));
      }
    });
  });

  it('debe calcular la primera fila con interés sobre el monto completo', () => {
    const [primera] = generarPlanPagos(unPlan());

    expect(primera).toMatchObject({ cuota: 888.49, interes: 100, capital: 788.49, saldo: 9211.51 });
  });

  it('debe mantener la cuota nivelada en todas las filas menos la última', () => {
    const plan = generarPlanPagos(unPlan());

    expect(new Set(plan.slice(0, -1).map((fila) => fila.cuota))).toEqual(new Set([888.49]));
  });

  it('debe absorber el residuo del redondeo en la última cuota', () => {
    const plan = generarPlanPagos(unPlan());

    // La cuota 888,4879 se redondea a 888,49; ese exceso acumulado se descuenta en la última.
    expect(plan.at(-1)).toMatchObject({ cuota: 888.47, capital: 879.67, interes: 8.8, saldo: 0 });
  });

  it('debe ajustar el último centavo en la última cuota cuando la tasa es 0', () => {
    const plan = generarPlanPagos(unPlan({ cuotas: 3, tasaAnual: 0 }));

    expect(plan.map((fila) => fila.cuota)).toEqual([3333.33, 3333.33, 3333.34]);
  });

  it('debe vencer cada mes desde la fecha de inicio cuando la periodicidad es mensual', () => {
    const plan = generarPlanPagos(unPlan({ cuotas: 3 }));

    expect(plan.map((fila) => fila.fechaVencimiento.toISOString().slice(0, 10))).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('debe vencer cada 15 días desde la fecha de inicio cuando la periodicidad es quincenal', () => {
    const plan = generarPlanPagos(unPlan({ cuotas: 2, periodicidad: Periodicidad.QUINCENAL }));

    expect(plan.map((fila) => fila.fechaVencimiento.toISOString().slice(0, 10))).toEqual([
      '2026-02-15',
      '2026-03-02',
    ]);
  });

  it('debe vencer cada año desde la fecha de inicio cuando la periodicidad es anual', () => {
    const plan = generarPlanPagos(unPlan({ cuotas: 2, periodicidad: Periodicidad.ANUAL }));

    expect(plan.map((fila) => fila.fechaVencimiento.toISOString().slice(0, 10))).toEqual([
      '2027-01-31',
      '2028-01-31',
    ]);
  });

  it('debe lanzar RangeError cuando la fecha de inicio no es válida', () => {
    const generar = () => generarPlanPagos(unPlan({ fechaInicio: new Date('no-es-fecha') }));

    expect(generar).toThrow(RangeError);
  });

  it('debe lanzar RangeError cuando los parámetros del crédito no son válidos', () => {
    const generar = () => generarPlanPagos(unPlan({ monto: 0 }));

    expect(generar).toThrow(RangeError);
  });
});
