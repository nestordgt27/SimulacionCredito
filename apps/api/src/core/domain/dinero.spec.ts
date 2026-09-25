import { aCentavos, aPuntosBasicos, desdeCentavos, desdePuntosBasicos } from './dinero';

describe('dinero', () => {
  it.each([
    [15000.5, 1_500_050],
    [0.29, 29],
    [1.1, 110],
    [21_474_836.47, 2_147_483_647],
  ])('debe convertir %p a %p centavos sin error de punto flotante', (monto, centavos) => {
    expect(aCentavos(monto)).toBe(centavos);
  });

  it('debe volver a unidades cuando convierte desde centavos', () => {
    expect(desdeCentavos(1_500_050)).toBe(15000.5);
  });

  it.each([
    [18.5, 1850],
    [12.35, 1235],
    [0, 0],
  ])('debe convertir la tasa %p %% a %p puntos básicos', (tasa, puntosBasicos) => {
    expect(aPuntosBasicos(tasa)).toBe(puntosBasicos);
  });

  it('debe volver a porcentaje cuando convierte desde puntos básicos', () => {
    expect(desdePuntosBasicos(1235)).toBe(12.35);
  });
});
