import { generarPlanPagos } from '@simulacion-credito/shared';
import { sumarMontos } from './montos';

describe('sumarMontos', () => {
  it('debe sumar sin errores de punto flotante', () => {
    expect(sumarMontos([0.1, 0.2])).toBe(0.3);
  });

  it('debe devolver 0 cuando no hay montos', () => {
    expect(sumarMontos([])).toBe(0);
  });

  it('debe obtener exactamente el monto al sumar el capital de un plan de shared', () => {
    const plan = generarPlanPagos({
      monto: 12345.67,
      tasaAnual: 27.5,
      cuotas: 13,
      periodicidad: 'QUINCENAL',
      fechaInicio: new Date('2026-09-25T00:00:00Z'),
    });

    expect(sumarMontos(plan.map((cuota) => cuota.capital))).toBe(12345.67);
  });
});
