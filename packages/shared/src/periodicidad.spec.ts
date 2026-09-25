import { describe, expect, it } from 'vitest';
import { obtenerConfiguracion, Periodicidad, PERIODICIDADES } from './periodicidad';

const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const dia = (valor: Date) => valor.toISOString().slice(0, 10);

describe('PERIODICIDADES', () => {
  it('debe definir n = 1, 12 y 24 pagos por año para anual, mensual y quincenal', () => {
    const n = Object.fromEntries(
      Object.entries(PERIODICIDADES).map(([periodicidad, { n }]) => [periodicidad, n]),
    );

    expect(n).toEqual({ ANUAL: 1, MENSUAL: 12, QUINCENAL: 24 });
  });

  it('debe usar el último día del mes cuando el día no existe en el mes destino', () => {
    const { avanzarFecha } = PERIODICIDADES[Periodicidad.MENSUAL];

    expect(dia(avanzarFecha(fecha('2027-01-31'), 1))).toBe('2027-02-28');
    expect(dia(avanzarFecha(fecha('2028-01-31'), 1))).toBe('2028-02-29');
  });

  it('debe calcular desde la fecha de inicio y no encadenar ajustes de fin de mes', () => {
    const { avanzarFecha } = PERIODICIDADES[Periodicidad.MENSUAL];

    expect(dia(avanzarFecha(fecha('2027-01-31'), 2))).toBe('2027-03-31');
  });

  it('debe cruzar el año cuando la periodicidad mensual pasa de diciembre', () => {
    const { avanzarFecha } = PERIODICIDADES[Periodicidad.MENSUAL];

    expect(dia(avanzarFecha(fecha('2026-11-15'), 3))).toBe('2027-02-15');
  });

  it('debe conservar la hora UTC cuando avanza meses', () => {
    const { avanzarFecha } = PERIODICIDADES[Periodicidad.MENSUAL];

    const resultado = avanzarFecha(new Date('2026-03-10T14:30:15.250Z'), 1);

    expect(resultado.toISOString()).toBe('2026-04-10T14:30:15.250Z');
  });

  it('debe usar el 28 de febrero cuando la periodicidad es anual y la fecha es 29 de febrero', () => {
    const { avanzarFecha } = PERIODICIDADES[Periodicidad.ANUAL];

    expect(dia(avanzarFecha(fecha('2028-02-29'), 1))).toBe('2029-02-28');
  });

  it('debe sumar 15 días por periodo cuando la periodicidad es quincenal', () => {
    const { avanzarFecha } = PERIODICIDADES[Periodicidad.QUINCENAL];

    expect(dia(avanzarFecha(fecha('2026-12-25'), 2))).toBe('2027-01-24');
  });
});

describe('obtenerConfiguracion', () => {
  it('debe devolver la configuración cuando la periodicidad existe', () => {
    expect(obtenerConfiguracion(Periodicidad.QUINCENAL).n).toBe(24);
  });

  it('debe lanzar RangeError cuando la periodicidad no está soportada', () => {
    const obtener = () => obtenerConfiguracion('SEMANAL' as Periodicidad);

    expect(obtener).toThrow(RangeError);
  });

  it('debe lanzar RangeError cuando se pasa una propiedad heredada de Object', () => {
    const obtener = () => obtenerConfiguracion('toString' as Periodicidad);

    expect(obtener).toThrow(RangeError);
  });
});
