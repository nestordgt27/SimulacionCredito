import { Banco } from '@simulacion-credito/shared';
import { Desembolso } from './desembolso';

describe('Desembolso.registrar', () => {
  const AHORA = new Date('2026-09-27T10:00:00Z');
  const CREDITO = { id: 3, numeroCredito: 'CR-2026-000001', montoCentavos: 5_000_000 };

  it('debe desembolsar el monto total del crédito en la cuenta indicada', () => {
    const desembolso = Desembolso.registrar(
      { credito: CREDITO, banco: Banco.LAFISE, numeroCuenta: '000123456', desembolsadoPorId: 2 },
      AHORA,
    );

    expect(desembolso).toEqual({
      creditoId: 3,
      numeroCredito: 'CR-2026-000001',
      banco: Banco.LAFISE,
      numeroCuenta: '000123456',
      montoCentavos: 5_000_000,
      desembolsadoPorId: 2,
      fecha: AHORA,
    });
  });
});
