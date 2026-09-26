import { ETIQUETAS_PERIODICIDAD, opcionesDe } from './etiquetas';

describe('opcionesDe', () => {
  it('debe convertir un mapa de etiquetas en opciones para un selector', () => {
    expect(opcionesDe(ETIQUETAS_PERIODICIDAD)).toEqual([
      { valor: 'MENSUAL', etiqueta: 'Mensual' },
      { valor: 'QUINCENAL', etiqueta: 'Quincenal' },
      { valor: 'ANUAL', etiqueta: 'Anual' },
    ]);
  });
});
