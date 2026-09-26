import { formatearFecha, formatearMeses, formatearMonto } from './formato';

describe('formatearMonto', () => {
  it.each([
    [888.49, 'C$ 888.49'],
    [10000, 'C$ 10,000.00'],
    [1234567.5, 'C$ 1,234,567.50'],
  ])('debe mostrar %p como %p', (monto, texto) => {
    expect(formatearMonto(monto)).toBe(texto);
  });
});

describe('formatearMeses', () => {
  it.each([
    [12, '12 meses'],
    [1, '1 mes'],
    [1.5, '1.5 meses'],
  ])('debe mostrar %p como %p', (meses, texto) => {
    expect(formatearMeses(meses)).toBe(texto);
  });
});

describe('formatearFecha', () => {
  it('debe mostrar la fecha en UTC como dd/mm/aaaa', () => {
    expect(formatearFecha('2026-09-25T23:30:00.000Z')).toBe('25/09/2026');
  });
});
