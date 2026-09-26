import { describe, expect, it } from 'vitest';
import { FORMATO_CEDULA, LIMITES_SOLICITUD, tieneMaximoDecimales } from './limites';

describe('LIMITES_SOLICITUD', () => {
  it('debe fijar el monto máximo en el mayor valor que cabe en un Int de 32 bits en centavos', () => {
    expect(Math.round(LIMITES_SOLICITUD.MONTO_MAXIMO * 100)).toBe(2 ** 31 - 1);
  });
});

describe('tieneMaximoDecimales', () => {
  it.each([
    [10, true],
    [10.5, true],
    [0.29, true],
    [10.005, false],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ])('debe responder %p → %p con 2 decimales permitidos', (valor, esperado) => {
    expect(tieneMaximoDecimales(valor, 2)).toBe(esperado);
  });
});

describe('FORMATO_CEDULA', () => {
  it.each(['001-010190-0001A', '281-150385-1234Z'])('debe aceptar %p', (cedula) => {
    expect(FORMATO_CEDULA.test(cedula)).toBe(true);
  });

  it.each(['0010101900001A', '001-010190-0001a', '001-010190-00001', '001-010190-0001AB'])(
    'debe rechazar %p',
    (cedula) => {
      expect(FORMATO_CEDULA.test(cedula)).toBe(false);
    },
  );
});
