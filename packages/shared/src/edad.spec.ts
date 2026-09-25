import { describe, expect, it } from 'vitest';
import { calcularEdad } from './edad';

const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const HOY = fecha('2026-09-25');

describe('calcularEdad', () => {
  it('debe contar el año cuando la fecha de referencia es el día del cumpleaños', () => {
    const edad = calcularEdad(fecha('1946-09-25'), HOY);

    expect(edad).toBe(80);
  });

  it('debe no contar el año cuando falta un día para el cumpleaños', () => {
    const edad = calcularEdad(fecha('1945-09-26'), HOY);

    expect(edad).toBe(80);
  });

  it('debe contar el año cuando el cumpleaños fue en un mes anterior', () => {
    const edad = calcularEdad(fecha('1945-01-15'), HOY);

    expect(edad).toBe(81);
  });

  it('debe no contar el año cuando el cumpleaños es en un mes posterior', () => {
    const edad = calcularEdad(fecha('1990-12-01'), HOY);

    expect(edad).toBe(35);
  });

  it('debe devolver 0 cuando nació en la fecha de referencia', () => {
    const edad = calcularEdad(HOY, HOY);

    expect(edad).toBe(0);
  });

  it('debe cumplir años el 1 de marzo cuando nació un 29 de febrero y el año no es bisiesto', () => {
    const nacimiento = fecha('2000-02-29');

    expect(calcularEdad(nacimiento, fecha('2027-02-28'))).toBe(26);
    expect(calcularEdad(nacimiento, fecha('2027-03-01'))).toBe(27);
  });

  it('debe lanzar RangeError cuando la fecha de nacimiento es posterior a la de referencia', () => {
    const calcular = () => calcularEdad(fecha('2026-09-26'), HOY);

    expect(calcular).toThrow(RangeError);
  });

  it('debe lanzar RangeError cuando la fecha de nacimiento no es válida', () => {
    const calcular = () => calcularEdad(new Date('no-es-fecha'), HOY);

    expect(calcular).toThrow(/fecha de nacimiento/);
  });

  it('debe lanzar RangeError cuando la fecha de referencia no es válida', () => {
    const calcular = () => calcularEdad(fecha('1990-01-01'), new Date('no-es-fecha'));

    expect(calcular).toThrow(/fecha de referencia/);
  });
});
