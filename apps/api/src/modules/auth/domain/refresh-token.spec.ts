import { unRefreshToken } from '../../../../test/support/auth-builders';

describe('RefreshToken', () => {
  const token = unRefreshToken().expiraEn('2026-10-02T12:00:00Z').build();

  it('debe estar vigente un milisegundo antes de su vencimiento', () => {
    expect(token.haExpirado(new Date('2026-10-02T11:59:59.999Z'))).toBe(false);
  });

  it('debe haber expirado exactamente en su fecha de vencimiento', () => {
    expect(token.haExpirado(new Date('2026-10-02T12:00:00Z'))).toBe(true);
  });

  it('debe estar revocado cuando tiene fecha de revocación', () => {
    expect(unRefreshToken().revocado().build().estaRevocado()).toBe(true);
  });

  it('debe no estar revocado cuando no tiene fecha de revocación', () => {
    expect(token.estaRevocado()).toBe(false);
  });

  it('debe pertenecer solo al usuario que lo emitió', () => {
    const deUsuario1 = unRefreshToken().deUsuario(1).build();

    expect(deUsuario1.perteneceA(1)).toBe(true);
    expect(deUsuario1.perteneceA(2)).toBe(false);
  });
});
