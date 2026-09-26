import { Periodicidad } from '@simulacion-credito/shared';
import { Credito, type CondicionesAprobadas } from './credito';
import { formatearNumeroCredito } from './numero-credito';

const APROBACION = new Date('2026-01-31T15:00:00Z');

function condiciones(cambios: Partial<CondicionesAprobadas> = {}): CondicionesAprobadas {
  return {
    solicitudId: 7,
    montoCentavos: 1_000_000,
    tasaAnualBps: 1200,
    periodicidad: Periodicidad.MENSUAL,
    cantidadCuotas: 12,
    ...cambios,
  };
}

describe('Credito.otorgar', () => {
  it('debe copiar las condiciones aprobadas, el número de crédito y la cuota calculada', () => {
    const credito = Credito.otorgar(condiciones(), 'CR-2026-000001', APROBACION);

    expect(credito).toMatchObject({
      numeroCredito: 'CR-2026-000001',
      solicitudId: 7,
      montoCentavos: 1_000_000,
      tasaAnualBps: 1200,
      cantidadCuotas: 12,
      cuotaNiveladaCentavos: 88_849,
      fechaAprobacion: APROBACION,
    });
  });

  it.each([
    { periodicidad: Periodicidad.MENSUAL, cantidadCuotas: 12 },
    { periodicidad: Periodicidad.QUINCENAL, cantidadCuotas: 24 },
    { periodicidad: Periodicidad.ANUAL, cantidadCuotas: 3 },
  ])(
    'debe crear exactamente $cantidadCuotas cuotas que amortizan todo el monto cuando es $periodicidad',
    ({ periodicidad, cantidadCuotas }) => {
      const { cuotas } = Credito.otorgar(
        condiciones({ periodicidad, cantidadCuotas }),
        'CR-2026-000001',
        APROBACION,
      );

      expect(cuotas.map((cuota) => cuota.numero)).toEqual(
        Array.from({ length: cantidadCuotas }, (_, indice) => indice + 1),
      );
      expect(cuotas.reduce((total, cuota) => total + cuota.capitalCentavos, 0)).toBe(1_000_000);
      expect(cuotas.at(-1)?.saldoCentavos).toBe(0);
    },
  );

  it.each([
    { periodicidad: Periodicidad.MENSUAL, cantidadCuotas: 12, esperada: 88_849 },
    { periodicidad: Periodicidad.QUINCENAL, cantidadCuotas: 24, esperada: 44_321 },
  ])(
    'debe calcular la cuota nivelada al otorgar (,  cuotas)',
    ({ periodicidad, cantidadCuotas, esperada }) => {
      // Aunque la solicitud traiga otra cuota, el crédito la calcula con shared.
      const credito = Credito.otorgar(
        {
          ...condiciones({ periodicidad, cantidadCuotas }),
          cuotaNiveladaCentavos: 1,
        } as CondicionesAprobadas,
        'CR-2026-000001',
        APROBACION,
      );

      expect(credito.cuotaNiveladaCentavos).toBe(esperada);
      expect(credito.cuotas[0]?.cuotaCentavos).toBe(esperada);
    },
  );

  it('debe guardar el plan de shared en centavos enteros', () => {
    const { cuotas } = Credito.otorgar(condiciones(), 'CR-2026-000001', APROBACION);

    expect(cuotas[0]).toMatchObject({
      cuotaCentavos: 88_849,
      interesCentavos: 10_000,
      capitalCentavos: 78_849,
      saldoCentavos: 921_151,
    });
    expect(cuotas.at(-1)).toMatchObject({ cuotaCentavos: 88_847, saldoCentavos: 0 });
  });

  it('debe calcular los vencimientos desde la fecha de aprobación', () => {
    const { cuotas } = Credito.otorgar(condiciones(), 'CR-2026-000001', APROBACION);

    expect(cuotas.slice(0, 2).map((cuota) => cuota.fechaVencimiento.toISOString())).toEqual([
      '2026-02-28T15:00:00.000Z',
      '2026-03-31T15:00:00.000Z',
    ]);
  });
});

describe('formatearNumeroCredito', () => {
  it.each([
    [2026, 1, 'CR-2026-000001'],
    [2026, 42, 'CR-2026-000042'],
    [2027, 123_456, 'CR-2027-123456'],
  ])('debe formatear el año %p y el secuencial %p como %p', (anio, secuencial, esperado) => {
    expect(formatearNumeroCredito(anio, secuencial)).toBe(esperado);
  });
});
